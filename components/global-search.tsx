"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.length >= 2) {
        search();
      } else {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function search() {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const typeIcons: Record<string, string> = {
    opportunity: "💡",
    idea: "✨",
    venture: "🚀",
    competitor: "🏢",
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Suche (Ctrl+K)..."
          className="w-full rounded-md border bg-background px-9 py-2 text-sm"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">🔍</span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] hidden sm:block">Ctrl+K</span>
      </div>
      {showResults && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-card shadow-lg z-50 max-h-80 overflow-auto">
          {loading && <div className="p-3 text-sm text-muted-foreground">Suche...</div>}
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">Keine Ergebnisse</div>
          )}
          {results.map((r: any) => (
            <Link
              key={`${r.type}-${r.id}`}
              href={r.url}
              onClick={() => { setShowResults(false); setQuery(""); }}
              className="flex items-center gap-3 p-3 hover:bg-muted border-b last:border-b-0"
            >
              <span className="text-lg">{typeIcons[r.type] || "📄"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.label}</div>
                <div className="text-xs text-muted-foreground capitalize">{r.type} {r.scoreA && `· Score A: ${r.scoreA}`} {r.scoreB && `· Score B: ${r.scoreB}`}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
