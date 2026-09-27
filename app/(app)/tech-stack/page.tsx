"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageContainer from "@/components/page-container";

type TechStack = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  approvedFor: string | null;
  documentationUrl: string | null;
  usageCount: number;
  createdAt: string;
};

const categoryColors: Record<string, string> = {
  frontend: "bg-blue-100 text-blue-700",
  backend: "bg-green-100 text-green-700",
  database: "bg-purple-100 text-purple-700",
  ai: "bg-emerald-100 text-emerald-700",
  infrastructure: "bg-orange-100 text-orange-700",
  devops: "bg-yellow-100 text-yellow-700",
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
      const res = await fetch("/api/tech-stacks");
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
    const matchText =
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(filter.toLowerCase());
    const matchCat = !categoryFilter || s.category === categoryFilter;
    return matchText && matchCat;
  });

  if (loading) {
    return (
      <PageContainer title="Tech Stack">
        <div className="text-muted-foreground py-12">Lade Tech Stack...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Tech Stack"
      actions={
        <Link
          href="/tech-stack/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Neuer Stack
        </Link>
      }
    >
      {/* Filter */}
      <div className="flex gap-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Stacks durchsuchen..."
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

      {/* Stacks Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">Keine Stacks</h2>
          <p className="mt-2 text-sm text-muted-foreground">Erstelle deinen ersten Tech Stack.</p>
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
                <span className="text-xs text-muted-foreground">{s.usageCount}× verwendet</span>
              </div>

              <h3 className="text-lg font-semibold mb-1">{s.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {s.description || "—"}
              </p>

              {s.approvedFor && (
                <div className="mb-4 text-xs text-muted-foreground">
                  Approved for: {s.approvedFor}
                </div>
              )}

              <div className="flex gap-2">
                {s.documentationUrl && (
                  <a
                    href={s.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Docs →
                  </a>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <Link
                  href={`/tech-stack/${s.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Details ansehen
                </Link>
                <button
                  onClick={async () => {
                    if (confirm(`Stack "${s.name}" wirklich löschen?`)) {
                      try {
                        await fetch(`/api/tech-stacks/${s.id}`, { method: "DELETE" });
                        setStacks((prev) => prev.filter((x) => x.id !== s.id));
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
    </PageContainer>
  );
}
