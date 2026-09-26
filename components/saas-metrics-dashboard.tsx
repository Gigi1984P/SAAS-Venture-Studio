"use client";

import { useState, useEffect } from "react";

const METRIC_TYPES = ["mrr", "churn", "cac", "ltv", "nps", "activation", "retention", "referral"];

export default function SaasMetricsDashboard({ opportunityId }) {
  const [metrics, setMetrics] = useState([]);
  const [form, setForm] = useState({ metricType: "mrr", value: "", target: "", period: "monthly" });

  useEffect(() => { fetchMetrics(); }, [opportunityId]);

  async function fetchMetrics() {
    const res = await fetch(`/api/opportunities/${opportunityId}/saas-metrics`);
    if (res.ok) setMetrics(await res.json());
  }

  async function createMetric(e) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/saas-metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, value: Number(form.value), target: form.target ? Number(form.target) : null }),
    });
    setForm({ metricType: "mrr", value: "", target: "", period: "monthly" });
    await fetchMetrics();
  }

  const latestByType = {};
  metrics.forEach(m => {
    if (!latestByType[m.metricType] || new Date(m.recordedAt) > new Date(latestByType[m.metricType].recordedAt)) {
      latestByType[m.metricType] = m;
    }
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">SaaS Metrics Dashboard</h2>
      <form onSubmit={createMetric} className="rounded-lg border bg-card p-4 grid grid-cols-4 gap-2">
        <select value={form.metricType} onChange={e => setForm({...form, metricType: e.target.value})} className="rounded-md border px-3 py-2 text-sm">
          {METRIC_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <input required type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder="Wert" className="rounded-md border px-3 py-2 text-sm" />
        <input type="number" value={form.target} onChange={e => setForm({...form, target: e.target.value})} placeholder="Ziel" className="rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Hinzufügen</button>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METRIC_TYPES.map(type => {
          const m = latestByType[type];
          return (
            <div key={type} className="rounded-lg border bg-card p-3 text-center">
              <div className="text-xs text-muted-foreground uppercase">{type}</div>
              <div className="text-xl font-bold mt-1">{m ? m.value.toLocaleString() : "—"}</div>
              {m?.target && <div className={`text-xs ${m.value >= m.target ? "text-green-600" : "text-red-600"}`}>Ziel: {m.target}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
