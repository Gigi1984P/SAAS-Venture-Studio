"use client";

import { useState, useEffect } from "react";

type Module = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
};

type VentureModule = {
  id: string;
  ventureId: string;
  moduleId: string;
  config: any;
  status: string;
  installedAt: string | null;
  configuredAt: string | null;
  notes: string | null;
  module: Module;
};

const statusColors: Record<string, string> = {
  planned: "bg-gray-100 text-gray-600",
  installed: "bg-blue-100 text-blue-700",
  configured: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  deprecated: "bg-red-100 text-red-600",
};

export default function VentureModules({ ventureId }: { ventureId: string }) {
  const [installed, setInstalled] = useState<VentureModule[]>([]);
  const [available, setAvailable] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchInstalled();
    fetchAvailable();
  }, [ventureId]);

  async function fetchInstalled() {
    try {
      const res = await fetch(`/api/ventures/${ventureId}/modules`);
      if (res.ok) {
        const data = await res.json();
        setInstalled(data);
      }
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailable() {
    try {
      const res = await fetch("/api/shared-modules");
      if (res.ok) {
        const data = await res.json();
        setAvailable(data);
      }
    } catch (err) {
      console.error("Failed to fetch available modules:", err);
    }
  }

  async function installModule(moduleId: string) {
    try {
      const res = await fetch(`/api/ventures/${ventureId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      if (res.ok) {
        await fetchInstalled();
        setShowAdd(false);
      }
    } catch (err) {
      console.error("Failed to install module:", err);
    }
  }

  async function updateStatus(moduleId: string, status: string) {
    try {
      const res = await fetch(`/api/ventures/${ventureId}/modules/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchInstalled();
    } catch (err) {
      console.error("Failed to update module:", err);
    }
  }

  async function removeModule(moduleId: string) {
    if (!confirm("Modul wirklich deinstallieren?")) return;
    try {
      const res = await fetch(`/api/ventures/${ventureId}/modules/${moduleId}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchInstalled();
    } catch (err) {
      console.error("Failed to remove module:", err);
    }
  }

  const installedModuleIds = new Set(installed.map((vm) => vm.moduleId));
  const notInstalled = available.filter((m) => !installedModuleIds.has(m.id));

  if (loading) return <div className="text-sm text-muted-foreground">Lade Module...</div>;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Module</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
        >
          {showAdd ? "Schließen" : "+ Modul hinzufügen"}
        </button>
      </div>

      {showAdd && notInstalled.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Verfügbare Module:</p>
          <div className="flex flex-wrap gap-2">
            {notInstalled.map((m) => (
              <button
                key={m.id}
                onClick={() => installModule(m.id)}
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                title={m.description || ""}
              >
                <span className="font-medium">{m.name}</span>
                <span className="text-muted-foreground">({m.category})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {installed.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Module installiert.</p>
      ) : (
        <div className="space-y-2">
          {installed.map((vm) => (
            <div
              key={vm.id}
              className="flex items-center justify-between rounded-md border bg-background p-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{vm.module.name}</span>
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColors[vm.status] || "bg-gray-100 text-gray-600"}`}>
                    {vm.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {vm.module.category} — {vm.module.description || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {vm.status === "planned" && (
                  <button
                    onClick={() => updateStatus(vm.id, "installed")}
                    className="text-xs rounded-md border px-2 py-1 hover:bg-muted"
                  >
                    Installieren
                  </button>
                )}
                {vm.status === "installed" && (
                  <button
                    onClick={() => updateStatus(vm.id, "configured")}
                    className="text-xs rounded-md border px-2 py-1 hover:bg-muted"
                  >
                    Konfigurieren
                  </button>
                )}
                {vm.status === "configured" && (
                  <button
                    onClick={() => updateStatus(vm.id, "active")}
                    className="text-xs rounded-md border px-2 py-1 hover:bg-muted"
                  >
                    Aktivieren
                  </button>
                )}
                <button
                  onClick={() => removeModule(vm.id)}
                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                >
                  Entfernen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
