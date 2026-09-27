"use client";

import { useState, useEffect } from "react";

export default function AutoDedupeWidget() {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/automations/batch2?type=deduplication")
      .then(r => r.json())
      .then(setSuggestions);
  }, []);

  async function accept(id: string) {
    await fetch(`/api/automations/batch2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "merge_duplicates", payload: { suggestionId: id } }),
    });
    setSuggestions(s => s.filter(x => x.id !== id));
  }

  async function reject(id: string) {
    await fetch(`/api/automations/batch2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "reject_duplicate", payload: { suggestionId: id } }),
    });
    setSuggestions(s => s.filter(x => x.id !== id));
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Auto Deduplication ({suggestions.length})</h3>
      {suggestions.slice(0, 3).map(s => (
        <div key={s.id} className="flex items-center justify-between text-sm">
          <span>Ähnlichkeit: {(s.similarity * 100).toFixed(0)}%</span>
          <div className="flex gap-1">
            <button onClick={() => accept(s.id)} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Merge</button>
            <button onClick={() => reject(s.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Ignorieren</button>
          </div>
        </div>
      ))}
      {suggestions.length === 0 && <div className="text-xs text-muted-foreground">Keine Duplikate gefunden</div>}
    </div>
  );
}
