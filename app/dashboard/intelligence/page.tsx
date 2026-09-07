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
  selectorTitle?: string;
  selectorContent?: string;
  selectorAuthor?: string;
  selectorDate?: string;
  rateLimitRequests: number;
  rateLimitWindow: number;
  categories?: string;
  totalScrapes: number;
  lastScrapedAt?: string;
}

export default function ResearchSourcesPage() {
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

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
        alert(`${data.created} Quellen importiert`);
        fetchSources();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  }

  async function toggleActive(sourceId: string, current: boolean) {
    try {
      await fetch(`/api/research-sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      setSources(sources.map(s => s.id === sourceId ? { ...s, isActive: !current } : s));
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="p-6">Lade Quellen...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🔍 Intelligence Engine — Quellen</h1>
          <p className="text-sm text-muted-foreground">Konfiguriere, welche Quellen durchsucht werden</p>
        </div>
        <button
          onClick={seedDefaults}
          disabled={seeding}
          className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {seeding ? "Importiere..." : "🌱 Standard-Quellen importieren"}
        </button>
      </div>

      {/* Stats Cards */}
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

      {/* Sources Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Quelle</th>
                <th className="p-3 text-left font-medium">Typ</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Priorität</th>
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
                      {source.isActive ? "✅ Aktiv" : "⏸️ Inaktiv"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${source.priority * 10}%` }} />
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

      {/* Info */}
      <div className="rounded-lg border bg-blue-50 p-4 text-sm">
        <p className="font-medium text-blue-800">💡 So funktioniert die Intelligence Engine</p>
        <ul className="mt-2 space-y-1 text-blue-700">
          <li>Die Engine durchsucht alle <strong>aktiven Quellen</strong> nach Pain Points, Trends und Wettbewerbern</li>
          <li><strong>Priorität</strong> bestimmt die Reihenfolge (10 = zuerst)</li>
          <li><strong>Rate Limiting</strong> verhindert, dass Quellen blockieren</li>
          <li>Ergebnisse werden <strong>24h gecacht</strong> um Kosten zu sparen</li>
          <li>Jede Quelle hat eigene <strong>CSS Selectoren</strong> für präzises Scraping</li>
        </ul>
      </div>
    </div>
  );
}
