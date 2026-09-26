"use client";

import { useState, useEffect } from "react";

export default function MarketSizeWidget({ opportunityId }) {
  const [sizes, setSizes] = useState([]);
  const [form, setForm] = useState({ tam: "", sam: "", som: "", growthRate: "", notes: "" });

  useEffect(() => { fetchSizes(); }, [opportunityId]);

  async function fetchSizes() {
    const res = await fetch(`/api/opportunities/${opportunityId}/market-size`);
    if (res.ok) setSizes(await res.json());
  }

  async function createSize(e) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/market-size`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tam: Number(form.tam),
        sam: Number(form.sam),
        som: Number(form.som),
        growthRate: form.growthRate ? Number(form.growthRate) : null,
        notes: form.notes,
      }),
    });
    setForm({ tam: "", sam: "", som: "", growthRate: "", notes: "" });
    await fetchSizes();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">TAM / SAM / SOM</h2>
      <form onSubmit={createSize} className="rounded-lg border bg-card p-4 grid grid-cols-3 gap-2">
        <input required type="number" value={form.tam} onChange={e => setForm({...form, tam: e.target.value})} placeholder="TAM (€)" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.sam} onChange={e => setForm({...form, sam: e.target.value})} placeholder="SAM (€)" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.som} onChange={e => setForm({...form, som: e.target.value})} placeholder="SOM (€)" className="rounded-md border px-3 py-2 text-sm" />
        <input type="number" value={form.growthRate} onChange={e => setForm({...form, growthRate: e.target.value})} placeholder="Wachstum %" className="rounded-md border px-3 py-2 text-sm" />
        <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Quelle/Notizen" className="rounded-md border px-3 py-2 text-sm col-span-2" />
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Hinzufügen</button>
      </form>
      {sizes.map(s => (
        <div key={s.id} className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-xs text-muted-foreground">TAM</div><div className="font-bold">€{(s.tam/1e6).toFixed(1)}M</div></div>
            <div><div className="text-xs text-muted-foreground">SAM</div><div className="font-bold">€{(s.sam/1e6).toFixed(1)}M</div></div>
            <div><div className="text-xs text-muted-foreground">SOM</div><div className="font-bold text-green-600">€{(s.som/1e6).toFixed(1)}M</div></div>
          </div>
          {s.growthRate && <div className="text-xs mt-2">Wachstum: {s.growthRate}%</div>}
        </div>
      ))}
    </div>
  );
}
