"use client";

import { useState, useEffect } from "react";

const STAGES = [
  { id: "intake", label: "1. Intake", desc: "Opportunity aufnehmen & bewerten" },
  { id: "problem", label: "2. Problem Validation", desc: "Ist das Problem wirklich schmerzhaft?" },
  { id: "icp", label: "3. ICP Validation", desc: "Wer hat das Problem am stärksten?" },
  { id: "solution", label: "4. Solution Validation", desc: "Ist der Lösungsansatz attraktiv?" },
  { id: "price", label: "5. Price Validation", desc: "Zahlen Kunden wirklich?" },
  { id: "revenue", label: "6. Revenue Validation", desc: "Kannst du es verkaufen?" },
  { id: "delivery", label: "7. Delivery Validation", desc: "Kannst du das Ergebnis liefern?" },
  { id: "economics", label: "8. Economics", desc: "CAC, Marge, ACV, Retention" },
];

export default function ValidationEngineWidget({ opportunityId }: { opportunityId: string }) {
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRun();
  }, [opportunityId]);

  async function fetchRun() {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/validation-runs`);
      if (res.ok) {
        const data = await res.json();
        setRun(Array.isArray(data) ? data[0] : data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function startSprint() {
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/validation-runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintName: `Sprint ${new Date().toLocaleDateString("de-DE")}` }),
      });
      if (res.ok) await fetchRun();
    } catch (err) {
      console.error(err);
    }
  }

  async function advanceStage(stageId: string) {
    if (!run) return;
    try {
      await fetch(`/api/validation/runs/${run.id}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, status: "completed" }),
      });
      await fetchRun();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade...</div>;

  if (!run) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Kein aktiver Validation Sprint.</p>
        <button
          onClick={startSprint}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Neuen Sprint starten
        </button>
      </div>
    );
  }

  const completedStages = run.stages?.filter((s: any) => s.status === "completed").map((s: any) => s.stageId) || [];
  const currentIdx = completedStages.length;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Validation Sprint</h2>
          <p className="text-sm text-muted-foreground">{run.sprintName} · Budget: €{run.spentEur}/€{run.maxBudgetEur}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{Math.round((completedStages.length / STAGES.length) * 100)}%</div>
          <div className="text-xs text-muted-foreground">Fortschritt</div>
        </div>
      </div>

      <div className="flex gap-1">
        {STAGES.map((stage, idx) => {
          const completed = completedStages.includes(stage.id);
          const active = idx === currentIdx;
          return (
            <div key={stage.id} className="flex-1">
              <div
                className={`h-2 rounded-full mb-2 ${
                  completed ? "bg-green-500" : active ? "bg-primary" : "bg-muted"
                }`}
              />
              <div className="text-[10px] font-medium leading-tight">{stage.label}</div>
            </div>
          );
        })}
      </div>

      {currentIdx < STAGES.length && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {currentIdx + 1}
            </span>
            <span className="font-medium">{STAGES[currentIdx].label}</span>
          </div>
          <p className="text-sm text-muted-foreground">{STAGES[currentIdx].desc}</p>
          <button
            onClick={() => advanceStage(STAGES[currentIdx].id)}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Stufe abschließen →
          </button>
        </div>
      )}

      {currentIdx >= STAGES.length && (
        <div className="rounded-md border bg-green-50 p-4 text-center">
          <p className="text-sm font-medium text-green-800">🎉 Alle Stufen abgeschlossen!</p>
          <p className="text-xs text-green-600 mt-1">Entscheidung: {run.finalDecision || "PENDING"}</p>
        </div>
      )}
    </div>
  );
}
