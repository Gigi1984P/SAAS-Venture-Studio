import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/portfolio/metrics — Berechne Metriken live aus der DB
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalOpportunities,
      avgScores,
      pipelineValueAgg,
      activeVenturesCount,
      activeExperimentsCount,
      recentIdeas,
      recentIdeasLast7Days,
      avgConfidenceAgg,
      opportunitiesByStatus,
      topOpportunities,
      recentPipelineEvents,
      trendMetrics,
    ] = await Promise.all([
      // Gesamtanzahl Opportunities
      prisma.opportunity.count(),

      // Durchschnittliche Scores
      prisma.opportunity.aggregate({
        _avg: { scoreA: true, scoreB: true },
      }),

      // Pipeline-Wert: Summe des potenziellen Werts
      prisma.opportunity.aggregate({
        _sum: { potentialValueCreation: true },
      }),

      // Aktive Ventures (Status nicht "ended" / "rejected")
      prisma.venture.count({
        where: {
          status: { notIn: ["ended", "rejected", "archived"] },
        },
      }),

      // Aktive Experimente
      prisma.experiment.count({
        where: {
          status: { in: ["planned", "running"] },
        },
      }),

      // Neue Ideen der letzten 30 Tage
      prisma.idea.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // Neue Ideen der letzten 7 Tage
      prisma.idea.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // Durchschnittliche Confidence
      prisma.opportunity.aggregate({
        _avg: { confidence: true },
      }),

      // Verteilung nach Status
      prisma.opportunity.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Top 5 Opportunities nach Score
      prisma.opportunity.findMany({
        take: 5,
        orderBy: [{ scoreA: "desc" }, { scoreB: "desc" }],
        select: {
          id: true,
          title: true,
          scoreA: true,
          scoreB: true,
          confidence: true,
          status: true,
          potentialValueCreation: true,
        },
      }),

      // Letzte Pipeline Events
      prisma.pipelineEvent.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          eventType: true,
          fromStage: true,
          toStage: true,
          createdAt: true,
          venture: { select: { name: true } },
          opportunity: { select: { title: true } },
        },
      }),

      // Trend-Metriken der letzten 30 Tage (Snapshots)
      prisma.portfolioMetric.findMany({
        where: {
          metricType: { in: ["pipeline_value", "avg_score_a", "avg_score_b", "active_count"] },
          calculatedAt: { gte: thirtyDaysAgo },
        },
        orderBy: { calculatedAt: "asc" },
        select: {
          metricType: true,
          value: true,
          calculatedAt: true,
        },
      }),
    ]);

    const pipelineValue = pipelineValueAgg._sum.potentialValueCreation || 0;
    const avgScoreA = Math.round((avgScores._avg.scoreA || 0) * 10) / 10;
    const avgScoreB = Math.round((avgScores._avg.scoreB || 0) * 10) / 10;
    const avgConfidence = Math.round((avgConfidenceAgg._avg.confidence || 0) * 100) / 100;

    // Ideen-Geschwindigkeit: Ideen pro Woche (basierend auf letzten 30 Tagen)
    const ideaVelocity = Math.round((recentIdeas / 30) * 7 * 10) / 10;

    // Trend-Daten aufbereiten
    const trendMap: Record<string, { date: string; value: number }[]> = {};
    for (const m of trendMetrics) {
      const dateKey = m.calculatedAt.toISOString().split("T")[0];
      if (!trendMap[m.metricType]) trendMap[m.metricType] = [];
      trendMap[m.metricType].push({ date: dateKey, value: m.value });
    }

    const serializedTopOpportunities = topOpportunities.map((o) => ({
      ...o,
      potentialValueCreation: o.potentialValueCreation || 0,
    }));

    const serializedEvents = recentPipelineEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      fromStage: e.fromStage,
      toStage: e.toStage,
      createdAt: e.createdAt.toISOString(),
      ventureName: e.venture?.name || null,
      opportunityTitle: e.opportunity?.title || null,
    }));

    return NextResponse.json({
      metrics: {
        pipelineValue,
        avgScoreA,
        avgScoreB,
        activeVentures: activeVenturesCount,
        ideaVelocity,
        avgConfidence,
        activeExperiments: activeExperimentsCount,
        totalOpportunities,
        recentIdeas,
        recentIdeasLast7Days,
      },
      stageDistribution: opportunitiesByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      topOpportunities: serializedTopOpportunities,
      recentPipelineEvents: serializedEvents,
      trends: trendMap,
    });
  } catch (error) {
    console.error("[PORTFOLIO METRICS GET]", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/metrics — Snapshot erstellen und Metrics speichern
export async function POST() {
  try {
    const [totalOpps, avgScores, activeVentures, activeExperiments] = await Promise.all([
      prisma.opportunity.count(),
      prisma.opportunity.aggregate({ _avg: { scoreA: true, scoreB: true, confidence: true } }),
      prisma.venture.count({ where: { status: { notIn: ["ended", "rejected", "archived"] } } }),
      prisma.experiment.count({ where: { status: { in: ["planned", "running"] } } }),
    ]);

    const pipelineValueAgg = await prisma.opportunity.aggregate({
      _sum: { potentialValueCreation: true },
    });

    const pipelineValue = pipelineValueAgg._sum.potentialValueCreation || 0;
    const avgScoreA = Math.round((avgScores._avg.scoreA || 0) * 10) / 10;
    const avgScoreB = Math.round((avgScores._avg.scoreB || 0) * 10) / 10;
    const avgConfidence = Math.round((avgScores._avg.confidence || 0) * 100) / 100;

    // Speichere Metrics
    const metricsToSave = [
      { metricType: "pipeline_value", value: pipelineValue },
      { metricType: "avg_score_a", value: avgScoreA },
      { metricType: "avg_score_b", value: avgScoreB },
      { metricType: "active_count", value: activeVentures + activeExperiments },
      { metricType: "avg_confidence", value: avgConfidence },
      { metricType: "total_opportunities", value: totalOpps },
    ];

    await prisma.portfolioMetric.createMany({ data: metricsToSave });

    // Speichere Snapshot
    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        totalOpportunities: totalOpps,
        totalVentures: await prisma.venture.count(),
        avgScoreA,
        avgScoreB,
        pipelineValue,
        activeExperiments,
        avgConfidence,
      },
    });

    return NextResponse.json({
      success: true,
      snapshot,
      metricsSaved: metricsToSave.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[PORTFOLIO METRICS POST]", error);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
