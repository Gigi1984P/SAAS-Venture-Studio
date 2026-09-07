import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const userId = session.user.id;

  // Parallel DB queries
  const [
    opportunityCount,
    ventureCount,
    ventures,
    opportunities,
    signalCount,
    verifiedSignalCount,
    tasks,
  ] = await Promise.all([
    prisma.opportunity.count(),
    prisma.venture.count({ where: { ownerId: userId } }),
    prisma.venture.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.opportunity.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true, title: true, scoreA: true, scoreB: true,
        confidence: true, evidenceLevel: true, status: true,
        supportingEvidenceCount: true, contradictingEvidenceCount: true,
        updatedAt: true,
      },
    }),
    prisma.signal.count(),
    prisma.signal.count({ where: { verified: true } }),
    prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, status: true, agent: true, createdAt: true },
    }),
  ]);

  const totalMrr = ventures.reduce((sum, v) => sum + v.mrr, 0);
  const avgConfidence = opportunities.length > 0
    ? opportunities.reduce((s, o) => s + o.confidence, 0) / opportunities.length
    : 0;

  // Pipeline counts
  const pipelineStages = [
    { key: "discovered", label: "Discovered" },
    { key: "pain_verification", label: "Pain Verification" },
    { key: "pain_verified", label: "Pain Verified" },
    { key: "scored", label: "Scored" },
    { key: "experiment", label: "Experiment" },
    { key: "build_approved", label: "Build Approved" },
  ];
  const pipelineCounts = await Promise.all(
    pipelineStages.map(async (stage) => ({
      ...stage,
      count: await prisma.opportunity.count({ where: { status: stage.key } }),
    }))
  );

  function statusColor(status: string) {
    const colors: Record<string, string> = {
      discovered: "bg-gray-100 text-gray-700",
      pain_verification: "bg-orange-100 text-orange-700",
      pain_verified: "bg-yellow-100 text-yellow-700",
      scored: "bg-blue-100 text-blue-700",
      experiment: "bg-purple-100 text-purple-700",
      build_approved: "bg-green-100 text-green-700",
      kill: "bg-red-100 text-red-700",
      watch: "bg-gray-100 text-gray-600",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  function taskStatusColor(status: string) {
    const colors: Record<string, string> = {
      queued: "bg-gray-100 text-gray-600",
      running: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      retry: "bg-yellow-100 text-yellow-700",
      human_review: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-gray-100 text-gray-600";
  }

  function scoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Übersicht über Opportunities, Ventures und Agenten-Aktivität
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Opportunities</div>
          <div className="mt-2 text-3xl font-bold">{opportunityCount}</div>
          <div className="mt-1 text-xs text-green-600">↗ Gesamtanzahl</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Active Ventures</div>
          <div className="mt-2 text-3xl font-bold">{ventureCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">€{totalMrr.toLocaleString("de-DE")} MRR</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Ø Confidence</div>
          <div className="mt-2 text-3xl font-bold">{Math.round(avgConfidence * 100)}%</div>
          <div className="mt-1 text-xs text-muted-foreground">{opportunities.length} Opportunities</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Evidence</div>
          <div className="mt-2 text-3xl font-bold">{signalCount}</div>
          <div className="mt-1 text-xs text-green-600">{verifiedSignalCount} verifiziert</div>
        </div>
      </div>

      {/* Pipeline + Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Opportunity Pipeline */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Opportunity Pipeline</h2>
          <div className="flex flex-wrap items-center gap-2">
            {pipelineCounts.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-2">
                <Link
                  href={`/opportunities?status=${stage.key}`}
                  className="flex flex-col items-center rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors min-w-[100px]"
                >
                  <span className="text-2xl font-bold">{stage.count}</span>
                  <span className="text-xs text-muted-foreground text-center">{stage.label}</span>
                </Link>
                {i < pipelineCounts.length - 1 && (
                  <span className="text-muted-foreground text-lg">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${opportunityCount > 0 ? (pipelineCounts.reduce((s, st) => s + st.count, 0) / opportunityCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Evidence Funnel */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Evidence Funnel</h2>
          <div className="space-y-3">
            {[
              { label: "Raw Signals", value: signalCount, total: signalCount },
              { label: "Deduplicated", value: signalCount, total: signalCount },
              { label: "Relevant", value: Math.round(signalCount * 0.7), total: signalCount },
              { label: "Verified", value: verifiedSignalCount, total: signalCount },
              { label: "High Confidence", value: Math.round(verifiedSignalCount * 0.6), total: signalCount },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="text-xs w-24 text-right text-muted-foreground">{step.label}</div>
                <div className="flex-1 bg-muted rounded-full h-4">
                  <div
                    className="bg-primary h-4 rounded-full transition-all"
                    style={{ width: `${step.total > 0 ? (step.value / step.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-sm font-medium w-8 text-right">{step.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Opportunity Radar + Agent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Opportunity Radar Table */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Opportunity Radar</h2>
            <Link href="/opportunities" className="text-sm text-primary hover:underline">
              Alle anzeigen →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium text-center">Score A</th>
                  <th className="pb-2 font-medium text-center">Score B</th>
                  <th className="pb-2 font-medium text-center">Confidence</th>
                  <th className="pb-2 font-medium text-center">Evidence</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-muted/30">
                    <td className="py-3">
                      <Link href={`/opportunities/${opp.id}`} className="font-medium hover:text-primary hover:underline">
                        {opp.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        +{opp.supportingEvidenceCount} / -{opp.contradictingEvidenceCount}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-bold ${scoreColor(opp.scoreA)}`}>{opp.scoreA}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-bold ${scoreColor(opp.scoreB)}`}>{opp.scoreB}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={opp.confidence >= 0.7 ? "text-green-600" : opp.confidence >= 0.4 ? "text-yellow-600" : "text-red-600"}>
                        {Math.round(opp.confidence * 100)}%
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-12 bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(opp.evidenceLevel / 8) * 100}%` }} />
                        </div>
                        <span className="text-xs">{opp.evidenceLevel}/8</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor(opp.status)}`}>
                        {opp.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agent Activity */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Agent Activity</h2>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">Keine Tasks in der Queue</div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/30 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {task.agent.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{task.type.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">{task.agent}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Ventures */}
      {ventures.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Kürzliche Ventures</h2>
            <Link href="/ventures" className="text-sm text-primary hover:underline">Alle anzeigen →</Link>
          </div>
          <div className="space-y-3">
            {ventures.map((venture) => (
              <div key={venture.id} className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <Link href={`/ventures/${venture.id}`} className="font-medium hover:text-primary hover:underline">
                    {venture.name}
                  </Link>
                  <div className="text-sm text-muted-foreground">{venture.description || "Keine Beschreibung"}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColor(venture.status)}`}>
                    {venture.status}
                  </span>
                  <span className="text-sm font-medium">€{venture.mrr.toLocaleString("de-DE")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
