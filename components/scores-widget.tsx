"use client";

import { useState, useEffect } from "react";

const SCORE_A_FACTORS = [
  { key: "pain_severity", label: "Pain Severity", max: 15 },
  { key: "frequency", label: "Frequency", max: 10 },
  { key: "economic_impact", label: "Economic Impact", max: 15 },
  { key: "existing_spend", label: "Existing Spend", max: 10 },
  { key: "buyer_clarity", label: "Buyer Clarity", max: 10 },
  { key: "reachability", label: "Reachability", max: 10 },
  { key: "competition_gap", label: "Competition Gap", max: 10 },
  { key: "switching_motivation", label: "Switching Motivation", max: 10 },
  { key: "recurring_nature", label: "Recurring Nature", max: 5 },
  { key: "evidence_quality", label: "Evidence Quality", max: 5 },
];

const SCORE_B_FACTORS = [
  { key: "mvp_simplicity", label: "MVP Simplicity", max: 20 },
  { key: "ai_leverage", label: "AI/Automation Leverage", max: 15 },
  { key: "gross_margin", label: "Gross Margin Potential", max: 15 },
  { key: "distribution_advantage", label: "Distribution Advantage", max: 20 },
  { key: "low_support_burden", label: "Low Support Burden", max: 10 },
  { key: "expansion_potential", label: "Expansion Potential", max: 10 },
  { key: "defensibility", label: "Defensibility Potential", max: 10 },
];

export default function ScoresWidget({ opportunity }: { opportunity: any }) {
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    if (opportunity?.id) fetchScores();
  }, [opportunity?.id]);

  async function fetchScores() {
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}/scores`);
      if (res.ok) setScores(await res.json());
    } catch (err) { console.error(err); }
  }

  async function saveScores() {
    const payloadA = {
      scoreType: "opportunity_quality",
      value: opportunity.scoreA,
      maxValue: 100,
    };
    const payloadB = {
      scoreType: "venture_fit",
      value: opportunity.scoreB,
      maxValue: 100,
    };
    await Promise.all([
      fetch(`/api/opportunities/${opportunity.id}/scores`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payloadA) }),
      fetch(`/api/opportunities/${opportunity.id}/scores`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payloadB) }),
    ]);
    await fetchScores();
  }

  function factorBar(label: string, value: number, max: number) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="w-36 text-xs text-muted-foreground shrink-0">{label}</div>
        <div className="flex-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="w-12 text-right text-xs font-medium">{value}/{max}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scores</h2>
        <button onClick={saveScores} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Snapshot speichern</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold text-muted-foreground mb-2">Score A — Opportunity Quality ({opportunity.scoreA}/100)</div>
          {SCORE_A_FACTORS.map((f) => factorBar(f.label, opportunity[f.key as keyof typeof opportunity] || 0, f.max))}
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold text-muted-foreground mb-2">Score B — Venture Fit ({opportunity.scoreB}/100)</div>
          {SCORE_B_FACTORS.map((f) => factorBar(f.label, opportunity[f.key as keyof typeof opportunity] || 0, f.max))}
        </div>
      </div>

      {scores.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-semibold mb-2">Historie</div>
          <div className="space-y-1">
            {scores.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between text-xs">
                <span>{s.scoreType} · v{s.version}</span>
                <span className="font-medium">{s.value}/{s.maxValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
