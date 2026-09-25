"use client";

import { useState } from "react";

type EvaluateData = {
  nextBestExperiment: {
    assumptionId: string;
    assumption: string;
    priority: string;
    method: string;
    estimatedCost: string | number;
  } | null;
  decision: {
    action: string;
    reason: string;
    suggested?: string;
  } | null;
};

const actionColors: Record<string, string> = {
  KILL: "bg-red-100 text-red-700 border-red-200",
  WATCH: "bg-yellow-100 text-yellow-700 border-yellow-200",
  EXPERIMENT: "bg-blue-100 text-blue-700 border-blue-200",
  BUILD: "bg-green-100 text-green-700 border-green-200",
};

export default function OpportunityEvaluate({ opportunityId }: { opportunityId: string }) {
  const [data, setData] = useState<EvaluateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);

  async function evaluate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/evaluate`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to evaluate:", err);
    } finally {
      setLoading(false);
    }
  }

  async function convertToVenture() {
    setConverting(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/convert`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        alert(`Venture "${json.venture.name}" erstellt!`);
      } else {
        alert("Fehler beim Konvertieren");
      }
    } catch (err) {
      console.error("Failed to convert:", err);
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bewertung & Nächster Schritt</h2>
        <button
          onClick={evaluate}
          disabled={loading}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Bewerte..." : "Jetzt bewerten"}
        </button>
      </div>

      {!data && !loading && (
        <p className="text-sm text-muted-foreground">Klicke "Jetzt bewerten" um Stop Conditions und das nächste Experiment zu ermitteln.</p>
      )}

      {data?.decision && (
        <div className={`rounded-md border p-4 ${actionColors[data.decision.action] || "bg-gray-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold uppercase tracking-wide">{data.decision.action}</span>
            <span className="text-xs opacity-75">{data.decision.reason}</span>
          </div>
          {data.decision.suggested && (
            <p className="text-sm">Vorgeschlagen: {data.decision.suggested}</p>
          )}
          {data.decision.action === "BUILD" && (
            <button
              onClick={convertToVenture}
              disabled={converting}
              className="mt-3 inline-flex h-9 items-center rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {converting ? "Erstelle..." : "→ Jetzt Venture erstellen"}
            </button>
          )}
        </div>
      )}

      {data?.nextBestExperiment && (
        <div className="rounded-md border bg-blue-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-800">Nächstes Experiment</p>
          <p className="text-sm"><span className="font-medium">Annahme:</span> {data.nextBestExperiment.assumption}</p>
          <p className="text-sm"><span className="font-medium">Methode:</span> {data.nextBestExperiment.method}</p>
          <p className="text-sm"><span className="font-medium">Kosten:</span> {data.nextBestExperiment.estimatedCost}</p>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-200 text-blue-800">
            {data.nextBestExperiment.priority}
          </span>
        </div>
      )}
    </div>
  );
}
