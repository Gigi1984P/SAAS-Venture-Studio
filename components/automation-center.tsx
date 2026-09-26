"use client";

import { useState, useEffect } from "react";

type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
};

type AutomationLog = {
  id: string;
  name: string;
  action: string;
  status: string;
  triggeredAt: string;
};

export default function AutomationCenter() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    fetchRules();
    fetchLogs();
  }, []);

  async function fetchRules() {
    const res = await fetch("/api/automation-rules");
    if (res.ok) setRules(await res.json());
  }

  async function fetchLogs() {
    const res = await fetch("/api/automations");
    if (res.ok) setLogs(await res.json());
  }

  async function toggleRule(id: string, active: boolean) {
    await fetch(`/api/automation-rules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    await fetchRules();
  }

  const triggerLabels: Record<string, string> = {
    "evidence_added": "📝 Evidence hinzugefügt",
    "stage_changed": "🔄 Stage gewechselt",
    "score_dropped": "📉 Score gefallen",
    "experiment_completed": "✅ Experiment abgeschlossen",
    "status_changed": "📊 Status geändert",
    "venture_converted": "🚀 Zu Venture konvertiert",
  };

  const actionLabels: Record<string, string> = {
    "recalculate_score": "Score neu berechnen",
    "create_task": "Task erstellen",
    "send_notification": "Notification senden",
    "generate_memo": "Memo generieren",
    "fire_webhook": "Webhook auslösen",
    "generate_review": "Red Team Review",
    "create_evidence": "Evidence erstellen",
  };

  const statusColors: Record<string, string> = {
    "success": "text-green-600",
    "failed": "text-red-600",
    "skipped": "text-yellow-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Automation Center</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRules(true)}
            className={`px-3 py-1 rounded-md text-sm ${showRules ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Regeln ({rules.length})
          </button>
          <button
            onClick={() => setShowRules(false)}
            className={`px-3 py-1 rounded-md text-sm ${!showRules ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            Logs ({logs.length})
          </button>
        </div>
      </div>

      {showRules ? (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div className="space-y-1">
                <div className="font-medium">{rule.name}</div>
                <div className="text-sm text-muted-foreground">
                  Wenn {triggerLabels[rule.trigger] || rule.trigger} → {actionLabels[rule.action] || rule.action}
                </div>
              </div>
              <button
                onClick={() => toggleRule(rule.id, rule.active)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rule.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {rule.active ? "Aktiv" : "Inaktiv"}
              </button>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Automations-Regeln. Standardregeln werden beim ersten Setup erstellt.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm">
              <span className={`font-medium ${statusColors[log.status] || ""}`}>{log.status}</span>
              <span className="flex-1">{log.name}</span>
              <span className="text-xs text-muted-foreground">{new Date(log.triggeredAt).toLocaleString("de-DE")}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Noch keine Automation-Logs</div>
          )}
        </div>
      )}
    </div>
  );
}
