"use client";

interface StageItem {
  status: string;
  count: number;
}

interface PortfolioPipelineDistributionProps {
  data: StageItem[];
  title?: string;
}

const stageColors: Record<string, string> = {
  discovered: "bg-slate-500",
  validated: "bg-blue-500",
  scored: "bg-indigo-500",
  selected: "bg-purple-500",
  building: "bg-amber-500",
  launched: "bg-green-500",
  ended: "bg-red-500",
  rejected: "bg-gray-400",
  archived: "bg-gray-300",
  idea: "bg-slate-400",
  opportunity: "bg-blue-400",
  venture: "bg-emerald-500",
  default: "bg-slate-400",
};

const stageLabels: Record<string, string> = {
  discovered: "Entdeckt",
  validated: "Validiert",
  scored: "Gescored",
  selected: "Ausgewählt",
  building: "Im Aufbau",
  launched: "Live",
  ended: "Beendet",
  rejected: "Abgelehnt",
  archived: "Archiviert",
  idea: "Idee",
  opportunity: "Opportunity",
  venture: "Venture",
};

function getStageColor(status: string): string {
  return stageColors[status.toLowerCase()] || stageColors.default;
}

function getStageLabel(status: string): string {
  return stageLabels[status.toLowerCase()] || status;
}

export function PortfolioPipelineDistribution({
  data,
  title = "Pipeline-Verteilung nach Stage",
}: PortfolioPipelineDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
          Keine Daten verfügbar
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-4 space-y-3">
        {data.map((item) => {
          const percentage = Math.round((item.count / total) * 100);
          return (
            <div key={item.status} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-card-foreground">
                  {getStageLabel(item.status)}
                </span>
                <span className="text-muted-foreground">
                  {item.count} ({percentage}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${getStageColor(
                    item.status
                  )}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 border-t pt-3 text-right text-sm font-medium text-card-foreground">
        Gesamt: {total}
      </div>
    </div>
  );
}
