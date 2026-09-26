"use client";

import { useState, useEffect } from "react";

const RECOMMENDATIONS = [
  { category: "Frontend", rec: "Next.js 14 + TypeScript", rationale: "App Router, SSR, Produktionsreif" },
  { category: "Backend", rec: "Next.js API Routes + Prisma", rationale: "Fullstack, weniger Komplexität" },
  { category: "Database", rec: "PostgreSQL", rationale: "Relationale Daten, ACID, Skalierbar" },
  { category: "Auth", rec: "NextAuth.js", rationale: "JWT, OAuth, Passkey Support" },
  { category: "Payments", rec: "Stripe", rationale: "SaaS-Standard, Subscription Support" },
  { category: "Hosting", rec: "Vercel", rationale: "Edge, Preview Deployments, CI/CD" },
  { category: "Monitoring", rec: "Sentry", rationale: "Error Tracking, Performance" },
  { category: "Email", rec: "Resend", rationale: "Transactional, guter Ruf" },
];

export default function TechStackRecommendationWidget({ opportunityId }) {
  const [items, setItems] = useState([]);

  useEffect(() => { fetchItems(); }, [opportunityId]);

  async function fetchItems() {
    const res = await fetch(`/api/opportunities/${opportunityId}/tech-stack-recommendations`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setItems(data);
      } else {
        const seeded = await Promise.all(RECOMMENDATIONS.map(r =
          fetch(`/api/opportunities/${opportunityId}/tech-stack-recommendations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          }).then(r => r.json())
        ));
        setItems(seeded);
      }
    }
  }

  async function toggleSelected(id, selected) {
    await fetch(`/api/opportunities/${opportunityId}/tech-stack-recommendations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected: !selected }),
    });
    await fetchItems();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tech Stack Empfehlung</h2>
      <div className="grid gap-2">
        {items.map(i => (
          <div key={i.id} className={`flex items-center justify-between rounded-lg border p-3 ${i.selected ? "bg-green-50 border-green-200" : "bg-card"}`}>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={i.selected} onChange={() => toggleSelected(i.id, i.selected)} className="h-4 w-4" />
              <div>
                <div className="text-sm font-medium">{i.category}</div>
                <div className="text-sm">{i.recommendation}</div>
                <div className="text-xs text-muted-foreground">{i.rationale}</div>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${i.selected ? "bg-green-100 text-green-700" : "bg-muted"}`}>{i.selected ? "Gewählt" : "Empfohlen"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
