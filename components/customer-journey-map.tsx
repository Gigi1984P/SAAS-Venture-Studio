"use client";

import { useState, useEffect } from "react";

const DEFAULT_STAGES = [
  { stage: "Awareness", touchpoints: ["Social Media", "Content Marketing", "SEO"], painPoints: ["Kennt das Problem nicht"], actions: ["Blog lesen", "Video anschauen"] },
  { stage: "Consideration", touchpoints: ["Website", "Demo", "Reviews"], painPoints: ["Vergleicht Alternativen"], actions: ["Feature-Liste prüfen", "Preise vergleichen"] },
  { stage: "Decision", touchpoints: ["Sales Call", "Trial", "Pricing Page"], painPoints: ["Unsicher über ROI"], actions: ["Trial starten", "Sales kontaktieren"] },
  { stage: "Retention", touchpoints: ["Onboarding", "Support", "Community"], painPoints: ["Nutzt nicht alle Features"], actions: ["Tutorial durchlaufen", "Support kontaktieren"] },
  { stage: "Advocacy", touchpoints: ["Referral", "Testimonial", "Case Study"], painPoints: ["Möchte Wert teilen"], actions: ["Referral Link teilen", "Review schreiben"] },
];

export default function CustomerJourneyMap({ opportunityId }) {
  const [stages, setStages] = useState([]);

  useEffect(() => { fetchStages(); }, [opportunityId]);

  async function fetchStages() {
    const res = await fetch(`/api/opportunities/${opportunityId}/customer-journey`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setStages(data);
      } else {
        const seeded = await Promise.all(DEFAULT_STAGES.map(s =
          fetch(`/api/opportunities/${opportunityId}/customer-journey`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s),
          }).then(r => r.json())
        ));
        setStages(seeded);
      }
    }
  }

  async function toggleCompleted(id, completed) {
    await fetch(`/api/opportunities/${opportunityId}/customer-journey/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    await fetchStages();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Customer Journey Map</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {stages.map(s => (
          <div key={s.id} className={`rounded-lg border p-3 ${s.completed ? "bg-green-50 border-green-200" : "bg-card"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{s.stage}</span>
              <input type="checkbox" checked={s.completed} onChange={() => toggleCompleted(s.id, s.completed)} className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Touchpoints:</div>
                <div className="flex flex-wrap gap-1 mt-1">{s.touchpoints?.map((t, i) => <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted">{t}</span>)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pain Points:</div>
                <div className="text-xs text-red-600 mt-1">{s.painPoints?.join(", ")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Actions:</div>
                <div className="text-xs text-blue-600 mt-1">{s.actions?.join(", ")}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
