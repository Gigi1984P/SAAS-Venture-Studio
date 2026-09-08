import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
  BarChart3,
  Layers,
  Activity,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Users,
  Lightbulb,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────
type PipelineStage = {
  key: string;
  label: string;
  count: number;
};

type FunnelStage = {
  label: string;
  count: number;
  pct: number;
  color: string;
};

type OppRow = {
  id: string;
  title: string;
  scoreA: number;
  scoreB: number;
  confidence: number;
  evidenceLevel: number;
  status: string;
  supporting: number;
  contradicting: number;
};

type TaskRow = {
  id: string;
  type: string;
  status: string;
  agent: string;
  createdAt: Date;
};

// ─── Helpers ───────────────────────────────────────────
const STATUS_META: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  discovered:      { label: "Discovered",    classes: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",       icon: <Search className="w-3 h-3" /> },
  pain_verified:   { label: "Pain Verified", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",    icon: <AlertCircle className="w-3 h-3" /> },
  scored:          { label: "Scored",        classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",        icon: <BarChart3 className="w-3 h-3" /> },
  experiment:      { label: "Experiment",    classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", icon: <Zap className="w-3 h-3" /> },
  build_approved:  { label: "Build Ready",   classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <CheckCircle2 className="w-3 h-3" /> },
  kill:            { label: "Killed",        classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",          icon: <XCircle className="w-3 h-3" /> },
  watch:           { label: "Watch",         classes: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",  icon: <Clock className="w-3 h-3" /> },
  validating:      { label: "Validating",    classes: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",        icon: <Activity className="w-3 h-3" /> },
};

function statusBadge(status: string) {
  const meta = STATUS_META[status] || { label: status, classes: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: <Minus className="w-3 h-3" /> };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.classes}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

const TASK_STATUS_META: Record<string, string> = {
  queued:       "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  running:      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  completed:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  failed:       "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  retry:        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  human_review: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

function confidencePct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function scoreTrend(score: number) {
  if (score >= 75) return { icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
  if (score >= 50) return { icon: <TrendingUp className="w-4 h-4" />, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" };
  if (score >= 30) return { icon: <Minus className="w-4 h-4" />, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20" };
  return { icon: <TrendingDown className="w-4 h-4" />, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" };
}

// ─── Main Page ─────────────────────────────────────────
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  // ── Parallel Data Fetch ─────────────────────────────
  const [
    totalOpportunities,
    activeVentures,
    avgConfidenceAgg,
    totalSignals,
    signalsDeduplicated,
    signalsRelevant,
    signalsVerified,
    signalsHighConfidence,
    pipelineCounts,
    opportunities,
    recentTasks,
    ventureCount,
  ] = await Promise.all([
    prisma.opportunity.count(),
    prisma.venture.count({ where: { status: { not: "sunset" } } }),
    prisma.opportunity.aggregate({ _avg: { confidence: true } }),
    prisma.signal.count(),
    prisma.signal.count({ where: { isDuplicate: false } }),
    prisma.signal.count({ where: { isDuplicate: false, isRelevant: true } }),
    prisma.signal.count({ where: { isDuplicate: false, isRelevant: true, verified: true } }),
    prisma.signal.count({ where: { isDuplicate: false, isRelevant: true, verified: true, confidence: { gte: 0.7 } } }),
    prisma.opportunity.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.opportunity.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        scoreA: true,
        scoreB: true,
        confidence: true,
        evidenceLevel: true,
        status: true,
        supportingEvidenceCount: true,
        contradictingEvidenceCount: true,
      },
    }),
    prisma.task.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.venture.count(),
  ]);

  const avgConfidence = avgConfidenceAgg._avg.confidence ?? 0;
  const totalEvidence = totalSignals;

  // ── Stats Cards ─────────────────────────────────────
  const stats = [
    {
      label: "Total Opportunities",
      value: totalOpportunities.toLocaleString("de-DE"),
      trend: totalOpportunities > 0 ? "+12%" : "—",
      trendUp: true,
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
    },
    {
      label: "Active Ventures",
      value: activeVentures.toLocaleString("de-DE"),
      trend: ventureCount > 0 ? `${Math.round((activeVentures / ventureCount) * 100)}% active` : "—",
      trendUp: true,
      icon: <Users className="w-5 h-5 text-blue-500" />,
    },
    {
      label: "Avg Confidence",
      value: confidencePct(avgConfidence),
      trend: avgConfidence >= 0.6 ? "Strong" : avgConfidence >= 0.4 ? "Moderate" : "Weak",
      trendUp: avgConfidence >= 0.5,
      icon: <Target className="w-5 h-5 text-emerald-500" />,
    },
    {
      label: "Total Evidence",
      value: totalEvidence.toLocaleString("de-DE"),
      trend: totalEvidence > 0 ? `${Math.round((signalsVerified / totalEvidence) * 100)}% verified` : "—",
      trendUp: true,
      icon: <Layers className="w-5 h-5 text-purple-500" />,
    },
  ];

  // ── Pipeline ──────────────────────────────────────
  const pipelineStages: PipelineStage[] = [
    { key: "discovered", label: "Discovered" },
    { key: "pain_verified", label: "Pain Verified" },
    { key: "scored", label: "Scored" },
    { key: "experiment", label: "Experiment" },
    { key: "build_approved", label: "Build Ready" },
  ];
  const pipelineMap = new Map(pipelineCounts.map((p) => [p.status, p._count.status]));
  const pipelineData = pipelineStages.map((s) => ({
    ...s,
    count: pipelineMap.get(s.key) ?? 0,
  }));

  // ── Evidence Funnel ───────────────────────────────
  const funnelRaw = [
    { label: "Raw Signals", count: totalSignals },
    { label: "Deduplicated", count: signalsDeduplicated },
    { label: "Relevant", count: signalsRelevant },
    { label: "Verified", count: signalsVerified },
    { label: "High Confidence", count: signalsHighConfidence },
  ];
  const funnel: FunnelStage[] = funnelRaw.map((s, i) => {
    const pct = i === 0 ? 100 : totalSignals > 0 ? Math.round((s.count / totalSignals) * 100) : 0;
    const prev = i > 0 ? funnelRaw[i - 1].count : s.count;
    const drop = i > 0 && prev > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0;
    let color = "text-emerald-600 dark:text-emerald-400";
    if (drop > 50) color = "text-red-500 dark:text-red-400";
    else if (drop > 25) color = "text-amber-500 dark:text-amber-400";
    else if (i > 0) color = "text-emerald-600 dark:text-emerald-400";
    return { ...s, pct, color, drop };
  });

  // ── Opportunities Table ────────────────────────────
  const oppRows: OppRow[] = opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    scoreA: o.scoreA,
    scoreB: o.scoreB,
    confidence: o.confidence,
    evidenceLevel: o.evidenceLevel,
    status: o.status,
    supporting: o.supportingEvidenceCount,
    contradicting: o.contradictingEvidenceCount,
  }));

  // ── Agent Tasks ────────────────────────────────────
  const tasks: TaskRow[] = recentTasks.map((t) => ({
    id: t.id,
    type: t.type,
    status: t.status,
    agent: t.agent,
    createdAt: t.createdAt,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Übersicht über Opportunities, Ventures und Agent-Activity
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Angemeldet als {session.user?.email}
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const trendColor = s.trendUp
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400";
          return (
            <div
              key={s.label}
              className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
                <div className="rounded-md bg-muted p-1.5">{s.icon}</div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-2xl font-bold tracking-tight text-card-foreground">
                  {s.value}
                </div>
                <span className={`text-xs font-medium ${trendColor}`}>{s.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pipeline + Funnel ───────────────────────── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Pipeline */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Opportunity Pipeline
            </h2>
            <span className="text-xs text-muted-foreground">
              {totalOpportunities} total
            </span>
          </div>
          <div className="flex flex-wrap items-stretch gap-2">
            {pipelineData.map((stage, idx) => {
              const isLast = idx === pipelineData.length - 1;
              return (
                <div key={stage.key} className="flex items-center gap-2">
                  <Link
                    href={`/opportunities?status=${stage.key}`}
                    className={`group flex flex-col items-center justify-center rounded-lg border px-4 py-3 min-w-[100px] transition-all hover:shadow-md hover:border-primary/50 ${
                      stage.count > 0
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-border"
                    }`}
                  >
                    <span className="text-lg font-bold text-foreground">{stage.count}</span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
                      {stage.label}
                    </span>
                  </Link>
                  {!isLast && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence Funnel */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Evidence Funnel
            </h2>
            <span className="text-xs text-muted-foreground">
              {totalSignals} signals
            </span>
          </div>
          <div className="space-y-3">
            {funnel.map((stage, idx) => (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="w-28 sm:w-32 text-xs font-medium text-muted-foreground shrink-0">
                  {stage.label}
                </div>
                <div className="flex-1">
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all"
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-xs font-semibold text-foreground">{stage.count}</span>
                </div>
                <div className="w-14 text-right flex items-center justify-end gap-1">
                  {idx > 0 && stage.drop > 0 && (
                    <span className={`text-[10px] font-medium ${stage.color}`}>
                      -{stage.drop}%
                    </span>
                  )}
                  {idx === 0 && (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      100%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Opportunity Radar Table ──────────────────── */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Opportunity Radar
          </h2>
          <Link
            href="/opportunities"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            Alle anzeigen <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                  Name
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                  Score A
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                  Score B
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                  Confidence
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                  Evidence
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                  + / −
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {oppRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Noch keine Opportunities vorhanden.
                  </td>
                </tr>
              )}
              {oppRows.map((o) => {
                const trend = scoreTrend(o.scoreA);
                return (
                  <tr
                    key={o.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/opportunities/${o.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {o.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ${trend.bg} ${trend.color}`}
                        >
                          {o.scoreA}
                        </span>
                        <span className={trend.color}>{trend.icon}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold bg-secondary text-secondary-foreground">
                          {o.scoreB}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <span className={`text-xs font-semibold ${o.confidence >= 0.7 ? "text-emerald-600 dark:text-emerald-400" : o.confidence >= 0.4 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}>
                          {confidencePct(o.confidence)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{o.evidenceLevel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="w-3 h-3" /> {o.supporting}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 dark:text-red-400">
                          <TrendingDown className="w-3 h-3" /> {o.contradicting}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(o.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Agent Activity ───────────────────────────── */}
      {tasks.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Agent Activity
            </h2>
            <span className="text-xs text-muted-foreground">Letzte 5 Tasks</span>
          </div>
          <div className="space-y-2">
            {tasks.map((t) => {
              const statusClass = TASK_STATUS_META[t.status] || TASK_STATUS_META.queued;
              return (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground capitalize">
                        {t.type.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Agent: {t.agent}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                      {t.status}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
