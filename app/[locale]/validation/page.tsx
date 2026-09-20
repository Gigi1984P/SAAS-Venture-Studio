import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Plus,
} from "lucide-react";

const STATUS_META: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  INTAKE: { label: "Intake", classes: "bg-slate-100 text-slate-700", icon: <Clock className="w-3 h-3" /> },
  HYPOTHESES: { label: "Hypothesen", classes: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-3 h-3" /> },
  EXPERIMENT_DESIGN: { label: "Experiment Design", classes: "bg-blue-100 text-blue-700", icon: <FlaskConical className="w-3 h-3" /> },
  RUNNING: { label: "Running", classes: "bg-purple-100 text-purple-700", icon: <TrendingUp className="w-3 h-3" /> },
  EVIDENCE_REVIEW: { label: "Evidence Review", classes: "bg-cyan-100 text-cyan-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  IC_READY: { label: "IC Ready", classes: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  KILL: { label: "Kill", classes: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
  ITERATE: { label: "Iterate", classes: "bg-yellow-100 text-yellow-700", icon: <TrendingDown className="w-3 h-3" /> },
  INVEST: { label: "Invest", classes: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
};

function statusBadge(status: string) {
  const meta = STATUS_META[status] || { label: status, classes: "bg-gray-100 text-gray-700", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.classes}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

export default async function ValidationPage() {
  const t = await getTranslations("Validation");
  const runs = await prisma.validationRun.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: { select: { id: true, title: true, scoreA: true, scoreB: true } },
      _count: {
        select: {
          hypotheses: true,
          experiments: true,
          prospects: true,
          evidenceObjects: true,
          hardGates: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Validation Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Systematische Validierung von Opportunities vor Venture Build
          </p>
        </div>
        <Link
          href="/validation/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Neuer Sprint
        </Link>
      </div>

      {/* Pipeline Stages Overview */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {["INTAKE", "HYPOTHESES", "RUNNING", "IC_READY", "INVEST/KILL"].map((stage) => {
          const count = runs.filter((r) => {
            if (stage === "INVEST/KILL") return ["INVEST", "KILL", "ITERATE"].includes(r.status);
            return r.status === stage;
          }).length;
          return (
            <div key={stage} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stage}</div>
              <div className="mt-1 text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Runs Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-base font-semibold">Validation Sprints</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sprint</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Opportunity</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">H / E / P / Ev</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Budget</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Confidence</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Noch keine Validation Sprints vorhanden.
                  </td>
                </tr>
              )}
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/validation/runs/${run.id}`} className="font-medium hover:text-primary hover:underline">
                      {run.sprintName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {run.opportunity?.title || "—"}
                  </td>
                  <td className="px-4 py-3">{statusBadge(run.status)}</td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {run._count.hypotheses} / {run._count.experiments} / {run._count.prospects} / {run._count.evidenceObjects}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span className={run.spentEur > run.maxBudgetEur ? "text-red-500 font-medium" : ""}>
                      €{run.spentEur?.toLocaleString("de-DE")} / €{run.maxBudgetEur?.toLocaleString("de-DE")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {run.overallValidationConfidence !== null && (
                      <span className={`text-xs font-semibold ${
                        run.overallValidationConfidence >= 0.7 ? "text-emerald-600" :
                        run.overallValidationConfidence >= 0.4 ? "text-amber-600" : "text-red-500"
                      }`}>
                        {Math.round(run.overallValidationConfidence * 100)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/validation/runs/${run.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
