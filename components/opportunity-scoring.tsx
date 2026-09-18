"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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
  { key: "painSeverity", labelKey: "painSeverity", weight: 15 },
  { key: "frequency", labelKey: "frequency", weight: 10 },
  { key: "economicImpact", labelKey: "economicImpact", weight: 15 },
  { key: "existingSpend", labelKey: "existingSpend", weight: 10 },
  { key: "buyerClarity", labelKey: "buyerClarity", weight: 10 },
  { key: "reachability", labelKey: "reachability", weight: 10 },
  { key: "competitionGap", labelKey: "competitionGap", weight: 10 },
  { key: "switchingMotivation", labelKey: "switchingMotivation", weight: 10 },
  { key: "recurringNature", labelKey: "recurringNature", weight: 5 },
  { key: "evidenceQuality", labelKey: "evidenceQuality", weight: 5 },
];

const scoreBFields = [
  { key: "mvpSimplicity", labelKey: "mvpSimplicity", weight: 20 },
  { key: "aiLeverage", labelKey: "aiLeverage", weight: 15 },
  { key: "grossMargin", labelKey: "grossMargin", weight: 15 },
  { key: "distributionAdvantage", labelKey: "distributionAdvantage", weight: 20 },
  { key: "lowSupportBurden", labelKey: "lowSupportBurden", weight: 10 },
  { key: "expansionPotential", labelKey: "expansionPotential", weight: 10 },
  { key: "defensibility", labelKey: "defensibility", weight: 10 },
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
  const t = useTranslations("Scoring");
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
        <h2 className="text-lg font-semibold text-card-foreground">{t("scoringTitle")}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            {editMode ? t("done") : t("edit")}
          </button>
          {editMode && (
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? t("saving") : t("save")}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Score A */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">{t("scoreATitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("scoreASubtitle")}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{data.scoreA}</div>
              <div className="text-xs text-muted-foreground">/100</div>
            </div>
          </div>
          <div className="space-y-4">
            {scoreAFields.map((f) => renderField(f.key as keyof ScoreData, t(f.labelKey as any), f.weight))}
          </div>
        </div>

        {/* Score B */}
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground">{t("scoreBTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("scoreBSubtitle")}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{data.scoreB}</div>
              <div className="text-xs text-muted-foreground">/100</div>
            </div>
          </div>
          <div className="space-y-4">
            {scoreBFields.map((f) => renderField(f.key as keyof ScoreData, t(f.labelKey as any), f.weight))}
          </div>
        </div>
      </div>

      {/* Confidence & Evidence Level */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-card-foreground mb-4">{t("metaTitle")}</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("confidence")}</label>
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
            <label className="text-sm font-medium">{t("evidenceLevel")}</label>
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
            <label className="text-sm font-medium">{t("biggestUncertainty")}</label>
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
