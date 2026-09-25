"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Venture = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  website: string | null;
  github: string | null;
  mrr: number;
  createdAt: string;
};

export default function VenturesPage() {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVentures();
  }, []);

  async function fetchVentures() {
    try {
      const res = await fetch("/api/ventures");
      if (res.ok) {
        const data = await res.json();
        setVentures(data);
      }
    } catch (err) {
      console.error("Failed to fetch ventures:", err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      idea: "bg-gray-100 text-gray-700",
      validation: "bg-yellow-100 text-yellow-700",
      mvp: "bg-blue-100 text-blue-700",
      growth: "bg-green-100 text-green-700",
      scale: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      idea: "Idee",
      validation: "Validierung",
      mvp: "MVP",
      growth: "Wachstum",
      scale: "Skalierung",
    };
    return labels[status] || status;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Lade Ventures...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{"Ventures"}</h1>
          <p className="text-muted-foreground">{"Übersicht über alle Ventures"}</p>
        </div>
        <Link
          href="/ventures/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + {"Neues Venture"}
        </Link>
      </div>

      {/* Venture-Liste */}
      {ventures.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
          <h2 className="text-lg font-semibold">{"Keine Ventures"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{"Übersicht über alle Ventures"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ventures.map((venture) => (
            <div
              key={venture.id}
              className="rounded-lg border bg-card p-6 shadow-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Link href={`/ventures/${venture.id}`} className="text-xl font-semibold hover:text-primary hover:underline">{venture.name}</Link>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(venture.status)}`}
                    >
                      {getStatusLabel(venture.status)}
                    </span>
                  </div>
                  {venture.description && (
                    <p className="text-sm text-muted-foreground">{venture.description}</p>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      €{venture.mrr.toLocaleString("de-DE")}
                    </div>
                    <div className="text-xs text-muted-foreground">{"MRR"}</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`Venture "${venture.name}" wirklich löschen?`)) {
                        try {
                          await fetch(`/api/ventures/${venture.id}`, { method: "DELETE" });
                          setVentures((prev) => prev.filter((v) => v.id !== venture.id));
                        } catch (err) { console.error(err); }
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Löschen
                  </button>
                </div>
              </div>

              {(venture.website || venture.github) && (
                <div className="mt-4 flex gap-4 text-sm">
                  {venture.website && (
                    <a
                      href={venture.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website →
                    </a>
                  )}
                  {venture.github && (
                    <a
                      href={venture.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      GitHub →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
