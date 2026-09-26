"use client";

import { useState } from "react";

export default function AutoScoreButton({ opportunityId }: { opportunityId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function calculate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/auto-score`, { method: "POST" });
      if (res.ok) setResult(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Automatische Score-Berechnung</h3>
      <p className="text-xs text-muted-foreground">
        Berechnet Score A und B basierend auf Pain Signals, Experiments und Assumptions
      </p>
      <button
        onClick={calculate}
        disabled={loading}
        className="inline-flex h-8 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Berechne..." : "Scores neu berechnen"}
      </button>
      {result && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="rounded bg-muted p-2 text-center">
            <div className="text-xs text-muted-foreground">Score A</div>
            <div className="text-xl font-bold">{result.scoreA}</div>
          </div>
          <div className="rounded bg-muted p-2 text-center">
            <div className="text-xs text-muted-foreground">Score B</div>
            <div className="text-xl font-bold">{result.scoreB}</div>
          </div>
          <div className="col-span-2 text-xs text-muted-foreground">
            Faktoren: {result.factors.painCount} Pain Signals · Ø Intensity {result.factors.avgPainIntensity} · {result.factors.expCompleted} Experiments · {result.factors.assumptionsTested} Assumptions
          </div>
        </div>
      )}
    </div>
  );
}
