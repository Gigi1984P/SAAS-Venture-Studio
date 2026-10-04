"use client";

import { useEffect, useState } from "react";
import { Bot, Play, Plus } from "lucide-react";

interface OrchestratorRule {
  id: string;
  name: string;
  triggerStatus: string;
  minEvidence: number;
  agentType: string;
  taskType: string;
  priority: number;
  isActive: boolean;
}

export default function OrchestratorRulesWidget() {
  const [rules, setRules] = useState<OrchestratorRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  async function fetchRules() {
    const res = await fetch("/api/orchestrator/rules");
    if (res.ok) setRules(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchRules(); }, []);

  async function seedRules() {
    setSeeding(true);
    await fetch("/api/orchestrator/rules/seed", { method: "POST" });
    await fetchRules();
    setSeeding(false);
  }

  if (loading) return <div className="h-20 bg-gray-800 rounded animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Orchestrator Regeln
        </h3>
        <button
          onClick={seedRules}
          disabled={seeding}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
          {seeding ? "..." : "Seed Defaults"}
        </button>
      </div>

      {rules.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Keine Regeln vorhanden. Klicke "Seed Defaults", um 5 Standard-Regeln zu erstellen.
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className={`rounded-md border p-3 text-sm ${rule.isActive ? "border-border bg-card" : "border-muted bg-muted/30 opacity-60"}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{rule.name}</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${rule.isActive ? "bg-emerald-950 text-emerald-400" : "bg-gray-800 text-gray-400"}`}>
                  {rule.isActive ? "Aktiv" : "Inaktiv"}
                </span>
                <span className="text-xs text-muted-foreground">Prio {rule.priority}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Wenn Status = <span className="text-primary font-medium">{rule.triggerStatus}</span>
              {rule.minEvidence > 0 && ` & Evidence ≥ ${rule.minEvidence}`}
              → Task: <span className="text-primary font-medium">{rule.taskType}</span> via {rule.agentType}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
