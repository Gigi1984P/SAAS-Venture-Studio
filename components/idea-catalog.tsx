"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function IdeaCatalog() {
  const [ideas, setIdeas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", problem: "", solution: "", targetMarket: "", mrrEstimate: "" });

  useEffect(() => { fetchIdeas(); }, []);

  async function fetchIdeas() {
    const res = await fetch("/api/ideas");
    if (res.ok) setIdeas(await res.json());
  }

  async function createIdea(e) {
    e.preventDefault();
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, mrrEstimate: form.mrrEstimate ? Number(form.mrrEstimate) : null, tags: [] }),
    });
    setShowForm(false);
    setForm({ title: "", description: "", problem: "", solution: "", targetMarket: "", mrrEstimate: "" });
    await fetchIdeas();
  }

  async function convertToOpportunity(id) {
    await fetch(`/api/ideas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "converted" }),
    });
    await fetchIdeas();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Ideen-Katalog</h2>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">+ Neue Idee</button>
      </div>
      {showForm && (
        <form onSubmit={createIdea} className="rounded-lg border bg-card p-4 space-y-2">
          <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Titel" className="block w-full rounded-md border px-3 py-2 text-sm" />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Beschreibung" className="block w-full rounded-md border px-3 py-2 text-sm" rows={2} />
          <textarea value={form.problem} onChange={e => setForm({...form, problem: e.target.value})} placeholder="Problem" className="block w-full rounded-md border px-3 py-2 text-sm" rows={2} />
          <textarea value={form.solution} onChange={e => setForm({...form, solution: e.target.value})} placeholder="Lösung" className="block w-full rounded-md border px-3 py-2 text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.targetMarket} onChange={e => setForm({...form, targetMarket: e.target.value})} placeholder="Zielmarkt" className="rounded-md border px-3 py-2 text-sm" />
            <input type="number" value={form.mrrEstimate} onChange={e => setForm({...form, mrrEstimate: e.target.value})} placeholder="MRR Schätzung (€)" className="rounded-md border px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground">Speichern</button>
        </form>
      )}
      <div className="grid gap-3">
        {ideas.map(i => (
          <div key={i.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{i.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{i.description}</div>
                {i.mrrEstimate && <div className="text-xs mt-1">MRR: €{i.mrrEstimate}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-muted">{i.status}</span>
                {i.status !== "converted" && (
                  <button onClick={() => convertToOpportunity(i.id)} className="text-xs text-green-600 hover:underline">→ Opportunity</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {ideas.length === 0 && <div className="text-center py-8 text-muted-foreground rounded-lg border bg-card">Noch keine Ideen</div>}
      </div>
    </div>
  );
}
