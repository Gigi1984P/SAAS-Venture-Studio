"use client";

import { useState, useEffect } from "react";

export default function StagnationAlertsWidget() {
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/automations/batch2?type=score_trends")
      .then(r => r.json())
      .then(data => setTrends(data.filter((x: any) => x.alertSent && x.daysSinceChange >= 7)));
  }, []);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">⚠️ Stagnation Alerts ({trends.length})</h3>
      {trends.slice(0, 3).map(t => (
        <div key={t.id} className="flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">Score stagniert seit {t.daysSinceChange} Tagen</div>
            <div className="text-xs text-muted-foreground">A: {t.scoreA} | B: {t.scoreB}</div>
          </div>
        </div>
      ))}
      {trends.length === 0 && <div className="text-xs text-muted-foreground">Keine stagnierenden Scores</div>}
    </div>
  );
}
