"use client";

import { useState, useEffect } from "react";

export default function PersonaBuilderWidget({ opportunityId }) {
  const [personas, setPersonas] = useState([]);
  const [form, setForm] = useState({ name: "", role: "", industry: "", companySize: "", painPoints: "", goals: "", behaviors: "", quote: "" });

  useEffect(() => { fetchPersonas(); }, [opportunityId]);

  async function fetchPersonas() {
    const res = await fetch(`/api/opportunities/${opportunityId}/personas-detail`);
    if (res.ok) setPersonas(await res.json());
  }

  async function createPersona(e) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/personas-detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        painPoints: form.painPoints.split(",").map(s => s.trim()).filter(Boolean),
        goals: form.goals.split(",").map(s => s.trim()).filter(Boolean),
        behaviors: form.behaviors.split(",").map(s => s.trim()).filter(Boolean),
      }),
    });
    setForm({ name: "", role: "", industry: "", companySize: "", painPoints: "", goals: "", behaviors: "", quote: "" });
    await fetchPersonas();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Persona Builder</h2>
      <form onSubmit={createPersona} className="rounded-lg border bg-card p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Name (z.B. Marketing Mike)" className="rounded-md border px-3 py-2 text-sm" />
          <input required value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="Rolle" className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} placeholder="Branche" className="rounded-md border px-3 py-2 text-sm" />
          <input value={form.companySize} onChange={e => setForm({...form, companySize: e.target.value})} placeholder="Unternehmensgröße" className="rounded-md border px-3 py-2 text-sm" />
        </div>
        <input value={form.painPoints} onChange={e => setForm({...form, painPoints: e.target.value})} placeholder="Pain Points (komma-getrennt)" className="block w-full rounded-md border px-3 py-2 text-sm" />
        <input value={form.goals} onChange={e => setForm({...form, goals: e.target.value})} placeholder="Ziele (komma-getrennt)" className="block w-full rounded-md border px-3 py-2 text-sm" />
        <input value={form.behaviors} onChange={e => setForm({...form, behaviors: e.target.value})} placeholder="Verhaltensweisen (komma-getrennt)" className="block w-full rounded-md border px-3 py-2 text-sm" />
        <input value={form.quote} onChange={e => setForm({...form, quote: e.target.value})} placeholder="Typisches Zitat" className="block w-full rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Persona speichern</button>
      </form>
      <div className="grid gap-3">
        {personas.map(p => (
          <div key={p.id} className="rounded-lg border bg-card p-4">
            <div className="font-medium">{p.name} · {p.role}</div>
            <div className="text-xs text-muted-foreground">{p.industry} · {p.companySize}</div>
            {p.quote && <div className="text-sm italic mt-2 bg-muted p-2 rounded">"{p.quote}"</div>}
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div><div className="text-muted-foreground">Pain Points</div>{p.painPoints?.join(", ")}</div>
              <div><div className="text-muted-foreground">Ziele</div>{p.goals?.join(", ")}</div>
              <div><div className="text-muted-foreground">Verhalten</div>{p.behaviors?.join(", ")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
