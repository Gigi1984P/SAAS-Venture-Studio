"use client";

import { useState, useEffect } from "react";

export default function DashboardWidgets() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  if (!stats) return <div className="text-sm text-muted-foreground">Lade...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Pipeline Value */}
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Pipeline Value</div>
        <div className="text-2xl font-bold mt-1">€{(stats.totalMRR || 0).toLocaleString()} / Monat</div>
        <div className="text-xs text-muted-foreground mt-1">{stats.ventureCount} Ventures · {stats.opportunityCount} Opportunities</div>
      </div>

      {/* Avg Score Trend */}
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Ø Score A</div>
        <div className="text-2xl font-bold mt-1">{Math.round(stats.avgScoreA || 0)}</div>
        <div className={`text-xs mt-1 ${stats.scoreTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {stats.scoreTrend >= 0 ? "▲" : "▼"} {Math.abs(Math.round(stats.scoreTrend || 0))} vs letzte Woche
        </div>
      </div>

      {/* Velocity */}
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Velocity</div>
        <div className="text-2xl font-bold mt-1">{stats.velocity || 0} / Woche</div>
        <div className="text-xs text-muted-foreground mt-1">Ideas → Opportunities konvertiert</div>
      </div>

      {/* Validation Progress */}
      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Validation Progress</div>
        <div className="text-2xl font-bold mt-1">{Math.round(stats.validationProgress || 0)}%</div>
        <div className="w-full h-2 bg-muted rounded-full mt-2">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${stats.validationProgress || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
