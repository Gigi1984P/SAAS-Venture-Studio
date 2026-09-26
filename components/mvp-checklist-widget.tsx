"use client";

import { useState, useEffect } from "react";

const DEFAULT_CHECKLIST = [
  { category: "Backend", task: "Auth System (Login/Register)" },
  { category: "Backend", task: "Datenbank Schema + API" },
  { category: "Backend", task: "Stripe Integration" },
  { category: "Frontend", task: "Landing Page" },
  { category: "Frontend", task: "Dashboard" },
  { category: "Frontend", task: "Settings Page" },
  { category: "DevOps", task: "CI/CD Pipeline" },
  { category: "DevOps", task: "Monitoring + Alerts" },
  { category: "Legal", task: "AGB + Datenschutz" },
  { category: "Marketing", task: "Waitlist / Beta Signup" },
];

export default function MvpChecklistWidget({ opportunityId }) {
  const [items, setItems] = useState([]);

  useEffect(() => { fetchItems(); }, [opportunityId]);

  async function fetchItems() {
    const res = await fetch(`/api/opportunities/${opportunityId}/mvp-checklist`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setItems(data);
      } else {
        // Seed defaults
        const seeded = await Promise.all(DEFAULT_CHECKLIST.map(c =
          fetch(`/api/opportunities/${opportunityId}/mvp-checklist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c),
          }).then(r => r.json())
        ));
        setItems(seeded);
      }
    }
  }

  async function toggle(id, completed) {
    await fetch(`/api/opportunities/${opportunityId}/mvp-checklist/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed, completedAt: !completed ? new Date().toISOString() : null }),
    });
    await fetchItems();
  }

  const completed = items.filter(i => i.completed).length;
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">MVP Checkliste</h2>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-medium">{pct}%</span>
      </div>
      <div className="space-y-1">
        {items.map(i => (
          <div key={i.id} className={`flex items-center gap-2 rounded-md border p-2 ${i.completed ? "bg-green-50" : "bg-card"}`}>
            <input type="checkbox" checked={i.completed} onChange={() => toggle(i.id, i.completed)} className="h-4 w-4" />
            <div className="flex-1">
              <div className={`text-sm ${i.completed ? "line-through text-muted-foreground" : ""}`}>{i.task}</div>
              <div className="text-xs text-muted-foreground">{i.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
