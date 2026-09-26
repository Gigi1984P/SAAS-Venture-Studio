"use client";

import { useState, useEffect } from "react";

const STACK_LAYERS = [
  { layer: "Frontend", options: ["Next.js 14", "React + Vite", "Vue 3", "SvelteKit"], default: "Next.js 14" },
  { layer: "Backend", options: ["Next.js API", "FastAPI", "Express", "Spring Boot"], default: "Next.js API" },
  { layer: "Database", options: ["PostgreSQL", "MySQL", "MongoDB", "Supabase"], default: "PostgreSQL" },
  { layer: "Auth", options: ["NextAuth", "Clerk", "Auth0", "Firebase Auth"], default: "NextAuth" },
  { layer: "Payments", options: ["Stripe", "Lemon Squeezy", "Paddle", "PayPal"], default: "Stripe" },
  { layer: "Hosting", options: ["Vercel", "Railway", "AWS", "DigitalOcean"], default: "Vercel" },
  { layer: "Monitoring", options: ["Sentry", "LogRocket", "Datadog", "New Relic"], default: "Sentry" },
];

export default function TechStackConfigWidget({ opportunityId }) {
  const [configs, setConfigs] = useState([]);

  useEffect(() => { fetchConfigs(); }, [opportunityId]);

  async function fetchConfigs() {
    const res = await fetch(`/api/opportunities/${opportunityId}/tech-stack-config`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setConfigs(data);
      } else {
        const seeded = await Promise.all(STACK_LAYERS.map(s =
          fetch(`/api/opportunities/${opportunityId}/tech-stack-config`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              layer: s.layer,
              chosenStack: s.default,
              alternatives: s.options.filter(o => o !== s.default),
              setupEffort: "1-2 Tage",
              monthlyCost: 0,
            }),
          }).then(r => r.json())
        ));
        setConfigs(seeded);
      }
    }
  }

  async function updateConfig(id, chosenStack) {
    await fetch(`/api/opportunities/${opportunityId}/tech-stack-config/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chosenStack }),
    });
    await fetchConfigs();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tech Stack Konfiguration</h2>
      <div className="grid gap-2">
        {configs.map(c => (
          <div key={c.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{c.layer}</span>
              <select 
                value={c.chosenStack} 
                onChange={e => updateConfig(c.id, e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              >
                <option value={c.chosenStack}>{c.chosenStack}</option>
                {c.alternatives?.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Setup: {c.setupEffort} · {c.monthlyCost > 0 ? `€${c.monthlyCost}/Monat` : "Kostenlos"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
