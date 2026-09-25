"use client";

import { useState, useEffect } from "react";

type TechStack = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  officialUrl: string | null;
  docsUrl: string | null;
  version: string | null;
  isActive: boolean;
  usageCount: number;
};

const categoryColors: Record<string, string> = {
  frontend: "bg-blue-100 text-blue-700",
  backend: "bg-green-100 text-green-700",
  database: "bg-amber-100 text-amber-700",
  auth: "bg-red-100 text-red-700",
  payment: "bg-purple-100 text-purple-700",
  deployment: "bg-gray-100 text-gray-700",
  ai: "bg-emerald-100 text-emerald-700",
  styling: "bg-pink-100 text-pink-700",
};

export default function TechStackPage() {
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetchStacks();
  }, []);

  async function fetchStacks() {
    try {
      const res = await fetch("/api/tech-stack");
      if (res.ok) {
        const data = await res.json();
        setStacks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tech stacks:", err);
    } finally {
      setLoading(false);
    }
  }

  const categories = [...new Set(stacks.map((s) => s.category))];

  const filtered = stacks.filter((s) => {
    const matchText = s.name.toLowerCase().includes(filter.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(filter.toLowerCase());
    const matchCat = !categoryFilter || s.category === categoryFilter;
    return matchText && matchCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Lade Tech Stack...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tech Stack</h1>
          <p className="text-muted-foreground">Genehmigte Technologien für Ventures</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Technologien durchsuchen..."
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

      {/* Tech Stack Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">Keine Einträge</h2>
          <p className="mt-2 text-sm text-muted-foreground">Füge Technologien über die API hinzu.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border bg-card p-5 shadow-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[s.category] || "bg-gray-100 text-gray-700"}`}>
                  {s.category}
                </span>
                {s.version && (
                  <span className="text-xs text-muted-foreground">v{s.version}</span>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-1">{s.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {s.description || "—"}
              </p>

              <div className="flex items-center gap-3 text-sm mb-3">
                {s.officialUrl && (
                  <a
                    href={s.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Website →
                  </a>
                )}
                {s.docsUrl && (
                  <a
                    href={s.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Docs →
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {s.usageCount}× verwendet
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.isActive ? "Aktiv" : "Inaktiv"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
