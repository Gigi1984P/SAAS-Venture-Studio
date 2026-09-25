"use client";

import { useState, useEffect } from "react";

type Solution = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  mvpEffort: string | null;
  pricingModel: string | null;
  priceEur: number | null;
  keyFeatures: string | null;
  confidence: number;
};

export default function SolutionsWidget({ opportunityId }: { opportunityId: string }) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "product", mvpEffort: "", pricingModel: "", priceEur: "" });

  useEffect(() => { fetchSolutions(); }, [opportunityId]);

  async function fetchSolutions() {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/solutions`);
      if (res.ok) setSolutions(await res.json());
    } catch (err) { console.error(err); }
  }

  async function createSolution(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/solutions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, priceEur: form.priceEur ? Number(form.priceEur) : null }),
    });
    setShowForm(false);
    setForm({ name: "", description: "", type: "product", mvpEffort: "", pricingModel: "", priceEur: "" });
    await fetchSolutions();
  }

  async function selectSolution(id: string) {
    await fetch(`/api/opportunities/${opportunityId}/solutions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "selected", selectedAt: new Date().toISOString() }),
    });
    await fetchSolutions();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Lösungen (Solutions)</h2>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">+ Neue Lösung</button>
      </div>

      {showForm && (
        <form onSubmit={createSolution} className="rounded-lg border bg-card p-4 space-y-2">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="block w-full rounded-md border px-3 py-2 text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Beschreibung" className="block w-full rounded-md border px-3 py-2 text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.mvpEffort} onChange={(e) => setForm({ ...form, mvpEffort: e.target.value })} placeholder="MVP Aufwand" className="rounded-md border px-3 py-2 text-sm" />
            <input value={form.pricingModel} onChange={(e) => setForm({ ...form, pricingModel: e.target.value })} placeholder="Pricing Model" className="rounded-md border px-3 py-2 text-sm" />
          </div>
          <input type="number" value={form.priceEur} onChange={(e) => setForm({ ...form, priceEur: e.target.value })} placeholder="Preis (€)" className="rounded-md border px-3 py-2 text-sm" />
          <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground">Speichern</button>
        </form>
      )}

      <div className="space-y-2">
        {solutions.map((s) => (
          <div key={s.id} className={`rounded-lg border p-4 ${s.status === "selected" ? "border-green-500 bg-green-50" : "bg-card"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{s.name}</div>
                {s.description && <div className="text-sm text-muted-foreground mt-1">{s.description}</div>}
                {s.priceEur && <div className="text-sm mt-1">€{s.priceEur} · {s.pricingModel}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-muted">{s.status}</span>
                {s.status !== "selected" && <button onClick={() => selectSolution(s.id)} className="text-xs text-green-600 hover:underline">Auswählen</button>}
              </div>
            </div>
          </div>
        ))}
        {solutions.length === 0 && <div className="text-center py-6 text-muted-foreground rounded-lg border bg-card">Noch keine Lösungen</div>}
      </div>
    </div>
  );
}
