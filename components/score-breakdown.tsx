"use client";

import { useState, useEffect } from "react";

export default function ScoreBreakdown({ opportunityId }: { opportunityId: string }) {
  const [components, setComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComponents();
  }, [opportunityId]);

  async function fetchComponents() {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/score-components`);
      if (res.ok) setComponents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade...</div>;

  // Fallback: generate from known fields if API returns empty
  const fallbackComponents = [
    { name: "Pain Severity", value: 0, weight: 1 },
    { name: "Frequency", value: 0, weight: 1 },
    { name: "Economic Impact", value: 0, weight: 1 },
    { name: "Buyer Clarity", value: 0, weight: 1 },
    { name: "Competition Gap", value: 0, weight: 1 },
    { name: "MVP Simplicity", value: 0, weight: 1 },
    { name: "AI Leverage", value: 0, weight: 1 },
    { name: "Gross Margin", value: 0, weight: 1 },
  ];

  const data = components.length > 0 ? components : fallbackComponents;
  const maxVal = Math.max(...data.map((c: any) => c.value || 0), 1);

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold">Score Aufschlüsselung</h2>
      <div className="space-y-3">
        {data.map((c: any) => (
          <div key={c.name} className="flex items-center gap-3">
            <div className="w-32 text-xs font-medium text-muted-foreground shrink-0">{c.name}</div>
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((c.value || 0) / maxVal) * 100}%` }}
                />
              </div>
            </div>
            <div className="w-8 text-right">
              <span className="text-xs font-semibold">{c.value || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
