"use client";

import { useState, useEffect } from "react";

export default function UnitEconomicsWidget({ opportunityId }: { opportunityId: string }) {
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModel();
  }, [opportunityId]);

  async function fetchModel() {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/unit-economics`);
      if (res.ok) setModel(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade...</div>;

  // Fallback mock values
  const m = model || {
    cac: 500,
    ltv: 2500,
    monthlyChurn: 0.05,
    arpu: 200,
    grossMargin: 0.7,
    paybackMonths: 0,
  };
  m.paybackMonths = m.cac / (m.arpu * m.grossMargin);
  m.ltv = (m.arpu * m.grossMargin) / m.monthlyChurn;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Unit Economics</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "CAC", value: `€${m.cac.toLocaleString("de-DE")}`, color: "text-red-600" },
          { label: "LTV", value: `€${Math.round(m.ltv).toLocaleString("de-DE")}`, color: "text-green-600" },
          { label: "LTV:CAC", value: (m.ltv / m.cac).toFixed(1) + "x", color: (m.ltv / m.cac) > 3 ? "text-green-600" : "text-yellow-600" },
          { label: "ARPU", value: `€${m.arpu}`, color: "text-blue-600" },
          { label: "Gross Margin", value: `${Math.round(m.grossMargin * 100)}%`, color: "text-emerald-600" },
          { label: "Payback", value: `${m.paybackMonths.toFixed(1)} Mo`, color: m.paybackMonths < 12 ? "text-green-600" : "text-red-600" },
        ].map((item) => (
          <div key={item.label} className="rounded-md border bg-background p-3 text-center">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
