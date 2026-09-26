"use client";

import { useState, useEffect } from "react";

export default function WeeklyDigestWidget() {
  const [digest, setDigest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchDigest() {
    setLoading(true);
    try {
      const res = await fetch("/api/weekly-digest");
      if (res.ok) setDigest(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDigest(); }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Lade Weekly Digest...</div>;
  if (!digest) return <div className="text-sm text-muted-foreground">Kein Digest verfügbar</div>;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Weekly Digest</h3>
        <button onClick={fetchDigest} className="text-xs text-muted-foreground hover:text-foreground">🔄 Aktualisieren</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded bg-muted p-2 text-center">
          <div className="text-xs text-muted-foreground">Neue Ideas</div>
          <div className="text-xl font-bold">{digest.newIdeas}</div>
        </div>
        <div className="rounded bg-muted p-2 text-center">
          <div className="text-xs text-muted-foreground">Neue Opportunities</div>
          <div className="text-xl font-bold">{digest.newOpportunities}</div>
        </div>
        <div className="rounded bg-muted p-2 text-center">
          <div className="text-xs text-muted-foreground">Pipeline MRR</div>
          <div className="text-xl font-bold">€{(digest.totalMRR || 0).toLocaleString()}</div>
        </div>
        <div className="rounded bg-muted p-2 text-center">
          <div className="text-xs text-muted-foreground">Offene Tasks</div>
          <div className="text-xl font-bold">{digest.pendingTasks}</div>
        </div>
      </div>

      {digest.scoreTrends?.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase">Score Änderungen</div>
          {digest.scoreTrends.slice(0, 5).map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>{s.opportunity || "Unbekannt"}</span>
              <span className="font-medium">{s.type}: {s.value}</span>
            </div>
          ))}
        </div>
      )}

      {digest.topTasks?.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase">Top Offene Tasks</div>
          {digest.topTasks.map((t: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>{t.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                t.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-muted"
              }`}>{t.priority}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
