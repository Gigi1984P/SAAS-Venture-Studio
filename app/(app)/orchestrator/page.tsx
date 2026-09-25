"use client";

import { useState, useEffect } from "react";

type Rule = {
  id: string;
  name: string;
  triggerStatus: string;
  minEvidence: number;
  agentType: string;
  taskType: string;
  priority: number;
  isActive: boolean;
};

export default function OrchestratorRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    triggerStatus: "PAIN_VERIFIED",
    minEvidence: 5,
    agentType: "market_researcher",
    taskType: "market_research",
    priority: 5,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      const res = await fetch("/api/orchestrator/rules");
      if (res.ok) setRules(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/orchestrator/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setFormData({ name: "", triggerStatus: "PAIN_VERIFIED", minEvidence: 5, agentType: "market_researcher", taskType: "market_research", priority: 5 });
      await fetchRules();
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleRule(id: string, isActive: boolean) {
    try {
      await fetch(`/api/orchestrator/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      await fetchRules();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteRule(id: string) {
    if (!confirm("Löschen?")) return;
    try {
      await fetch(`/api/orchestrator/rules/${id}`, { method: "DELETE" });
      await fetchRules();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="p-6">Lade...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orchestrator Rules</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Neue Regel
        </button>
      </div>

      {showForm && (
        <form onSubmit={createRule} className="rounded-lg border bg-card p-4 space-y-3">
          <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Regel-Name" className="block w-full rounded-md border px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={formData.triggerStatus} onChange={(e) => setFormData({ ...formData, triggerStatus: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
              <option value="DISCOVERED">DISCOVERED</option>
              <option value="CLUSTERED">CLUSTERED</option>
              <option value="PAIN_VERIFIED">PAIN_VERIFIED</option>
              <option value="SCORED">SCORED</option>
              <option value="VALIDATING">VALIDATING</option>
            </select>
            <input type="number" value={formData.minEvidence} onChange={(e) => setFormData({ ...formData, minEvidence: Number(e.target.value) })} placeholder="Min Evidence" className="rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={formData.agentType} onChange={(e) => setFormData({ ...formData, agentType: e.target.value })} placeholder="Agent Type" className="rounded-md border px-3 py-2 text-sm" />
            <input value={formData.taskType} onChange={(e) => setFormData({ ...formData, taskType: e.target.value })} placeholder="Task Type" className="rounded-md border px-3 py-2 text-sm" />
          </div>
          <input type="number" min={1} max={10} value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })} placeholder="Priority 1-10" className="rounded-md border px-3 py-2 text-sm" />
          <button type="submit" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Speichern</button>
        </form>
      )}

      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className={`rounded-lg border p-4 flex items-center justify-between ${r.isActive ? "bg-card" : "bg-muted/30 opacity-60"}`}>
            <div className="space-y-1">
              <div className="text-sm font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">
                Wenn Status = {r.triggerStatus} & Evidence ≥ {r.minEvidence} → {r.agentType} ({r.taskType})
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleRule(r.id, r.isActive)} className="text-xs underline">{r.isActive ? "Deaktivieren" : "Aktivieren"}</button>
              <button onClick={() => deleteRule(r.id)} className="text-xs text-red-600">Löschen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
