"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewVenturePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "idea",
    website: "",
    github: "",
    mrr: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/ventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mrr: parseInt(formData.mrr) || 0,
        }),
      });

      if (res.ok) {
        router.push("/ventures");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Fehler beim Erstellen");
      }
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/ventures" className="text-sm text-muted-foreground hover:text-foreground">← Zurück</Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">Neues Venture</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="z.B. PlantOne" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="idea">Idee</option>
              <option value="validation">Validierung</option>
              <option value="mvp">MVP</option>
              <option value="growth">Wachstum</option>
              <option value="scale">Skalierung</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">MRR</label>
            <input type="number" min="0" value={formData.mrr} onChange={(e) => setFormData({ ...formData, mrr: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="https://..." />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">GitHub</label>
          <input type="url" value={formData.github} onChange={(e) => setFormData({ ...formData, github: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="https://github.com/..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Beschreibung</label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Was macht dieses Venture?" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Speichern..." : "Speichern"}
          </button>
          <Link href="/ventures" className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
