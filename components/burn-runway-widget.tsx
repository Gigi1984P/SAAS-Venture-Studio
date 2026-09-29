"use client";

import { useState, useEffect } from "react";

export default function BurnRunwayWidget({ ventureId }: { ventureId?: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (ventureId) fetchData();
  }, [ventureId]);

  async function fetchData() {
    const res = await fetch(`/api/financials?ventureId=${ventureId}`);
    if (res.ok) {
      const data = await res.json();
      setMetrics(data.metrics);
      setRecords(data.records);
    }
  }

  if (!ventureId) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-semibold mb-2">🔥 Burn Rate & Runway</h3>
        <p className="text-sm text-muted-foreground">Wähle ein Venture aus, um Finanzdaten zu sehen</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-sm font-semibold">🔥 Burn Rate & Runway</h3>

      {metrics && (
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-md bg-red-50">
            <div className="text-xl font-bold text-red-700">€{metrics.monthlyBurn.toLocaleString()}</div>
            <div className="text-xs text-red-600">Monatliche Kosten</div>
          </div>
          <div className="text-center p-3 rounded-md bg-green-50">
            <div className="text-xl font-bold text-green-700">€{metrics.monthlyRevenue.toLocaleString()}</div>
            <div className="text-xs text-green-600">Monatliche Einnahmen</div>
          </div>
          <div className="text-center p-3 rounded-md bg-orange-50">
            <div className="text-xl font-bold text-orange-700">€{metrics.netBurn.toLocaleString()}</div>
            <div className="text-xs text-orange-600">Net Burn</div>
          </div>
          <div className="text-center p-3 rounded-md bg-blue-50">
            <div className="text-xl font-bold text-blue-700">
              {metrics.runwayMonths ? `${metrics.runwayMonths} Mo` : "∞"}
            </div>
            <div className="text-xs text-blue-600">Runway</div>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {records.slice(0, 10).map((r: any) => (
          <div key={r.id} className="flex items-center justify-between text-sm">
            <span className={r.recordType === "revenue" ? "text-green-600" : "text-red-600"}>
              {r.recordType === "revenue" ? "+" : "-"}€{Number(r.amount).toLocaleString()}
            </span>
            <span className="text-muted-foreground">{r.category}</span>
            <span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString("de-DE")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
