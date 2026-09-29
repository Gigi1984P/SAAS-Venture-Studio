"use client";

import { useState, useEffect } from "react";

export default function ActivityLogWidget() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/activity-log?limit=20")
      .then(r => r.json())
      .then(setLogs);
  }, []);

  const actionLabels: Record<string, string> = {
    create: "Erstellt",
    update: "Aktualisiert",
    delete: "Gelöscht",
    view: "Angesehen",
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">📝 Aktivitätslog</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.map((log: any) => (
          <div key={log.id} className="flex items-center gap-3 text-sm">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              log.action === "create" ? "bg-green-100 text-green-700" :
              log.action === "update" ? "bg-blue-100 text-blue-700" :
              log.action === "delete" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {actionLabels[log.action] || log.action}
            </span>
            <span className="text-muted-foreground">{log.entityType}</span>
            {log.entityName && <span className="font-medium">{log.entityName}</span>}
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(log.createdAt).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
            </span>
          </div>
        ))}
        {logs.length === 0 && <div className="text-xs text-muted-foreground">Keine Aktivitäten</div>}
      </div>
    </div>
  );
}
