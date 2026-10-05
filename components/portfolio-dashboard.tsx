"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Target,
  Award,
  Activity,
  Zap,
  Lightbulb,
  BarChart3,
  Clock,
} from "lucide-react";
import { PortfolioMetricCard } from "./portfolio-metric-card";
import { PortfolioTrendChart } from "./portfolio-trend-chart";
import { PortfolioPipelineDistribution } from "./portfolio-pipeline-distribution";

interface OpportunityItem {
  id: string;
  title: string;
  scoreA: number;
  scoreB: number;
  confidence: number;
  status: string;
  potentialValueCreation: number | null;
}

interface PipelineEvent {
  id: string;
  eventType: string;
  fromStage: string | null;
  toStage: string | null;
  createdAt: string;
  ventureName: string | null;
  opportunityTitle: string | null;
}

interface MetricsResponse {
  metrics: {
    pipelineValue: number;
    avgScoreA: number;
    avgScoreB: number;
    activeVentures: number;
    ideaVelocity: number;
    avgConfidence: number;
    activeExperiments: number;
    totalOpportunities: number;
    recentIdeas: number;
    recentIdeasLast7Days: number;
  };
  stageDistribution: { status: string; count: number }[];
  topOpportunities: OpportunityItem[];
  recentPipelineEvents: PipelineEvent[];
  trends: Record<string, { date: string; value: number }[]>;
}

export function PortfolioDashboard() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/portfolio/metrics");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("[PortfolioDashboard] Fehler beim Laden:", err);
      setError("Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Venture Portfolio</h1>
          <p className="text-muted-foreground">Übersicht über alle Ventures und Opportunities</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="mt-3 h-8 w-20 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error || "Keine Daten verfügbar."}
        </div>
      </div>
    );
  }

  const { metrics, stageDistribution, topOpportunities, recentPipelineEvents, trends } = data;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Venture Portfolio</h1>
          <p className="text-muted-foreground">Übersicht über alle Ventures und Opportunities</p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-md border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Aktualisieren
        </button>
      </div>

      {/* KPI-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PortfolioMetricCard
          title="Pipeline-Wert"
          value={formatCurrency(metrics.pipelineValue)}
          changePercent={null}
          icon={<DollarSign className="h-4 w-4" />}
          subtitle="Potenzial aller Opportunities"
        />
        <PortfolioMetricCard
          title="Ø Score A"
          value={metrics.avgScoreA.toFixed(1)}
          changePercent={null}
          icon={<Target className="h-4 w-4" />}
          subtitle="Markt- & Problem-Score"
        />
        <PortfolioMetricCard
          title="Ø Score B"
          value={metrics.avgScoreB.toFixed(1)}
          changePercent={null}
          icon={<Award className="h-4 w-4" />}
          subtitle="Studio-Fit & Umsetzbarkeit"
        />
        <PortfolioMetricCard
          title="Aktive Ventures"
          value={metrics.activeVentures}
          changePercent={null}
          icon={<Activity className="h-4 w-4" />}
          subtitle={`von ${metrics.totalOpportunities} Opportunities`}
        />
        <PortfolioMetricCard
          title="Ideen-Geschwindigkeit"
          value={`${metrics.ideaVelocity} / Woche`}
          changePercent={null}
          icon={<Zap className="h-4 w-4" />}
          subtitle={`${metrics.recentIdeasLast7Days} neue in den letzten 7 Tagen`}
        />
        <PortfolioMetricCard
          title="Ø Confidence"
          value={`${(metrics.avgConfidence * 100).toFixed(0)}%`}
          changePercent={null}
          icon={<Lightbulb className="h-4 w-4" />}
          subtitle="Durchschnittliche Validierungssicherheit"
        />
        <PortfolioMetricCard
          title="Aktive Experimente"
          value={metrics.activeExperiments}
          changePercent={null}
          icon={<BarChart3 className="h-4 w-4" />}
          subtitle="Laufende Validierungen"
        />
        <PortfolioMetricCard
          title="Neue Ideen (30 Tage)"
          value={metrics.recentIdeas}
          changePercent={null}
          icon={<Clock className="h-4 w-4" />}
          subtitle="Gesamt: Letzter Monat"
        />
      </div>

      {/* Charts und Verteilung */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PortfolioTrendChart data={trends} />
        <PortfolioPipelineDistribution data={stageDistribution} />
      </div>

      {/* Top Opportunities */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Top 5 Opportunities nach Score
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-medium text-muted-foreground">Titel</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Score A</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Score B</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Confidence</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Potenzial</th>
                <th className="pb-2 text-left font-medium text-muted-foreground pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topOpportunities.map((opp) => (
                <tr key={opp.id} className="group hover:bg-muted/50 transition-colors">
                  <td className="py-3 font-medium text-card-foreground">{opp.title}</td>
                  <td className="py-3 text-right">{opp.scoreA}</td>
                  <td className="py-3 text-right">{opp.scoreB}</td>
                  <td className="py-3 text-right">{(opp.confidence * 100).toFixed(0)}%</td>
                  <td className="py-3 text-right text-muted-foreground">
                    {opp.potentialValueCreation
                      ? formatCurrency(opp.potentialValueCreation)
                      : "—"}
                  </td>
                  <td className="py-3 pl-4">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-muted">
                      {opp.status}
                    </span>
                  </td>
                </tr>
              ))}
              {topOpportunities.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Keine Opportunities verfügbar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Pipeline Events */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Aktuelle Pipeline-Events
        </h3>
        <div className="space-y-3">
          {recentPipelineEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium text-card-foreground">
                    {event.eventType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {event.ventureName && (
                    <span>Venture: {event.ventureName}</span>
                  )}
                  {event.opportunityTitle && (
                    <span>Opportunity: {event.opportunityTitle}</span>
                  )}
                  {event.fromStage && event.toStage && (
                    <span className="ml-1">
                      ({event.fromStage} → {event.toStage})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {recentPipelineEvents.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Keine aktuellen Events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
