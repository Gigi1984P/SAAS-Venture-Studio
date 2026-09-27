"use client";

import { useState, useEffect } from "react";

export default function VentureReadinessWidget() {
  const [readiness, setReadiness] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/automations/batch2?type=readiness")
      .then(r => r.json())
      .then(data => setReadiness(data.filter((x: any) => x.meetsThreshold)));
  }, []);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">🚀 Venture Ready ({readiness.length})</h3>
      {readiness.slice(0, 3).map(r => (
        <div key={r.id} className="flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">Score A: {r.scoreA} | B: {r.scoreB}</div>
            <div className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("de-DE")}</div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Ready</span>
        </div>
      ))}
      {readiness.length === 0 && <div className="text-xs text-muted-foreground">Noch keine Venture-Ready Opportunities</div>}
    </div>
  );
}
