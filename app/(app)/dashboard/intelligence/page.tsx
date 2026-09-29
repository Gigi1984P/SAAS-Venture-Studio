"use client";

import { useEffect, useState } from "react";

interface ResearchSource {
  id: string;
  name: string;
  slug: string;
  type: string;
  baseUrl: string;
  searchUrl?: string;
  isActive: boolean;
  priority: number;
  scrapeMethod: string;
  totalScrapes: number;
  lastScrapedAt?: string;
}

export default function ResearchSourcesPage() {
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "forum",
    baseUrl: "",
    searchUrl: "",
    priority: 5,
    categories: "",
  });

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    try {
      const res = await fetch("/api/research-sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function seedDefaults() {
    setSeeding(true);
    try {
      const res = await fetch("/api/research-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: true }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.created + " Quellen erstellt");
        fetchSources();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  }

  async function createSource(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/research-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        }),
      });
      if (res.ok) {
        setShowNewForm(false);
        setForm({ name: "", slug: "", type: "forum", baseUrl: "", searchUrl: "", priority: 5, categories: "" });
        fetchSources();
      } else {
        alert("Fehler beim Erstellen");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(sourceId: string, current: boolean) {
    try {
      await fetch("/api/research-sources/" + sourceId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      setSources(sources.map(s => s.id === sourceId ? { ...s, isActive: !current } : s));
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="p-6">Laden...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Intelligence - Research Sources</h1>
          <p className="text-sm text-muted-foreground">Verwalte und konfiguriere Forschungsquellen</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            + Neue Quelle
          </button>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="h-10 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {seeding ? "Wird erstellt..." : "Demo-Quellen"}
          </button>
        </div>
      </div>

      {showNewForm && (
        <form onSubmit={createSource} className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Neue Forschungsquelle</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="z.B. Product Hunt"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (optional)</label>
              <input
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="product-hunt"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Typ *</label>
              <select
                required
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="forum">Forum</option>
                <option value="review">Review-Seite</option>
                <option value="news">News</option>
                <option value="blog">Blog</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioritaet (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Base URL *</label>
              <input
                required
                type="url"
                value={form.baseUrl}
                onChange={e => setForm({ ...form, baseUrl: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="https://www.producthunt.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Search URL (optional, query als Platzhalter)</label>
              <input
                type="url"
                value={form.searchUrl}
                onChange={e => setForm({ ...form, searchUrl: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="https://www.producthunt.com/search?q=query"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Kategorien (komma-getrennt)</label>
              <input
                value={form.categories}
                onChange={e => setForm({ ...form, categories: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="saas, startup, tech"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? "Wird erstellt..." : "Quelle erstellen"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="h-10 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Aktive Quellen</p>
          <p className="text-2xl font-bold">{sources.filter(s => s.isActive).length}/{sources.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Gesamt Scrapes</p>
          <p className="text-2xl font-bold">{sources.reduce((s, src) => s + src.totalScrapes, 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Foren</p>
          <p className="text-2xl font-bold">{sources.filter(s => s.type === "forum").length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Review-Seiten</p>
          <p className="text-2xl font-bold">{sources.filter(s => s.type === "review").length}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Quelle</th>
                <th className="p-3 text-left font-medium">Typ</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Prioritaet</th>
                <th className="p-3 text-left font-medium">Rate Limit</th>
                <th className="p-3 text-left font-medium">Scrapes</th>
                <th className="p-3 text-left font-medium">Letzter Scan</th>
                <th className="p-3 text-left font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{source.name}</div>
                    <div className="text-xs text-muted-foreground">{source.baseUrl}</div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      source.type === "forum" ? "bg-purple-100 text-purple-700" :
                      source.type === "review" ? "bg-blue-100 text-blue-700" :
                      source.type === "news" ? "bg-orange-100 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {source.type}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      source.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {source.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: source.priority * 10 + "%" }} />
                      </div>
                      <span className="text-xs">{source.priority}/10</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    {source.rateLimitRequests}/{source.rateLimitWindow}s
                  </td>
                  <td className="p-3">{source.totalScrapes.toLocaleString()}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {source.lastScrapedAt ? new Date(source.lastScrapedAt).toLocaleDateString() : "Nie"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(source.id, source.isActive)}
                      className={`text-xs px-2 py-1 rounded ${
                        source.isActive
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          : "bg-green-100 hover:bg-green-200 text-green-700"
                      }`}
                    >
                      {source.isActive ? "Deaktivieren" : "Aktivieren"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
