"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2, Check, X } from "lucide-react";

interface NegativeEvidenceItem {
  id: string;
  claim: string;
  contradiction: string;
  source: string;
  confidence: number;
  createdAt: string;
}

export default function NegativeEvidenceTab({ opportunityId }: { opportunityId: string }) {
  const [items, setItems] = useState<NegativeEvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ claim: "", contradiction: "", source: "", confidence: 0.5 });

  async function fetchItems() {
    const res = await fetch(`/api/opportunities/${opportunityId}/negative-evidence`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, [opportunityId]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/opportunities/${opportunityId}/negative-evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ claim: "", contradiction: "", source: "", confidence: 0.5 });
      setShowForm(false);
      fetchItems();
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Wirklich loeschen?")) return;
    const res = await fetch(`/api/opportunities/${opportunityId}/negative-evidence/${id}`, { method: "DELETE" });
    if (res.ok) fetchItems();
  }

  const supporting = items.filter(() => false).length; // Placeholder
  const contradicting = items.length;
  const netScore = 0 - contradicting;

  if (loading) return <div className="h-32 bg-gray-800 rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-green-900/50 bg-green-950/20 p-4">
          <div className="text-sm text-green-400 font-medium">Unterstuetzend</div>
          <div className="text-2xl font-bold text-white mt-1">{supporting}</div>
        </div>
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
          <div className="text-sm text-red-400 font-medium">Widerlegend</div>
          <div className="text-2xl font-bold text-white mt-1">{contradicting}</div>
        </div>
        <div className={`rounded-lg border p-4 ${netScore >= 0 ? "border-green-900/50 bg-green-950/20" : "border-red-900/50 bg-red-950/20"}`}>
          <div className={`text-sm font-medium ${netScore >= 0 ? "text-green-400" : "text-red-400"}`}>Net Evidence Score</div>
          <div className={`text-2xl font-bold mt-1 ${netScore >= 0 ? "text-green-400" : "text-red-400"}`}>{netScore}</div>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {showForm ? "Abbrechen" : "Widerlegung hinzufuegen"}
      </button>

      {/* Inline Form */}
      {showForm && (
        <form onSubmit={addItem} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Claim (was behauptet wird)</label>
            <input
              value={form.claim}
              onChange={(e) => setForm({ ...form, claim: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="z.B. Property managers brauchen ein neues Tool"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Widerspruch</label>
            <textarea
              value={form.contradiction}
              onChange={(e) => setForm({ ...form, contradiction: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="z.B. Existierende Software loest das Problem bereits"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Quelle</label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="z.B. Reddit, G2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confidence (0-1)</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={form.confidence}
                onChange={(e) => setForm({ ...form, confidence: parseFloat(e.target.value) })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Speichern
          </button>
        </form>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Keine Widerlegungen erfasst. Fuege negative Evidence hinzu, um das Risiko zu bewerten.</p>
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-red-900/30 bg-red-950/10 p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="text-sm font-medium text-red-400">Widerlegung</div>
              <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-white">{item.claim}</div>
            <div className="text-sm text-muted-foreground">&#8594; {item.contradiction}</div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Quelle: {item.source}</span>
              <span>Confidence: {Math.round(item.confidence * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
