"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Plus, Globe, Activity, Pencil } from "lucide-react";

interface IntelligenceSource {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string;
  baseUrl: string;
  isActive: boolean;
  priority: number;
  totalScrapes: number;
  lastScrapedAt: string | null;
}

interface IntelligenceReport {
  id: string;
  sourceName: string;
  sourceSlug: string;
  title: string | null;
  url: string | null;
  sentiment: string | null;
  relevanceScore: number | null;
  fetchedAt: string;
}

export default function IntelligencePage() {
  const [sources, setSources] = useState<IntelligenceSource[]>([]);
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [tab, setTab] = useState<"sources" | "reports">("sources");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        fetch("/api/intelligence/sources"),
        fetch("/api/intelligence/reports"),
      ]);
      if (sRes.ok) setSources(await sRes.json());
      if (rRes.ok) {
        const rData = await rRes.json();
        setReports(rData.reports || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function toggleSource(id: string, current: boolean) {
    await fetch(`/api/intelligence/sources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    loadData();
  }

  const sentimentClass = (s: string | null) => {
    switch (s) {
      case "positive": return "bg-green-100 text-green-700";
      case "negative": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🕵️ Intelligence Engine</h1>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </button>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("sources")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "sources" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          <Globe className="w-4 h-4" /> Sources ({sources.length})
        </button>
        <button
          onClick={() => setTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "reports" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          <Activity className="w-4 h-4" /> Reports ({reports.length})
        </button>
      </div>

      {tab === "sources" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Neue Source
            </button>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Typ</th>
                    <th className="px-4 py-3 text-left font-medium">URL</th>
                    <th className="px-4 py-3 text-left font-medium">Priorität</th>
                    <th className="px-4 py-3 text-left font-medium">Scrapes</th>
                    <th className="px-4 py-3 text-left font-medium">Letzter Lauf</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-accent/50">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3"><span className="rounded-md border px-2 py-0.5 text-xs">{s.type}</span></td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{s.baseUrl}</td>
                      <td className="px-4 py-3">{s.priority}</td>
                      <td className="px-4 py-3">{s.totalScrapes}</td>
                      <td className="px-4 py-3">
                        {s.lastScrapedAt ? new Date(s.lastScrapedAt).toLocaleDateString("de-DE") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSource(s.id, s.isActive)}
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {s.isActive ? "Aktiv" : "Inaktiv"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sources.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Keine Intelligence Sources konfiguriert.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Titel</th>
                  <th className="px-4 py-3 text-left font-medium">Sentiment</th>
                  <th className="px-4 py-3 text-left font-medium">Relevanz</th>
                  <th className="px-4 py-3 text-left font-medium">Datum</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-accent/50">
                    <td className="px-4 py-3"><span className="rounded-md border px-2 py-0.5 text-xs">{r.sourceSlug}</span></td>
                    <td className="px-4 py-3 max-w-[300px]">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer" className="hover:underline text-primary">
                          {r.title || "Unbekannt"}
                        </a>
                      ) : (r.title || "Unbekannt")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs ${sentimentClass(r.sentiment)}`}>
                        {r.sentiment || "neutral"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.relevanceScore != null ? `${Math.round(r.relevanceScore * 100)}%` : "—"}</td>
                    <td className="px-4 py-3">{new Date(r.fetchedAt).toLocaleDateString("de-DE")}</td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Keine Reports vorhanden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
