"use client";

import { useState } from "react";
import { Search, Loader2, Check } from "lucide-react";

export default function CompetitorResearcherTrigger({ opportunityId }: { opportunityId: string }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function startResearch() {
    setRunning(true);
    const res = await fetch(`/api/opportunities/${opportunityId}/competitor-research`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data);
    }
    setRunning(false);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        Competitor Researcher Agent
      </h3>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground mb-3">
          Starte automatische Wettbewerbsanalyse aus konfigurierten Quellen (G2, Capterra, Reddit).
        </p>
        <button
          onClick={startResearch}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {running ? "Recherche laeuft..." : "Auto-Analyse starten"}
        </button>

        {result && (
          <div className="mt-3 rounded-md bg-green-950/20 border border-green-900/30 p-3 text-sm text-green-400 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Task #{result.taskId} erstellt. Ergebnisse erscheinen im Competitor Tab.
          </div>
        )}
      </div>
    </div>
  );
}
