"use client";

import { useState, useEffect } from "react";

export default function SignalDiscoveryWidget({ opportunityId }: { opportunityId: string }) {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/signals/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addAsEvidence(signalId: string) {
    try {
      await fetch(`/api/opportunities/${opportunityId}/signals/${signalId}/promote`, {
        method: "POST",
      });
      alert("Zu Evidence hinzugefügt!");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Signal Discovery</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Schlüsselwörter, Branche, Pain..."
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button
          onClick={search}
          disabled={loading}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Suche..." : "Suchen"}
        </button>
      </div>

      {signals.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">Suche nach Signals aus dem Web.</p>
      )}

      {signals.length > 0 && (
        <div className="space-y-2">
          {signals.map((s) => (
            <div key={s.id} className="rounded-md border bg-background p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{s.source}</span>
                <span className="text-xs text-muted-foreground">· {Math.round(s.confidence * 100)}%</span>
              </div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
              <div className="flex gap-2 mt-1">
                {s.sourceUrl && (
                  <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Quelle</a>
                )}
                <button onClick={() => addAsEvidence(s.id)} className="text-xs text-blue-600 hover:underline">Als Evidence</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
