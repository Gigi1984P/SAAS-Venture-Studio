"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import VenturePipeline from "@/components/venture-pipeline";

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

export default function VentureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("VentureDetail");
  const tv = useTranslations("Ventures");
  const tc = useTranslations("Common");

  const [venture, setVenture] = useState<Venture | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Venture>>({});
  const [saving, setSaving] = useState(false);

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
      if (res.ok) {
        await fetchVenture();
        setIsEditing(false);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  function cancelEdit() {
    setEditData(venture || {});
    setIsEditing(false);
  }

  function statusColor(status: string) {
    const colors: Record<string, string> = {
      idea: "bg-gray-100 text-gray-700",
      validation: "bg-blue-100 text-blue-700",
      mvp: "bg-purple-100 text-purple-700",
      growth: "bg-green-100 text-green-700",
      scale: "bg-emerald-100 text-emerald-700",
      sunset: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  if (loading) return <div className="p-6">{t("loading")}</div>;
  if (!venture) return <div className="p-6">{t("notFound")}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/ventures" className="text-sm text-muted-foreground hover:text-foreground">{t("back")}</Link>
          {isEditing ? (
            <div className="mt-2">
              <input
                type="text"
                value={editData.name || ""}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                className="text-2xl font-bold tracking-tight w-full rounded-md border px-3 py-2"
                placeholder={t("placeholderName")}
              />
            </div>
          ) : (
            <h1 className="text-3xl font-bold tracking-tight mt-2">{venture.name}</h1>
          )}
          {venture.opportunity && (
            <p className="text-sm text-muted-foreground mt-1">
              {tv("opportunity")}: <Link href={`/opportunities/${venture.opportunity.id}`} className="text-primary hover:underline">{venture.opportunity.title}</Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button onClick={cancelEdit} className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-muted">{tc("cancel")}</button>
              <button onClick={saveChanges} disabled={saving} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {saving ? `${tc("save")}...` : tc("save")}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                {tc("edit")}
              </button>
              <button
                onClick={async () => {
                  if (confirm(t("deleteConfirm"))) {
                    await fetch(`/api/ventures/${id}`, { method: "DELETE" });
                    router.push("/ventures");
                  }
                }}
                className="inline-flex h-9 items-center rounded-md border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                {tc("delete")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex gap-2">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColor(venture.status)}`}>
          {venture.status}
        </span>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-600">
          {tv("mrr")}: €{venture.mrr.toLocaleString("de-DE")}
        </span>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Description */}
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold">{t("descriptionTitle")}</h2>
            {isEditing ? (
              <textarea
                value={editData.description || ""}
                onChange={e => setEditData({ ...editData, description: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
                placeholder={t("placeholderDesc")}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{venture.description || "—"}</p>
            )}
          </div>

          {/* Metrics */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("metricsTitle")}</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "mrr", label: tv("mrr"), suffix: "€" },
                { key: "mau", label: tv("mau"), suffix: "" },
                { key: "churnRate", label: tv("churnRate"), suffix: "%" },
                { key: "cac", label: tv("cac"), suffix: "€" },
                { key: "teamSize", label: tv("teamSize"), suffix: "" },
                { key: "burnRate", label: tv("burnRate"), suffix: "€" },
                { key: "runway", label: tv("runway"), suffix: "Mo" },
              ].map((metric) => (
                <div key={metric.key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{metric.label}</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step={metric.key === "churnRate" ? "0.1" : "1"}
                      value={(editData as any)[metric.key] || 0}
                      onChange={(e) => setEditData({ ...editData, [metric.key]: metric.key === "churnRate" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 })}
                      className="block w-full rounded-md border px-3 py-2 text-sm"
                    />
                  ) : (
                    <div className="text-sm font-semibold">
                      {metric.suffix === "€" ? "€" : ""}{(venture as any)[metric.key]?.toLocaleString("de-DE") || 0}{metric.suffix === "%" ? "%" : metric.suffix === "Mo" ? " Mo" : metric.suffix}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold">{t("statusTitle")}</h2>
            <div className="space-y-3">
              <div>
                {isEditing ? (
                  <select
                    value={editData.status || "idea"}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="block w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="idea">{tv("statusIdea")}</option>
                    <option value="validation">{tv("statusValidation")}</option>
                    <option value="mvp">{tv("statusMvp")}</option>
                    <option value="growth">{tv("statusGrowth")}</option>
                    <option value="scale">{tv("statusScale")}</option>
                    <option value="sunset">{tv("statusSunset")}</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColor(venture.status)}`}>
                    {venture.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Links */}
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold">{t("linksTitle")}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">{t("website")}</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.website || ""}
                    onChange={e => setEditData({ ...editData, website: e.target.value })}
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    placeholder={t("placeholderWebsite")}
                  />
                ) : venture.website ? (
                  <a href={venture.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{venture.website}</a>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("notSpecified")}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">{t("github")}</label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.github || ""}
                    onChange={e => setEditData({ ...editData, github: e.target.value })}
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    placeholder={t("placeholderGithub")}
                  />
                ) : venture.github ? (
                  <a href={venture.github} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{venture.github}</a>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("notSpecified")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold">{t("metadataTitle")}</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>{t("created")}: {new Date(venture.createdAt).toLocaleString("de-DE")}</div>
              <div>{t("updated")}: {new Date(venture.updatedAt).toLocaleString("de-DE")}</div>
              <div>{t("slug")}: <span className="font-mono text-xs">{venture.slug}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Venture Pipeline */}
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
    </div>
  );
}
