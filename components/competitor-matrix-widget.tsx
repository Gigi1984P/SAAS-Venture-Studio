"use client";

import { useState, useEffect } from "react";

export default function CompetitorMatrixWidget({ opportunityId }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ competitorName: "", featureScore: "", priceScore: "", uxScore: "", marketShare: "", ourAdvantage: "", gapOpportunity: "" });

  useEffect(() => { fetchItems(); }, [opportunityId]);

  async function fetchItems() {
    const res = await fetch(`/api/opportunities/${opportunityId}/competitor-matrix`);
    if (res.ok) setItems(await res.json());
  }

  async function createItem(e) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/competitor-matrix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        featureScore: Number(form.featureScore),
        priceScore: Number(form.priceScore),
        uxScore: Number(form.uxScore),
        marketShare: form.marketShare ? Number(form.marketShare) : null,
      }),
    });
    setForm({ competitorName: "", featureScore: "", priceScore: "", uxScore: "", marketShare: "", ourAdvantage: "", gapOpportunity: "" });
    await fetchItems();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Wettbewerbs-Matrix</h2>
      <form onSubmit={createItem} className="rounded-lg border bg-card p-4 grid grid-cols-3 gap-2">
        <input required value={form.competitorName} onChange={e => setForm({...form, competitorName: e.target.value})} placeholder="Name" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.featureScore} onChange={e => setForm({...form, featureScore: e.target.value})} placeholder="Features (0-10)" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.priceScore} onChange={e => setForm({...form, priceScore: e.target.value})} placeholder="Preis (0-10)" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.uxScore} onChange={e => setForm({...form, uxScore: e.target.value})} placeholder="UX (0-10)" className="rounded-md border px-3 py-2 text-sm" />
        <input type="number" value={form.marketShare} onChange={e => setForm({...form, marketShare: e.target.value})} placeholder="Marktanteil %" className="rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Hinzufügen</button>
      </form>
      <div className="space-y-2">
        {items.map(i => (
          <div key={i.id} className="rounded-lg border bg-card p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{i.competitorName}</span>
              <span className="text-xs text-muted-foreground">{i.marketShare ? `${i.marketShare}% Marktanteil` : ""}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div>Features: {i.featureScore}/10</div>
              <div>Preis: {i.priceScore}/10</div>
              <div>UX: {i.uxScore}/10</div>
            </div>
            {i.ourAdvantage && <div className="text-xs mt-1 text-green-700">Unser Vorteil: {i.ourAdvantage}</div>}
            {i.gapOpportunity && <div className="text-xs mt-1 text-blue-700">Gap: {i.gapOpportunity}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
