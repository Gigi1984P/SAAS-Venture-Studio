"use client";

import { useState } from "react";

type ScoreData = {
  id: string;
  painSeverity: number;
  frequency: number;
  economicImpact: number;
  existingSpend: number;
  buyerClarity: number;
  reachability: number;
  competitionGap: number;
  switchingMotivation: number;
  recurringNature: number;
  evidenceQuality: number;
  scoreA: number;
  mvpSimplicity: number;
  aiLeverage: number;
  grossMargin: number;
  distributionAdvantage: number;
  lowSupportBurden: number;
  expansionPotential: number;
  defensibility: number;
  scoreB: number;
  confidence: number;
  evidenceLevel: number;
  biggestUncertainty: string | null;
};

const scoreAFields = [
  { key: "painSeverity", label: "Pain Severity", weight: 15 },
  { key: "frequency", label: "Frequency", weight: 10 },
  { key: "economicImpact", label: "Economic Impact", weight: 15 },
  { key: "existingSpend", label: "Existing Spend", weight: 10 },
  { key: "buyerClarity", label: "Buyer Clarity", weight: 10 },
  { key: "reachability", label: "Reachability", weight: 10 },
  { key: "competitionGap", label: "Competition Gap", weight: 10 },
  { key: "switchingMotivation", label: "Switching Motivation", weight: 10 },
  { key: "recurringNature", label: "Recurring Nature", weight: 5 },
  { key: "evidenceQuality", label: "Evidence Quality", weight: 5 },
];

const scoreBFields = [
  { key: "mvpSimplicity", label: "MVP Simplicity", weight: 20 },
  { key: "aiLeverage", label: "AI Leverage", weight: 15 },
  { key: "grossMargin", label: "Gross Margin", weight: 15 },
  { key: "distributionAdvantage", label: "Distribution Advantage", weight: 20 },
  { key: "lowSupportBurden", label: "Low Support Burden", weight: 10 },
  { key: "expansionPotential", label: "Expansion Potential", weight: 10 },
  { key: "defensibility", label: "Defensibility", weight: 10 },
];

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  let color = "bg-slate-500";
  if (pct >= 70) color = "bg-emerald-500";
  else if (pct >= 40) color = "bg-amber-500";
  else color = "bg-red-500";
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function OpportunityScoring({
  data,
  onChange,
  onSave,
  saving,
}: {
  data: ScoreData;
  onChange: (k: keyof ScoreData, v: number | string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [editMode, setEditMode] = useState(false);

  const renderField = (key: keyof ScoreData, label: string, weight: number) => {
    const val = (data[key] as number) || 0;
    return (
      <div key={String(key)} className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <div className="flex items-center gap-2">
            {editMode ? (
              <input
                type="number"
                min={0}
                max={weight}
                value={val}
                onChange={(e) => onChange(key, parseInt(e.target.value) || 0)}
                className="w-16 rounded-md border bg-background px-2 py-1 text-right text-sm"
              />
            ) : (
              <span className="text-sm font-semibold text-foreground">{val}</span>
            )}
            <span className="text-xs text-muted-foreground w-10 text-right">/{weight}</span>
          </div>
        </div>
        <ScoreBar value={val} max={weight} />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">{"Scoring"}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            {editMode ? "Fertig" : "Bearbeiten"}
          </button>
          {editMode && (
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Speichern..." : "Speichern"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Score A */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">{"Score A"}</h3>
              <p className="text-xs text-muted-foreground">{"Pain × Market Fit"}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{data.scoreA}</div>
              <div className="text-xs text-muted-foreground">/100</div>
            </div>
          </div>
          <div className="space-y-4">
            {scoreAFields.map((f) => renderField(f.key as keyof ScoreData, f.label, f.weight))}
          </div>
        </div>

        {/* Score B */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">{"Score B"}</h3>
              <p className="text-xs text-muted-foreground">{"Execution Leverage"}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{data.scoreB}</div>
              <div className="text-xs text-muted-foreground">/100</div>
            </div>
          </div>
          <div className="space-y-4">
            {scoreBFields.map((f) => renderField(f.key as keyof ScoreData, f.label, f.weight))}
          </div>
        </div>
      </div>

      {/* Confidence & Evidence Level */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-card-foreground mb-4">{"Meta"}</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{"Confidence"}</label>
            {editMode ? (
              <input
                type="number"
                step="0.01"
                min={0}
                max={1}
                value={data.confidence}
                onChange={(e) => onChange("confidence", parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            ) : (
              <div className="text-lg font-semibold">{Math.round(data.confidence * 100)}%</div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{"Evidence Level"}</label>
            {editMode ? (
              <input
                type="number"
                min={0}
                max={10}
                value={data.evidenceLevel}
                onChange={(e) => onChange("evidenceLevel", parseInt(e.target.value) || 0)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            ) : (
              <div className="text-lg font-semibold">{data.evidenceLevel}</div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{"Größte Unsicherheit"}</label>
            {editMode ? (
              <input
                type="text"
                value={data.biggestUncertainty || ""}
                onChange={(e) => onChange("biggestUncertainty", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            ) : (
              <div className="text-sm text-muted-foreground">{data.biggestUncertainty || "—"}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
