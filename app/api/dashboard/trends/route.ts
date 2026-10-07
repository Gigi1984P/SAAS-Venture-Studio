import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Snapshot {
  id: string;
  date: string;
  avgScoreA: number;
  avgScoreB: number;
  totalMRR: number;
  totalIdeas: number;
  totalOpportunities: number;
  totalVentures: number;
  createdAt: string;
}

interface TrendAnalysis {
  direction: "up" | "down" | "stable";
  changePercent: number;
  changeAbsolute: number;
  trend: "improving" | "declining" | "stable";
  confidence: number; // 0-1
  recommendation: string;
}

function analyzeTrend(values: number[]): TrendAnalysis {
  if (values.length < 2) {
    return {
      direction: "stable",
      changePercent: 0,
      changeAbsolute: 0,
      trend: "stable",
      confidence: 0,
      recommendation: "Nicht genügend Daten für Trendanalyse",
    };
  }

  const first = values[0];
  const last = values[values.length - 1];
  const changeAbsolute = last - first;
  const changePercent = first !== 0 ? ((last - first) / first) * 100 : 0;

  // Lineare Regression für Trend-Stärke
  const n = values.length;
  const sumX = values.reduce((sum, _, i) => sum + i, 0);
  const sumY = values.reduce((sum, v) => sum + v, 0);
  const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
  const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const trendStrength = Math.abs(slope);

  // R² (Bestimmtheitsmaß) für Konfidenz
  const meanY = sumY / n;
  const ssTotal = values.reduce((sum, v) => sum + Math.pow(v - meanY, 2), 0);
  const predicted = values.map((_, i) => slope * i + (sumY - slope * sumX) / n);
  const ssResidual = values.reduce((sum, v, i) => sum + Math.pow(v - predicted[i], 2), 0);
  const rSquared = ssTotal !== 0 ? 1 - ssResidual / ssTotal : 0;

  // Trend-Kategorie
  let trend: "improving" | "declining" | "stable";
  let direction: "up" | "down" | "stable";
  let recommendation: string;

  if (changePercent > 5) {
    trend = "improving";
    direction = "up";
    recommendation = trendStrength > 0.5
      ? "Starker positiver Trend — Pipeline-Momentum nutzen"
      : "Positiver Trend — weiter skalieren";
  } else if (changePercent < -5) {
    trend = "declining";
    direction = "down";
    recommendation = trendStrength > 0.5
      ? "Starker negativer Trend — Ursachen analysieren und Gegenmaßnahmen ergreifen"
      : "Leichter Rückgang — Monitoring verstärken";
  } else {
    trend = "stable";
    direction = "stable";
    recommendation = "Stabil — keine dringenden Maßnahmen nötig";
  }

  return {
    direction,
    changePercent: Math.round(changePercent * 10) / 10,
    changeAbsolute: Math.round(changeAbsolute * 10) / 10,
    trend,
    confidence: Math.round(Math.max(0, Math.min(1, rSquared)) * 100) / 100,
    recommendation,
  };
}

function generateInsights(snapshots: Snapshot[]): any[] {
  const insights = [];

  // Vergleich letzte Woche vs. Vorwoche
  if (snapshots.length >= 14) {
    const lastWeek = snapshots.slice(-7);
    const prevWeek = snapshots.slice(-14, -7);

    const lastAvgScore = lastWeek.reduce((s, sn) => s + sn.avgScoreA, 0) / lastWeek.length;
    const prevAvgScore = prevWeek.reduce((s, sn) => s + sn.avgScoreA, 0) / prevWeek.length;
    const scoreChange = ((lastAvgScore - prevAvgScore) / prevAvgScore) * 100;

    if (scoreChange > 10) {
      insights.push({
        type: "positive",
        icon: "TrendingUp",
        title: "Score-Momentum",
        message: `Opportunity-Scores sind um ${Math.round(scoreChange)}% gestiegen (7 Tage)`,
        action: "Details ansehen",
        link: "/opportunities",
      });
    } else if (scoreChange < -10) {
      insights.push({
        type: "negative",
        icon: "TrendingDown",
        title: "Score-Rückgang",
        message: `Opportunity-Scores sind um ${Math.round(Math.abs(scoreChange))}% gesunken (7 Tage)`,
        action: "Pipeline prüfen",
        link: "/opportunities",
      });
    }

    // MRR-Vergleich
    const lastMRR = lastWeek[lastWeek.length - 1]?.totalMRR || 0;
    const prevMRR = prevWeek[prevWeek.length - 1]?.totalMRR || 0;
    if (lastMRR > prevMRR * 1.1) {
      insights.push({
        type: "positive",
        icon: "DollarSign",
        title: "MRR-Wachstum",
        message: `MRR ist um ${Math.round(((lastMRR - prevMRR) / prevMRR) * 100)}% gewachsen`,
        action: "Vertrieb analysieren",
        link: "/ventures",
      });
    }
  }

  // Pipeline-Velocity (Ideen → Opportunities)
  if (snapshots.length >= 2) {
    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];
    const ideaGrowth = latest.totalIdeas - previous.totalIdeas;
    const oppGrowth = latest.totalOpportunities - previous.totalOpportunities;

    if (ideaGrowth > 0 && oppGrowth > 0) {
      const conversionRate = Math.round((oppGrowth / ideaGrowth) * 100);
      insights.push({
        type: "info",
        icon: "Zap",
        title: "Pipeline-Konversion",
        message: `${conversionRate}% der neuen Ideen wurden zu Opportunities (letzter Lauf)`,
        action: "Konversion ansehen",
        link: "/validation",
      });
    }
  }

  // Allzeit-High
  const maxScore = Math.max(...snapshots.map(s => s.avgScoreA));
  const currentScore = snapshots[snapshots.length - 1]?.avgScoreA || 0;
  if (currentScore >= maxScore * 0.95 && snapshots.length > 1) {
    insights.push({
      type: "positive",
      icon: "Trophy",
      title: "Allzeit-High",
      message: `Aktueller Score (${currentScore.toFixed(1)}) nahe am Maximum (${maxScore.toFixed(1)})`,
      action: "Top-Opportunities",
      link: "/opportunities",
    });
  }

  return insights;
}

export async function GET() {
  try {
    const snapshots = await prisma.dashboardSnapshot.findMany({
      orderBy: { date: "asc" },
    }) as Snapshot[];

    const scoreAValues = snapshots.map(s => s.avgScoreA);
    const scoreBValues = snapshots.map(s => s.avgScoreB);
    const mrrValues = snapshots.map(s => s.totalMRR);
    const ideasValues = snapshots.map(s => s.totalIdeas);
    const oppValues = snapshots.map(s => s.totalOpportunities);

    const analysis = {
      scoreA: analyzeTrend(scoreAValues),
      scoreB: analyzeTrend(scoreBValues),
      mrr: analyzeTrend(mrrValues),
      ideas: analyzeTrend(ideasValues),
      opportunities: analyzeTrend(oppValues),
    };

    const insights = generateInsights(snapshots);

    return NextResponse.json({
      snapshots,
      count: snapshots.length,
      analysis,
      insights,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[TRENDS]", error);
    return NextResponse.json({
      snapshots: [],
      count: 0,
      analysis: {},
      insights: [],
      error: error.message,
    }, { status: 500 });
  }
}
