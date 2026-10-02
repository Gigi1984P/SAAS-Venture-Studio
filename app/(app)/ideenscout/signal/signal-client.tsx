"use client";

import { useState, useEffect } from "react";

interface Signal {
  source: string;
  subreddit: string;
  title: string;
  text: string;
  url: string;
  score: number;
  comments: number;
  createdAt: string;
  painKeywords: string[];
}

export default function SignalClient() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("problem painful struggle");
  const [error, setError] = useState("");

  async function fetchSignals(q: string) {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/ideenscout/signals?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSignals(data.signals || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSignals(query);
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">📡 Signal Discovery</h1>
        <p className="text-muted-foreground mt-1">Echte Pain Points aus Reddit und Hacker News</p>
      </div>

      {/* Suche */}
      <div className="flex gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Thema (z.B. 'CRM', 'email automation', 'billing')"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          onKeyDown={e => e.key === "Enter" && fetchSignals(query)}
        />
        <button
          onClick={() => fetchSignals(query)}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "..." : "🔍 Suchen"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-md bg-blue-50 p-3">
          <div className="text-muted-foreground">Gefundene Signals</div>
          <div className="text-2xl font-bold">{signals.length}</div>
        </div>
        <div className="rounded-md bg-green-50 p-3">
          <div className="text-muted-foreground">Reddit</div>
          <div className="text-2xl font-bold">{signals.filter(s => s.source === "reddit").length}</div>
        </div>
        <div className="rounded-md bg-orange-50 p-3">
          <div className="text-muted-foreground">Hacker News</div>
          <div className="text-2xl font-bold">{signals.filter(s => s.source === "hackernews").length}</div>
        </div>
      </div>

      {/* Signals Liste */}
      <div className="space-y-3">
        {signals.map((signal, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    signal.source === "reddit" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {signal.source === "reddit" ? "🔴 Reddit" : "🟠 HN"}
                  </span>
                  <span className="text-xs text-muted-foreground">{signal.subreddit}</span>
                  <span className="text-xs text-muted-foreground">👍 {signal.score}</span>
                  <span className="text-xs text-muted-foreground">💬 {signal.comments}</span>
                </div>
                <h3 className="font-semibold text-sm">{signal.title}</h3>
                {signal.text && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{signal.text}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {signal.painKeywords.map(kw => (
                    <span key={kw} className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <a href={signal.url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                ↗️ Öffnen
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
