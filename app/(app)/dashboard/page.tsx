"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({ ideas: 0, opportunities: 0, sprints: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.ok ? r.json() : { ideas: 0, opportunities: 0, sprints: 0 })
      .then(setStats)
      .catch(() => setStats({ ideas: 0, opportunities: 0, sprints: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ideen", value: stats.ideas },
          { label: "Opportunities", value: stats.opportunities },
          { label: "Sprints", value: stats.sprints },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
