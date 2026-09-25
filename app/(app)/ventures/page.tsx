"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { EmptyState } from "@/components/empty-state";

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
  const router = useRouter();
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "idea",
    website: "",
    github: "",
    mrr: "",
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/ventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mrr: parseInt(formData.mrr) || 0,
        }),
      });

      if (res.ok) {
        const newVenture = await res.json();
        setVentures((prev) => [newVenture, ...prev]);
        setShowForm(false);
        setFormData({
          name: "",
          description: "",
          status: "idea",
          website: "",
          github: "",
          mrr: "",
        });
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Fehler beim Erstellen");
      }
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
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
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {showForm ? "Abbrechen" : `+ ${"Neues Venture"}`}
        </button>
      </div>

      {/* Erstellen-Formular */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-card p-6 shadow-sm space-y-4"
        >
          <h3 className="text-lg font-semibold">{"Neues Venture"}</h3>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{"Name"} *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="z.B. PlantOne"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{"Status"}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="idea">{"Idee"}</option>
                <option value="validation">{"Validierung"}</option>
                <option value="mvp">{"MVP"}</option>
                <option value="growth">{"Wachstum"}</option>
                <option value="scale">{"Skalierung"}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{"MRR"}</label>
              <input
                type="number"
                min="0"
                value={formData.mrr}
                onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{"Website"}</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{"Beschreibung"}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Was macht dieses Venture?"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? `${"Speichern"}...` : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

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
                <div className="text-right">
                  <div className="text-lg font-bold">
                    €{venture.mrr.toLocaleString("de-DE")}
                  </div>
                  <div className="text-xs text-muted-foreground">{"MRR"}</div>
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
