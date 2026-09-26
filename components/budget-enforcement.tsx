"use client";

import { useState, useEffect } from "react";

export default function BudgetEnforcementWidget({ opportunityId }: { opportunityId: string }) {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, [opportunityId]);

  async function fetchBudgets() {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/budget/check`);
      if (res.ok) setBudgets(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade Budget...</div>;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Budget Enforcement</h3>
      {budgets.map((b) => {
        const budgetPct = b.budgetEur > 0 ? (b.spentEur / b.budgetEur) * 100 : 0;
        const runsPct = b.maxAgentRuns > 0 ? (b.taskCount / b.maxAgentRuns) * 100 : 0;
        const evidencePct = b.minimumEvidence > 0 ? Math.min(100, (b.evidenceCount / b.minimumEvidence) * 100) : 0;

        return (
          <div key={b.id} className="space-y-2 text-sm">
            <div className="font-medium">{`Phase: ${b.phase}`}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Budget €{b.spentEur} / €{b.budgetEur}</span>
                <span className={budgetPct >= 100 ? "text-red-500 font-bold" : ""}>{budgetRemaining <= 0 ? "EXHAUSTED" : `€${b.budgetRemaining} übrig`}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetPct >= 100 ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, budgetPct)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Agent Runs {b.taskCount} / {b.maxAgentRuns}</span>
                <span>{b.runsRemaining} übrig</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${runsPct >= 100 ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, runsPct)}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Evidence {b.evidenceCount} / {b.minimumEvidence}</span>
                <span className={evidencePct >= 100 ? "text-green-600" : "text-yellow-600"}>
                  {evidencePct >= 100 ? "✓" : `${b.evidenceNeeded} fehlt`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${evidencePct >= 100 ? "bg-green-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(100, evidencePct)}%` }}
                />
              </div>
            </div>
            {budgetPct >= 100 && (
              <div className="text-xs text-red-600 font-bold">⚠ Budget aufgebraucht — Keine weiteren Tasks möglich</div>
            )}
            {runsPct >= 100 && (
              <div className="text-xs text-red-600 font-bold">⚠ Max Agent Runs erreicht</div>
            )}
          </div>
        );
      })}
      {budgets.length === 0 && <div className="text-sm text-muted-foreground">Kein Budget konfiguriert</div>}
    </div>
  );
}
