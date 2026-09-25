"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Template = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  tags: string | null;
  repositoryUrl: string | null;
  demoUrl: string | null;
  usageCount: number;
  createdAt: string;
};

const categoryColors: Record<string, string> = {
  saas: "bg-blue-100 text-blue-700",
  marketplace: "bg-purple-100 text-purple-700",
  "ai-tool": "bg-emerald-100 text-emerald-700",
  "chrome-extension": "bg-yellow-100 text-yellow-700",
  "mobile-app": "bg-pink-100 text-pink-700",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  }

  const categories = [...new Set(templates.map((t) => t.category))];

  const filtered = templates.filter((t) => {
    const matchText =
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(filter.toLowerCase()) ||
      (t.tags || "").toLowerCase().includes(filter.toLowerCase());
    const matchCat = !categoryFilter || t.category === categoryFilter;
    return matchText && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Lade Templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venture Templates</h1>
          <p className="text-muted-foreground">Wiederverwendbare Starter für neue Ventures</p>
        </div>
        <Link
          href="/templates/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Neues Template
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Templates durchsuchen..."
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Alle Kategorien</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">Keine Templates</h2>
          <p className="mt-2 text-sm text-muted-foreground">Erstelle dein erstes Template um schneller zu starten.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border bg-card p-5 shadow-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[t.category] || "bg-gray-100 text-gray-700"}`}>
                  {t.category}
                </span>
                <span className="text-xs text-muted-foreground">{t.usageCount}× verwendet</span>
              </div>

              <h3 className="text-lg font-semibold mb-1">{t.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {t.description || "—"}
              </p>

              {t.tags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {t.tags.split(",").map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {t.repositoryUrl && (
                  <a
                    href={t.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Repo →
                  </a>
                )}
                {t.demoUrl && (
                  <a
                    href={t.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Demo →
                  </a>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <Link
                  href={`/templates/${t.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Details ansehen
                </Link>
                <button
                  onClick={async () => {
                    if (confirm(`Template "${t.name}" wirklich löschen?`)) {
                      try {
                        await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
                        setTemplates((prev) => prev.filter((x) => x.id !== t.id));
                      } catch (err) { console.error(err); }
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
