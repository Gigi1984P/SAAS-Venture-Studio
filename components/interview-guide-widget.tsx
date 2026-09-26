"use client";

import { useState, useEffect } from "react";

const DEFAULT_QUESTIONS = [
  { section: "Problem Discovery", question: "Beschreiben Sie Ihren aktuellen Workflow...", goal: "Pain Points identifizieren" },
  { section: "Problem Discovery", question: "Was ist das größte Ärgernis in Ihrem Alltag?", goal: "Priority Pain finden" },
  { section: "Solution Validation", question: "Wie lösen Sie das Problem heute?", goal: "Workaround verstehen" },
  { section: "Solution Validation", question: "Was würde eine ideale Lösung für Sie ausmachen?", goal: "Must-have Features" },
  { section: "Pricing", question: "Wie viel würden Sie für eine Lösung zahlen?", goal: "WTP ermitteln" },
  { section: "Pricing", question: "Was wäre ein Dealbreaker beim Preis?", goal: "Preissensitivität" },
  { section: "Closing", question: "Können wir Sie für einen Beta-Test kontaktieren?", goal: "Early Adopter gewinnen" },
];

export default function InterviewGuideWidget({ opportunityId }: { opportunityId: string }) {
  const [guides, setGuides] = useState<any[]>([]);

  useEffect(() => { fetchGuides(); }, [opportunityId]);

  async function fetchGuides() {
    const res = await fetch(`/api/opportunities/${opportunityId}/interview-guides`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setGuides(data);
      } else {
        const seeded = await Promise.all(
          DEFAULT_QUESTIONS.map((q, idx) =>
            fetch(`/api/opportunities/${opportunityId}/interview-guides`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...q, order: idx }),
            }).then(r => r.json())
          )
        );
        setGuides(seeded);
      }
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Interview Guide Generator</h2>
      <div className="space-y-3">
        {guides.map((g: any, idx: number) => (
          <div key={g.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-muted">{g.section}</span>
              <span className="text-xs text-muted-foreground">Frage {idx + 1}</span>
            </div>
            <div className="font-medium text-sm">{g.question}</div>
            <div className="text-xs text-muted-foreground mt-1">Ziel: {g.goal}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
