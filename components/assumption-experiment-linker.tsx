"use client";

import { useEffect, useState } from "react";
import { Link2, FlaskConical, Plus, Check } from "lucide-react";

interface Assumption {
  id: string;
  code: string;
  statement: string;
  category: string;
  confidence: number;
  status: string;
  nextExperiment: string | null;
}

export default function AssumptionExperimentLinker({ opportunityId }: { opportunityId: string }) {
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);

  async function fetchAssumptions() {
    const res = await fetch(`/api/opportunities/${opportunityId}/assumptions`);
    if (res.ok) setAssumptions(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchAssumptions(); }, [opportunityId]);

  async function autoLinkExperiment(assumptionId: string) {
    setLinking(assumptionId);
    const res = await fetch(`/api/opportunities/${opportunityId}/assumptions/auto-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assumptionId }),
    });
    if (res.ok) await fetchAssumptions();
    setLinking(null);
  }

  if (loading) return <div className="h-32 bg-gray-800 rounded animate-pulse" />;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        Assumption → Experiment Linker
      </h3>

      <div className="space-y-2">
        {assumptions.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Keine Annahmen vorhanden.
          </div>
        )}
        {assumptions.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary bg-primary/10 px-1 rounded">{a.code}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    a.status === "validated" ? "bg-green-950 text-green-400" :
                    a.status === "invalidated" ? "bg-red-950 text-red-400" :
                    a.status === "testing" ? "bg-amber-950 text-amber-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>{a.status}</span>
                </div>
                <div className="text-sm mt-1">{a.statement}</div>
              </div>
              {a.nextExperiment ? (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <FlaskConical className="h-3.5 w-3.5" />
                  Experiment verlinkt
                </div>
              ) : (
                <button
                  onClick={() => autoLinkExperiment(a.id)}
                  disabled={linking === a.id}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  {linking === a.id ? "..." : "Experiment"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
