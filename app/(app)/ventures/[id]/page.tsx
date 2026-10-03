"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import VenturePipeline from "@/components/venture-pipeline";
import VentureModules from "@/components/venture-modules";
import VentureNotes from "@/components/venture-notes";
import VentureTodos from "@/components/venture-todos";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  X,
  BarChart3,
  GitGraph,
  Box,
  StickyNote,
  ListTodo,
  Globe,
  Github,
} from "lucide-react";

type Venture = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  website: string | null;
  github: string | null;
  mrr: number;
  mau: number;
  churnRate: number;
  cac: number;
  teamSize: number;
  burnRate: number;
  runway: number;
  opportunityId: string | null;
  createdAt: string;
  updatedAt: string;
  opportunity?: { id: string; title: string } | null;
  events?: { id: string; type: string; payload: any; actorId: string; createdAt: string }[];
};

const TABS = [
  { key: "overview", label: "Übersicht", icon: BarChart3 },
  { key: "pipeline", label: "Pipeline", icon: GitGraph },
  { key: "modules", label: "Module", icon: Box },
  { key: "notes", label: "Notizen", icon: StickyNote },
  { key: "todos", label: "ToDos", icon: ListTodo },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  idea: { label: "Idee", color: "text-gray-700", bg: "bg-gray-100" },
  validation: { label: "Validierung", color: "text-blue-700", bg: "bg-blue-100" },
  mvp: { label: "MVP", color: "text-purple-700", bg: "bg-purple-100" },
  growth: { label: "Wachstum", color: "text-green-700", bg: "bg-green-100" },
  scale: { label: "Skalierung", color: "text-emerald-700", bg: "bg-emerald-100" },
  sunset: { label: "Sunset", color: "text-red-700", bg: "bg-red-100" },
};

export default function VentureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [venture, setVenture] = useState<Venture | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Venture>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { fetchVenture(); }, [id]);

  async function fetchVenture() {
    try {
      const res = await fetch(`/api/ventures/${id}`);
      if (res.ok) {
        const data = await res.json();
        setVenture(data);
        setEditData(data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch(`/api/ventures/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) { await fetchVenture(); setIsEditing(false); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-6">Lade Venture...</div>;
  if (!venture) return <div className="p-6">Venture nicht gefunden</div>;

  const meta = STATUS_META[venture.status] || STATUS_META.idea;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ventures" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{venture.name}</h1>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          {venture.opportunity && (
            <p className="text-sm text-muted-foreground mt-1">
              Opportunity: <Link href={`/opportunities/${venture.opportunity.id}`} className="text-primary hover:underline">{venture.opportunity.title}</Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={() => { setEditData(venture); setIsEditing(false); }} className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm hover:bg-muted">
                <X className="w-4 h-4" /> Abbrechen
              </button>
              <button onClick={saveChanges} disabled={saving} className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? "Speichern..." : "Speichern"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="inline-flex h-9 items-center gap-1 rounded-md border border-input px-3 text-sm font-medium hover:bg-accent">
                <Pencil className="w-4 h-4" /> Bearbeiten
              </button>
              <button onClick={async () => { if (confirm("Venture wirklich löschen?")) { await fetch(`/api/ventures/${id}`, { method: "DELETE" }); router.push("/ventures"); } }} className="inline-flex h-9 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "MRR", value: `€${venture.mrr.toLocaleString("de-DE")}`, accent: venture.mrr > 0 },
          { label: "Burn", value: `€${venture.burnRate.toLocaleString("de-DE")}`, accent: venture.burnRate > 0 },
          { label: "Runway", value: `${venture.runway} Mo`, accent: venture.runway < 6 },
          { label: "Team", value: `${venture.teamSize}`, accent: false },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
            <div className={`text-lg font-bold ${s.accent ? "text-red-600" : ""}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Links */}
      {(venture.website || venture.github) && (
        <div className="flex gap-3">
          {venture.website && (
            <a href={venture.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Globe className="w-4 h-4" /> Website
            </a>
          )}
          {venture.github && (
            <a href={venture.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Github className="w-4 h-4" /> GitHub
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Description */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-3">Beschreibung</h3>
              {isEditing ? (
                <textarea
                  value={editData.description || ""}
                  onChange={e => setEditData({ ...editData, description: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
                  placeholder="Beschreibung..."
                />
              ) : (
                <p className="text-sm text-muted-foreground">{venture.description || "—"}</p>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">Kennzahlen</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { key: "mrr", label: "MRR", suffix: "€" },
                  { key: "mau", label: "MAU", suffix: "" },
                  { key: "churnRate", label: "Churn Rate", suffix: "%" },
                  { key: "cac", label: "CAC", suffix: "€" },
                  { key: "teamSize", label: "Team", suffix: "" },
                  { key: "burnRate", label: "Burn", suffix: "€" },
                  { key: "runway", label: "Runway", suffix: "Mo" },
                ].map((m) => (
                  <div key={m.key} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{m.label}</label>
                    {isEditing ? (
                      <input
                        type="number"
                        step={m.key === "churnRate" ? "0.1" : "1"}
                        value={((editData as any)[m.key] as number) ?? 0}
                        onChange={(e) => setEditData({ ...editData, [m.key]: m.key === "churnRate" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 })}
                        className="block w-full rounded-md border px-3 py-2 text-sm"
                      />
                    ) : (
                      <div className="text-sm font-semibold font-mono">
                        {m.suffix === "€" ? "€" : ""}{(venture as any)[m.key]?.toLocaleString("de-DE") || 0}{m.suffix === "%" ? "%" : m.suffix === "Mo" ? " Mo" : m.suffix}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Status + Opportunity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-3">Status</h3>
                {isEditing ? (
                  <select value={editData.status || "idea"} onChange={(e) => setEditData({ ...editData, status: e.target.value })} className="block w-full rounded-md border px-3 py-2 text-sm">
                    {Object.entries(STATUS_META).map(([key, m]) => (
                      <option key={key} value={key}>{m.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                )}
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-3">Metadaten</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Erstellt: {new Date(venture.createdAt).toLocaleString("de-DE")}</div>
                  <div>Aktualisiert: {new Date(venture.updatedAt).toLocaleString("de-DE")}</div>
                  <div>Slug: <span className="font-mono text-xs">{venture.slug}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pipeline" && (
          <VenturePipeline
            ventureId={id}
            currentStatus={venture.status}
            events={venture.events || []}
            onStatusChange={async (newStatus, reason) => {
              const res = await fetch(`/api/ventures/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, transitionReason: reason }),
              });
              if (res.ok) await fetchVenture();
            }}
          />
        )}

        {activeTab === "modules" && <VentureModules ventureId={id} />}
        {activeTab === "notes" && <VentureNotes ventureId={id} />}
        {activeTab === "todos" && <VentureTodos ventureId={id} />}
      </div>
    </div>
  );
}
