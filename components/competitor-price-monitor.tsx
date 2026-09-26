"use client";

import { useState, useEffect } from "react";

export default function CompetitorPriceMonitor({ competitorId }: { competitorId: string }) {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [newPrice, setNewPrice] = useState("");
  const [newPlan, setNewPlan] = useState("Standard");

  useEffect(() => { fetchSnapshots(); }, [competitorId]);

  async function fetchSnapshots() {
    const res = await fetch(`/api/competitor-prices?competitorId=${competitorId}`);
    if (res.ok) setSnapshots(await res.json());
  }

  async function addSnapshot(e: React.FormEvent) {
    e.preventDefault();
    if (!newPrice) return;
    
    await fetch("/api/competitor-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competitorId,
        price: parseFloat(newPrice),
        planName: newPlan,
      }),
    });
    setNewPrice("");
    setNewPlan("Standard");
    await fetchSnapshots();
  }

  // Detect price changes
  const changes = [];
  for (let i = 1; i < snapshots.length; i++) {
    const curr = snapshots[i];
    const prev = snapshots[i - 1];
    if (curr.price && prev.price && curr.price !== prev.price) {
      const diff = ((curr.price - prev.price) / prev.price) * 100;
      changes.push({ date: curr.fetchedAt, diff, curr: curr.price, prev: prev.price });
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Preis-Monitor</h3>
      
      <form onSubmit={addSnapshot} className="flex gap-2">
        <input
          type="number"
          step="0.01"
          value={newPrice}
          onChange={e => setNewPrice(e.target.value)}
          placeholder="Neuer Preis (€)"
          className="rounded-md border px-3 py-2 text-sm w-32"
        />
        <input
          value={newPlan}
          onChange={e => setNewPlan(e.target.value)}
          placeholder="Plan"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
          Speichern
        </button>
      </form>

      {changes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Preisänderungen</div>
          {changes.map((c: any, i: number) => (
            <div key={i} className={`text-sm p-2 rounded ${c.diff > 0 ? "bg-red-50" : "bg-green-50"}`}>
              {new Date(c.date).toLocaleDateString("de-DE")}: {c.diff > 0 ? "▲" : "▼"} {Math.abs(c.diff).toFixed(1)}% 
              (€{c.prev} → €{c.curr})
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground">Historie</div>
        {snapshots.slice(0, 10).map((s: any) => (
          <div key={s.id} className="flex justify-between text-sm">
            <span>{s.planName}</span>
            <span>€{s.price} <span className="text-xs text-muted-foreground">{new Date(s.fetchedAt).toLocaleDateString("de-DE")}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
