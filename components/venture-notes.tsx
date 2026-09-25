"use client";

import { useState, useEffect } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
};

const categoryColors: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  milestone: "bg-green-100 text-green-700",
  decision: "bg-blue-100 text-blue-700",
  research: "bg-purple-100 text-purple-700",
};

export default function VentureNotes({ ventureId }: { ventureId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", category: "general" });

  useEffect(() => {
    fetchNotes();
  }, [ventureId]);

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/ventures/${ventureId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/ventures/${ventureId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ title: "", content: "", category: "general" });
        setShowForm(false);
        await fetchNotes();
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade Notizen...</div>;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notizen</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
        >
          {showForm ? "Schließen" : "+ Notiz"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border bg-muted/30 p-3">
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titel"
            className="block w-full rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Inhalt"
            className="block w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="general">Allgemein</option>
            <option value="milestone">Meilenstein</option>
            <option value="decision">Entscheidung</option>
            <option value="research">Recherche</option>
          </select>
          <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Speichern</button>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Notizen.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-md border bg-background p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{n.title}</span>
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${categoryColors[n.category] || "bg-gray-100 text-gray-600"}`}>
                  {n.category}
                </span>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{n.content}</p>
              <div className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleDateString("de-DE")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
