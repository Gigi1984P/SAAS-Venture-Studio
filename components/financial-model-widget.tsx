"use client";

import { useState, useEffect } from "react";

export default function FinancialModelWidget({ opportunityId }) {
  const [models, setModels] = useState([]);
  const [form, setForm] = useState({ name: "", month: "", revenue: "", costs: "", cac: "", customers: "" });

  useEffect(() => { fetchModels(); }, [opportunityId]);

  async function fetchModels() {
    const res = await fetch(`/api/opportunities/${opportunityId}/financial-model`);
    if (res.ok) setModels(await res.json());
  }

  async function createModel(e) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/financial-model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        month: Number(form.month),
        revenue: Number(form.revenue),
        costs: Number(form.costs),
        cac: Number(form.cac),
        customers: Number(form.customers),
      }),
    });
    setForm({ name: "", month: "", revenue: "", costs: "", cac: "", customers: "" });
    await fetchModels();
  }

  const totalRevenue = models.reduce((a, m) => a + m.revenue, 0);
  const totalCosts = models.reduce((a, m) => a + m.costs, 0);
  const profit = totalRevenue - totalCosts;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Financial Model</h2>
      <form onSubmit={createModel} className="rounded-lg border bg-card p-4 grid grid-cols-3 gap-2">
        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Szenario" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.month} onChange={e => setForm({...form, month: e.target.value})} placeholder="Monat" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} placeholder="Revenue (€)" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.costs} onChange={e => setForm({...form, costs: e.target.value})} placeholder="Kosten (€)" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.cac} onChange={e => setForm({...form, cac: e.target.value})} placeholder="CAC (€)" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="number" value={form.customers} onChange={e => setForm({...form, customers: e.target.value})} placeholder="Kunden" className="rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground col-span-3">Hinzufügen</button>
      </form>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-3 text-center"><div className="text-xs text-muted-foreground">Revenue</div><div className="font-bold text-green-600">€{totalRevenue.toLocaleString()}</div></div>
        <div className="rounded-lg border bg-card p-3 text-center"><div className="text-xs text-muted-foreground">Kosten</div><div className="font-bold text-red-600">€{totalCosts.toLocaleString()}</div></div>
        <div className="rounded-lg border bg-card p-3 text-center"><div className="text-xs text-muted-foreground">Profit</div><div className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>€{profit.toLocaleString()}</div></div>
      </div>
      <div className="space-y-1">
        {models.map(m => (
          <div key={m.id} className="flex justify-between text-xs rounded-md border p-2">
            <span>{m.name} · M{m.month}</span>
            <span>Rev: €{m.revenue.toLocaleString()} · Cost: €{m.costs.toLocaleString()} · {m.customers} Kunden</span>
          </div>
        ))}
      </div>
    </div>
  );
}
