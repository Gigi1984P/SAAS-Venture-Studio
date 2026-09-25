"use client";

import { useState } from "react";

export default function InvestmentMemo({ opportunity }: { opportunity: any }) {
  const [showForm, setShowForm] = useState(false);
  const [memo, setMemo] = useState({
    decision: "ITERATE",
    rationale: "",
    metrics: {
      pilotCustomers: 0,
      avgMonthlyRevenue: 0,
      cacEstimate: 0,
      paybackMonths: 0,
    },
  });

  async function generate() {
    setShowForm(false);
    // In einer realen Implementierung: POST an /api/opportunities/{id}/memo
    alert("Investment Memo generiert! (Hier würde ein API-Call folgen)");
  }

  const decisionColors: Record<string, string> = {
    INVEST: "bg-green-100 text-green-700 border-green-200",
    ITERATE: "bg-yellow-100 text-yellow-700 border-yellow-200",
    KILL: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Investment Memo</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
        >
          {showForm ? "Schließen" : "+ Memo erstellen"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate();
          }}
          className="space-y-3 rounded-md border bg-muted/30 p-3"
        >
          <select
            value={memo.decision}
            onChange={(e) => setMemo({ ...memo, decision: e.target.value })}
            className="block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="INVEST">INVEST — Go</option>
            <option value="ITERATE">ITERATE — Mehr Daten</option>
            <option value="KILL">KILL — Stop</option>
          </select>
          <textarea
            required
            value={memo.rationale}
            onChange={(e) => setMemo({ ...memo, rationale: e.target.value })}
            placeholder="Rationale für die Entscheidung..."
            className="block w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Pilot-Kunden"
              value={memo.metrics.pilotCustomers}
              onChange={(e) => setMemo({ ...memo, metrics: { ...memo.metrics, pilotCustomers: Number(e.target.value) } })}
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Ø MRR €"
              value={memo.metrics.avgMonthlyRevenue}
              onChange={(e) => setMemo({ ...memo, metrics: { ...memo.metrics, avgMonthlyRevenue: Number(e.target.value) } })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
            Memo speichern
          </button>
        </form>
      )}

      {opportunity?.memo ? (
        <div className={`rounded-md border p-4 ${decisionColors[opportunity.memo.decision] || "bg-gray-50"}`}>
          <div className="text-sm font-bold uppercase tracking-wide mb-2">{opportunity.memo.decision}</div>
          <p className="text-sm">{opportunity.memo.rationale}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>Piloten: {opportunity.memo.metrics?.pilotCustomers || 0}</div>
            <div>Ø MRR: €{opportunity.memo.metrics?.avgMonthlyRevenue || 0}</div>
            <div>Payback: {opportunity.memo.metrics?.paybackMonths || 0} Mo</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Noch kein Investment Memo erstellt.</p>
      )}
    </div>
  );
}
