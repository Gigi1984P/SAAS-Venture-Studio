"use client";

import { useState } from "react";

export default function BulkActionsToolbar({ 
  selectedIds, 
  onAction 
}: { 
  selectedIds: string[]; 
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (selectedIds.length === 0) return null;

  async function handleBulkDelete() {
    if (!confirm(`${selectedIds.length} Einträge wirklich löschen?`)) return;
    setLoading(true);
    await fetch("/api/bulk-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_opportunities", ids: selectedIds }),
    });
    setLoading(false);
    onAction();
  }

  async function handleExport() {
    setLoading(true);
    const res = await fetch("/api/bulk-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export_csv", ids: selectedIds }),
    });
    const data = await res.json();
    const blob = new Blob([data.csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
      <span className="text-sm font-medium">{selectedIds.length} ausgewählt</span>
      <div className="h-4 w-px bg-border mx-2" />
      <button onClick={handleExport} disabled={loading} className="text-sm text-primary hover:underline disabled:opacity-50">
        📥 Export CSV
      </button>
      <button onClick={handleBulkDelete} disabled={loading} className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">
        🗑️ Löschen
      </button>
    </div>
  );
}
