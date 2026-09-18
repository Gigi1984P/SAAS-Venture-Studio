"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Competitor = {
  id: string;
  name: string;
  type: string;
  website: string | null;
  description: string | null;
  pricing: string | null;
  strengths: string | null;
  weaknesses: string | null;
  gaps: string | null;
  createdAt: string;
};

export default function CompetitorsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "direct",
    website: "",
    description: "",
    pricing: "",
    strengths: "",
    weaknesses: "",
    gaps: "",
  });

  useEffect(() => { fetchCompetitors(); }, [id]);

  async function fetchCompetitors() {
    try {
      const res = await fetch(`/api/opportunities/${id}/competitors`);
      if (res.ok) setCompetitors(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/opportunities/${id}/competitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setForm({ name: "", type: "direct", website: "", description: "", pricing: "", strengths: "", weaknesses: "", gaps: "" });
      setShowForm(false);
      fetchCompetitors();
    }
  }

  const typeColors: Record<string, string> = {
    direct: "bg-red-100 text-red-700",
    indirect: "bg-yellow-100 text-yellow-700",
    alternative: "bg-blue-100 text-blue-700",
  };

  if (loading) return <div className="p-6">Laden...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/opportunities/${id}`} className="text-sm text-muted-foreground hover:text-foreground">← Zurueck zu Opportunity</Link>
          <h1 className="text-2xl font-bold tracking-tight mt-2">Competitor Research</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? "Abbrechen" : "+ Competitor"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Typ</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="direct">Direct</option>
                <option value="indirect">Indirect</option>
                <option value="alternative">Alternative</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <input
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pricing</label>
              <input
                value={form.pricing}
                onChange={e => setForm({ ...form, pricing: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="€99/month"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Strengths</label>
              <textarea
                value={form.strengths}
                onChange={e => setForm({ ...form, strengths: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Weaknesses</label>
              <textarea
                value={form.weaknesses}
                onChange={e => setForm({ ...form, weaknesses: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gaps</label>
              <textarea
                value={form.gaps}
                onChange={e => setForm({ ...form, gaps: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          </div>
          <button type="submit" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Speichern
          </button>
        </form>
      )}

      {/* Competitor List */}
      <div className="space-y-4">
        {competitors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Noch keine Competitors erfasst.</div>
        ) : (
          competitors.map(c => (
            <div key={c.id} className="rounded-lg border bg-card p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[c.type] || "bg-gray-100"}`}>
                    {c.type}
                  </span>
                </div>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Website →
                  </a>
                )}
              </div>

              {c.pricing && (
                <div className="text-sm">
                  <span className="font-medium">Pricing:</span> {c.pricing}
                </div>
              )}

              {c.description && (
                <p className="text-sm text-muted-foreground">{c.description}</p>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {c.strengths && (
                  <div className="rounded-md bg-green-50 p-3">
                    <div className="text-xs font-medium text-green-700 mb-1">Strengths</div>
                    <p className="text-sm text-green-800">{c.strengths}</p>
                  </div>
                )}
                {c.weaknesses && (
                  <div className="rounded-md bg-red-50 p-3">
                    <div className="text-xs font-medium text-red-700 mb-1">Weaknesses</div>
                    <p className="text-sm text-red-800">{c.weaknesses}</p>
                  </div>
                )}
                {c.gaps && (
                  <div className="rounded-md bg-blue-50 p-3">
                    <div className="text-xs font-medium text-blue-700 mb-1">Gaps</div>
                    <p className="text-sm text-blue-800">{c.gaps}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
