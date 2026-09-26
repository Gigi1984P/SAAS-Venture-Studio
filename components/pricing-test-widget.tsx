"use client";

import { useState, useEffect } from "react";

export default function PricingTestWidget({ opportunityId }) {
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState({ variantName: "", priceEur: "" });

  useEffect(() => { fetchTests(); }, [opportunityId]);

  async function fetchTests() {
    const res = await fetch(`/api/opportunities/${opportunityId}/pricing-tests`);
    if (res.ok) setTests(await res.json());
  }

  async function createTest(e) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/pricing-tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantName: form.variantName, priceEur: Number(form.priceEur), visitors: 0, conversions: 0 }),
    });
    setForm({ variantName: "", priceEur: "" });
    await fetchTests();
  }

  async function updateTest(id, field, value) {
    await fetch(`/api/opportunities/${opportunityId}/pricing-tests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: Number(value) }),
    });
    await fetchTests();
  }

  async function markWinner(id) {
    await fetch(`/api/opportunities/${opportunityId}/pricing-tests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winner: true }),
    });
    await fetchTests();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pricing A/B Tests</h2>
      <form onSubmit={createTest} className="rounded-lg border bg-card p-4 grid grid-cols-3 gap-2">
        <input required value={form.variantName} onChange={e => setForm({...form, variantName: e.target.value})} placeholder="Variante (z.B. Basic, Pro)" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.priceEur} onChange={e => setForm({...form, priceEur: e.target.value})} placeholder="Preis (€)" className="rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Hinzufügen</button>
      </form>
      <div className="space-y-2">
        {tests.map(t => {
          const rate = t.visitors > 0 ? ((t.conversions / t.visitors) * 100).toFixed(1) : 0;
          return (
            <div key={t.id} className={`rounded-lg border p-3 ${t.winner ? "bg-green-50 border-green-200" : "bg-card"}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">{t.variantName} — €{t.priceEur}</span>
                {t.winner && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Winner 🏆</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <div className="text-xs text-muted-foreground">Visitors</div>
                  <input type="number" defaultValue={t.visitors} onBlur={e => updateTest(t.id, "visitors", e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Conversions</div>
                  <input type="number" defaultValue={t.conversions} onBlur={e => updateTest(t.id, "conversions", e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rate</div>
                  <div className="text-sm font-medium">{rate}%</div>
                </div>
              </div>
              {!t.winner && <button onClick={() => markWinner(t.id)} className="mt-2 text-xs text-green-600 hover:underline">Als Winner markieren</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
