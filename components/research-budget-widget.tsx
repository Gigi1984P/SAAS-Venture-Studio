"use client";

import { useEffect, useState } from "react";
import { Wallet, AlertTriangle, CheckCircle } from "lucide-react";

interface BudgetData {
  summary: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    agentRuns: number;
    canRun: boolean;
  };
}

export default function ResearchBudgetWidget({ opportunityId }: { opportunityId: string }) {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/opportunities/${opportunityId}/budget-check`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [opportunityId]);

  if (loading) return <div className="h-24 bg-gray-800 rounded animate-pulse" />;
  if (!data) return null;

  const { summary } = data;
  const pctUsed = summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" />
        Research Budget
      </h3>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-card p-2 text-center">
          <div className="text-lg font-bold text-white">€{summary.totalBudget}</div>
          <div className="text-xs text-muted-foreground">Budget</div>
        </div>
        <div className="rounded-md border border-border bg-card p-2 text-center">
          <div className="text-lg font-bold text-red-400">€{summary.totalSpent}</div>
          <div className="text-xs text-muted-foreground">Ausgegeben</div>
        </div>
        <div className="rounded-md border border-border bg-card p-2 text-center">
          <div className={`text-lg font-bold ${summary.remaining > 0 ? "text-green-400" : "text-red-400"}`}>
            €{summary.remaining}
          </div>
          <div className="text-xs text-muted-foreground">Verbleibend</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Auslastung</span>
          <span className="text-white">{Math.round(pctUsed)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${pctUsed > 90 ? "bg-red-500" : pctUsed > 70 ? "bg-amber-500" : "bg-green-500"}`}
            style={{ width: `${Math.min(100, pctUsed)}%` }}
          />
        </div>
      </div>

      {!summary.canRun && (
        <div className="flex items-center gap-2 rounded-md bg-red-950/20 border border-red-900/30 p-2 text-xs text-red-400">
          <AlertTriangle className="h-4 w-4" />
          Budget erschoepft. Keine neuen Agent-Runs moeglich.
        </div>
      )}
    </div>
  );
}
