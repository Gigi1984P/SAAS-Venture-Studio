"use client";

import { useState, useEffect } from "react";

export default function GtmPlanWidget({ opportunityId }) {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ channel: "", strategy: "", budgetEur: "", timelineWeeks: "", kpis: "" });

  useEffect(() => { fetchPlans(); }, [opportunityId]);

  async function fetchPlans() {
    const res = await fetch(`/api/opportunities/${opportunityId}/gtm`);
    if (res.ok) setPlans(await res.json());
  }

  async function createPlan(e) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/gtm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budgetEur: form.budgetEur ? Number(form.budgetEur) : null,
        timelineWeeks: form.timelineWeeks ? Number(form.timelineWeeks) : null,
      }),
    });
    setForm({ channel: "", strategy: "", budgetEur: "", timelineWeeks: "", kpis: "" });
    await fetchPlans();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Go-to-Market Plan</h2>
      <form onSubmit={createPlan} className="rounded-lg border bg-card p-4 space-y-2">
        <input required value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} placeholder="Kanal (z.B. SEO, Content, Paid)" className="block w-full rounded-md border px-3 py-2 text-sm" />
        <textarea value={form.strategy} onChange={e => setForm({...form, strategy: e.target.value})} placeholder="Strategie" className="block w-full rounded-md border px-3 py-2 text-sm" rows={2} />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={form.budgetEur} onChange={e => setForm({...form, budgetEur: e.target.value})} placeholder="Budget (€)" className="rounded-md border px-3 py-2 text-sm" />
          <input type="number" value={form.timelineWeeks} onChange={e => setForm({...form, timelineWeeks: e.target.value})} placeholder="Wochen" className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <input value={form.kpis} onChange={e => setForm({...form, kpis: e.target.value})} placeholder="KPIs (z.B. 1000 Signups)" className="block w-full rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Hinzufügen</button>
      </form>
      <div className="space-y-2">
        {plans.map(p => (
          <div key={p.id} className="rounded-lg border bg-card p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{p.channel}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted">{p.status}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{p.strategy}</div>
            <div className="text-xs mt-1">Budget: €{p.budgetEur} · {p.timelineWeeks} Wochen · KPIs: {p.kpis}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
