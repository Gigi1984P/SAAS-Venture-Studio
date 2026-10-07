"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lightbulb, ExternalLink, ArrowRight } from "lucide-react";

interface BusinessIdea {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_audience: string | null;
  revenue_model: string | null;
  mvp_effort: string | null;
  potential: string | null;
  source: string | null;
  source_url: string | null;
  pain_score: number | null;
  created_at: string;
}

export default function IdeaCatalog() {
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"pain" | "date" | "potential">("pain");

  useEffect(() => { fetchIdeas(); }, []);

  async function fetchIdeas() {
    setLoading(true);
    try {
      const res = await fetch("/api/ideenscout?page=1&limit=100");
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = ideas
    .filter(i =>
      !filter ||
      i.title?.toLowerCase().includes(filter.toLowerCase()) ||
      i.description?.toLowerCase().includes(filter.toLowerCase()) ||
      i.category?.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "pain") return (b.pain_score || 0) - (a.pain_score || 0);
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

  const getPainColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-600";
    if (score >= 8) return "bg-red-100 text-red-700 border-red-200";
    if (score >= 5) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const getPotentialLabel = (p: string | null) => {
    if (p === "high") return "🔥 Hoch";
    if (p === "medium") return "⭐ Mittel";
    if (p === "low") return "💡 Niedrig";
    return p || "—";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          <div>
            <h2 className="text-lg font-semibold">Gefundene Ideen</h2>
            <p className="text-sm text-muted-foreground">{ideas.length} Ideen aus {new Set(ideas.map(i => i.source)).size} Quellen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="pain">🔥 Pain Score</option>
            <option value="date">📅 Neueste</option>
            <option value="potential">💰 Potential</option>
          </select>
        </div>
      </div>

      {/* Filter */}
      <input
        type="text"
        placeholder="Suche nach Titel, Beschreibung oder Kategorie..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm"
      />

      {/* Ideas Grid */}
      <div className="grid gap-3">
        {filtered.map(i => (
          <div key={i.id} className="rounded-lg border bg-card p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{i.title}</span>
                  {i.pain_score && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getPainColor(i.pain_score)}`}>
                      Pain {i.pain_score}/10
                    </span>
                  )}
                  {i.potential && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {getPotentialLabel(i.potential)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{i.description}</div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                  {i.category && <span className="bg-muted px-2 py-0.5 rounded">{i.category}</span>}
                  {i.target_audience && <span>👤 {i.target_audience}</span>}
                  {i.revenue_model && <span>💰 {i.revenue_model}</span>}
                  <span>🕒 {new Date(i.created_at).toLocaleDateString("de-DE")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {i.source_url && (
                  <a href={i.source_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <Link
                  href={`/ideenscout`}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  Details
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground rounded-lg border bg-card">
            {ideas.length === 0 ? (
              <>
                <p className="text-lg font-medium">Noch keine Ideen</p>
                <p className="text-sm mt-1">Der IdeenScout arbeitet alle 15 Minuten — komme bald zurück!</p>
              </>
            ) : (
              <p>Keine Ideen passen zu deinem Filter</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
