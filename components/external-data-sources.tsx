"use client";

import { useState, useEffect } from "react";

export default function ExternalDataSources({ opportunityId }: { opportunityId: string }) {
  const [sources, setSources] = useState<any[]>([]);
  const [form, setForm] = useState({ sourceName: "", sourceUrl: "", dataType: "competitor" });

  useEffect(() => { fetchSources(); }, [opportunityId]);

  async function fetchSources() {
    const res = await fetch(`/api/opportunities/${opportunityId}/external-data`);
    if (res.ok) setSources(await res.json());
  }

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/external-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ sourceName: "", sourceUrl: "", dataType: "competitor" });
    await fetchSources();
  }

  async function removeSource(id: string) {
    await fetch(`/api/opportunities/${opportunityId}/external-data/${id}`, { method: "DELETE" });
    await fetchSources();
  }

  const sourceOptions = [
    { value: "crunchbase", label: "Crunchbase", url: "https://www.crunchbase.com" },
    { value: "g2", label: "G2 Reviews", url: "https://www.g2.com" },
    { value: "appsumo", label: "AppSumo", url: "https://appsumo.com" },
    { value: "trustpilot", label: "Trustpilot", url: "https://www.trustpilot.com" },
    { value: "producthunt", label: "Product Hunt", url: "https://www.producthunt.com" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Externe Datenquellen</h2>
      <form onSubmit={addSource} className="rounded-lg border bg-card p-4 grid grid-cols-3 gap-2">
        <select value={form.sourceName} onChange={e => {
          const sel = sourceOptions.find(s => s.value === e.target.value);
          setForm({ ...form, sourceName: e.target.value, sourceUrl: sel?.url || "" });
        }} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Quelle wählen...</option>
          {sourceOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={form.dataType} onChange={e => setForm({...form, dataType: e.target.value})} className="rounded-md border px-3 py-2 text-sm">
          <option value="competitor">Wettbewerber</option>
          <option value="review">Reviews</option>
          <option value="pricing">Preise</option>
          <option value="market">Marktdaten</option>
        </select>
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Hinzufügen</button>
      </form>
      <div className="space-y-2">
        {sources.map(s => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium capitalize">{s.sourceName}</div>
              <span className="text-xs px-2 py-1 rounded-full bg-muted">{s.dataType}</span>
              <a href={s.sourceUrl} target="_blank" className="text-xs text-blue-600 hover:underline">Öffnen →</a>
            </div>
            <button onClick={() => removeSource(s.id)} className="text-xs text-red-600 hover:underline">Entfernen</button>
          </div>
        ))}
        {sources.length === 0 && <div className="text-center py-8 text-muted-foreground">Noch keine Datenquellen verlinkt</div>}
      </div>
    </div>
  );
}
