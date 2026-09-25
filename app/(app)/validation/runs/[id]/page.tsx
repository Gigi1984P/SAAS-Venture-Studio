import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowLeft,
  Users,
  Layers,
  Target,
  Shield,
  FileText,
} from "lucide-react";

const STATUS_META: Record<string, { label: string; classes: string; icon: any }> = {
  INTAKE: { label: "Intake", classes: "bg-slate-100 text-slate-700", icon: Clock },
  HYPOTHESES: { label: "Hypothesen", classes: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  EXPERIMENT_DESIGN: { label: "Experiment Design", classes: "bg-blue-100 text-blue-700", icon: FlaskConical },
  RUNNING: { label: "Running", classes: "bg-purple-100 text-purple-700", icon: TrendingUp },
  EVIDENCE_REVIEW: { label: "Evidence Review", classes: "bg-cyan-100 text-cyan-700", icon: CheckCircle2 },
  IC_READY: { label: "IC Ready", classes: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  KILL: { label: "Kill", classes: "bg-red-100 text-red-700", icon: XCircle },
  ITERATE: { label: "Iterate", classes: "bg-yellow-100 text-yellow-700", icon: TrendingDown },
  INVEST: { label: "Invest", classes: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  INTAKE: ["HYPOTHESES"],
  HYPOTHESES: ["EXPERIMENT_DESIGN"],
  EXPERIMENT_DESIGN: ["RUNNING"],
  RUNNING: ["EVIDENCE_REVIEW"],
  EVIDENCE_REVIEW: ["IC_READY"],
  IC_READY: ["KILL", "ITERATE", "INVEST"],
};

export default async function ValidationRunPage({ params }: { params: { id: string } }) {
  const run = await prisma.validationRun.findUnique({
    where: { id: params.id },
    include: {
      opportunity: true,
      hypotheses: { orderBy: { priorityScore: "desc" } },
      experiments: true,
      prospects: { include: { interviews: { select: { id: true } } } },
      evidenceObjects: { take: 20, orderBy: { createdAt: "desc" } },
      hardGates: true,
      offers: true,
      pilots: true,
      paymentSignals: true,
      technicalTests: true,
      conciergeRuns: true,
      validationMemos: true,
    },
  });

  if (!run) {
    return (
      <div className="space-y-4">
        <Link href="/validation" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Pipeline
        </Link>
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="text-lg font-medium">Validation Run nicht gefunden</div>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[run.status] || STATUS_META.INTAKE;
  const Icon = meta.icon;

  const allGatesPassed = run.hardGates.length > 0 && run.hardGates.every((g: any) => g.passed);
  const anyGateFailed = run.hardGates.some((g: any) => !g.passed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/validation" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Pipeline
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${meta.classes}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{run.sprintName}</h1>
              <p className="text-sm text-muted-foreground">
                {run.opportunity?.title || "—"} · {run.timeBoxDays} Tage · €{run.maxBudgetEur?.toLocaleString("de-DE")} Budget
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${meta.classes}`}>
              <Icon className="w-3.5 h-3.5" /> {meta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Hypothesen", value: run.hypotheses.length, icon: Target },
          { label: "Experiments", value: run.experiments.length, icon: FlaskConical },
          { label: "Prospects", value: run.prospects.length, icon: Users },
          { label: "Evidence", value: run.evidenceObjects.length, icon: Layers },
          { label: "Hard Gates", value: `${run.hardGates.filter((g: any) => g.passed).length}/${run.hardGates.length}`, icon: Shield },
          { label: "Confidence", value: run.overallValidationConfidence ? `${Math.round(run.overallValidationConfidence * 100)}%` : "—", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <s.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            </div>
            <div className="mt-1 text-xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* State Machine + Budget */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Progress */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Sprint Fortschritt</h2>
          <div className="space-y-2">
            {(VALID_TRANSITIONS[run.status] || []).length > 0 ? (
              <form action={`/api/validation/runs/${run.id}`} method="POST"
                className="flex flex-wrap gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await fetch(`/api/validation/runs/${run.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: fd.get("status") }),
                  });
                  window.location.reload();
                }}
              >
                {(VALID_TRANSITIONS[run.status] || []).map((next) => (
                  <button
                    key={next}
                    name="status"
                    value={next}
                    type="submit"
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Zu {STATUS_META[next]?.label || next}
                  </button>
                ))}
              </form>
            ) : (
              <div className="text-sm text-muted-foreground">Finaler Status erreicht.</div>
            )}
          </div>
        </div>

        {/* Budget */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Budget</h2>
            <span className={`text-xs font-medium ${run.spentEur > run.maxBudgetEur ? "text-red-500" : "text-muted-foreground"}`}>
              €{run.spentEur?.toLocaleString("de-DE")} / €{run.maxBudgetEur?.toLocaleString("de-DE")}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (run.spentEur / (run.maxBudgetEur || 1)) > 0.9 ? "bg-red-500" :
                (run.spentEur / (run.maxBudgetEur || 1)) > 0.7 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, (run.spentEur / (run.maxBudgetEur || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hard Gates */}
      {run.hardGates.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Hard Gates
            </h2>
            {allGatesPassed && (
              <span className="text-xs font-medium text-emerald-600">Alle bestanden ✓</span>
            )}
            {anyGateFailed && !allGatesPassed && (
              <span className="text-xs font-medium text-red-500">Nicht alle bestanden</span>
            )}
          </div>
          <div className="space-y-2">
            {run.hardGates.map((gate: any) => (
              <div key={gate.id} className="flex items-center justify-between rounded-md border px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{gate.gateType}</div>
                  {gate.description && (
                    <div className="text-xs text-muted-foreground">{gate.description}</div>
                  )}
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  gate.passed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {gate.passed ? <><CheckCircle2 className="w-3 h-3 mr-0.5" /> Bestanden</> : "Offen"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hypothesen + Evidence Side by Side */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Hypothesen */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Hypothesen
            </h2>
            <span className="text-xs text-muted-foreground">
              {run.hypotheses.filter((h: any) => h.status === "validated").length}/{run.hypotheses.length} validiert
            </span>
          </div>
          <div className="space-y-2">
            {run.hypotheses.length === 0 && (
              <div className="text-sm text-muted-foreground">Noch keine Hypothesen.</div>
            )}
            {run.hypotheses.map((h: any) => (
              <div key={h.id} className="rounded-md border px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-muted-foreground">{h.code}</span>
                    <span className="text-sm font-medium">{h.statement}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    h.status === "validated" ? "bg-emerald-100 text-emerald-700" :
                    h.status === "invalidated" ? "bg-red-100 text-red-700" :
                    h.status === "testing" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {h.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {h.priorityScore && <span>Priority: {h.priorityScore.toFixed(2)}</span>}
                  {h.budgetEur && <span>Budget: €{h.budgetEur}</span>}
                  <span>Confidence: {h.startingConfidence} → {h.finalConfidence ?? "?"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Evidence
            </h2>
            <span className="text-xs text-muted-foreground">{run.evidenceObjects.length} total</span>
          </div>
          <div className="space-y-2">
            {run.evidenceObjects.length === 0 && (
              <div className="text-sm text-muted-foreground">Noch keine Evidence Objects.</div>
            )}
            {run.evidenceObjects.map((ev: any) => (
              <div key={ev.id} className="rounded-md border px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    ev.direction === "supporting" ? "bg-emerald-100 text-emerald-700" :
                    ev.direction === "contradicting" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {ev.direction}
                  </span>
                  <span className="text-xs text-muted-foreground">{ev.strength}</span>
                  <span className="text-xs font-mono text-muted-foreground">{ev.evidenceId}</span>
                </div>
                <div className="mt-0.5 text-sm">{ev.observation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Pipeline */}
      {run.prospects.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Sales Pipeline
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">Company</th>
                  <th className="px-3 py-2 text-left font-medium">Contact</th>
                  <th className="px-3 py-2 text-center font-medium">Role</th>
                  <th className="px-3 py-2 text-center font-medium">Status</th>
                  <th className="px-3 py-2 text-center font-medium">Interviews</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {run.prospects.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2">{p.companyName}</td>
                    <td className="px-3 py-2">{p.contactName || "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {p.isBuyer && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Buyer</span>}
                        {p.isChampion && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">Champion</span>}
                        {p.isBlocker && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">Blocker</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs font-medium">{p.pipelineStatus}</span>
                    </td>
                    <td className="px-3 py-2 text-center">{p.interviews.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pilots + Payment Signals */}
      {(run.pilots.length > 0 || run.paymentSignals.length > 0) && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {run.pilots.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold mb-4">Pilots</h2>
              <div className="space-y-2">
                {run.pilots.map((pilot: any) => (
                  <div key={pilot.id} className="rounded-md border px-4 py-3">
                    <div className="font-medium">{pilot.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Automation: {pilot.automationRate ?? "—"}% · Error Rate: {pilot.errorRate ?? "—"}% · Cycle: {pilot.cycleTime ?? "—"}min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {run.paymentSignals.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold mb-4">Payment Signals</h2>
              <div className="space-y-2">
                {run.paymentSignals.map((ps: any) => (
                  <div key={ps.id} className="flex items-center justify-between rounded-md border px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{ps.signalType}</div>
                      <div className="text-xs text-muted-foreground">{ps.status}</div>
                    </div>
                    <div className="font-bold">€{ps.amountEur.toLocaleString("de-DE")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
