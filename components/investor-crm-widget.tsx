"use client";

import { useState, useEffect } from "react";

export default function InvestorCRMWidget() {
  const [investors, setInvestors] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "warm" | "portfolio">("all");

  useEffect(() => {
    fetchInvestors();
  }, []);

  async function fetchInvestors() {
    const res = await fetch("/api/investors");
    if (res.ok) setInvestors(await res.json());
  }

  const filtered = investors.filter((inv: any) =>
    filter === "all" || inv.relationship === filter
  );

  const relationshipColors: Record<string, string> = {
    cold: "bg-gray-100 text-gray-600",
    warm: "bg-yellow-100 text-yellow-700",
    hot: "bg-orange-100 text-orange-700",
    portfolio: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">💼 Investor CRM</h3>
          <p className="text-xs text-muted-foreground">Manage deine Investor-Beziehungen</p>
        </div>
        <div className="flex gap-2">
          {(["all", "warm", "portfolio"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2 py-1 rounded-md ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {f === "all" ? "Alle" : f === "warm" ? "Warme Kontakte" : "Portfolio"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((investor: any) => (
          <div key={investor.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{investor.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${relationshipColors[investor.relationship] || "bg-gray-100 text-gray-600"}`}>
                  {investor.relationship}
                </span>
                <span className="text-xs text-muted-foreground">{investor.type}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {investor.ticketSizeMin && investor.ticketSizeMax
                  ? `Ticket: €${(investor.ticketSizeMin / 1000).toFixed(0)}K - €${(investor.ticketSizeMax / 1000).toFixed(0)}K`
                  : "Ticket-Size nicht angegeben"
                }
                {investor.focusAreas?.length > 0 && ` · Fokus: ${investor.focusAreas.join(", ")}`}
              </div>
              {investor.rounds?.length > 0 && (
                <div className="text-xs text-green-600">
                  Investiert in: {investor.rounds.map((r: any) => r.venture?.name).filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Keine Investoren gefunden</p>}
      </div>
    </div>
  );
}
