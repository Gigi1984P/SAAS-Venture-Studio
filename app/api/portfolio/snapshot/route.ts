import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/portfolio/snapshot — Aktuellen Snapshot abrufen
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Neuesten Snapshot abrufen
    const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
      orderBy: { calculatedAt: "desc" },
    });

    if (latestSnapshot) {
      return NextResponse.json({
        snapshot: {
          ...latestSnapshot,
          calculatedAt: latestSnapshot.calculatedAt.toISOString(),
        },
      });
    }

    // Fallback: Live-Berechnung wenn kein Snapshot existiert
    const [
      totalIdeas,
      totalOpportunities,
      totalVentures,
      avgScoreA,
      avgScoreB,
      pipelineValue,
      activeExperiments,
      avgConfidence,
    ] = await Promise.all([
      prisma.idea.count(),
      prisma.opportunity.count(),
      prisma.venture.count(),
      prisma.opportunity.aggregate({ _avg: { scoreA: true } }),
      prisma.opportunity.aggregate({ _avg: { scoreB: true } }),
      prisma.opportunity.aggregate({ _sum: { potentialValueCreation: true } }),
      prisma.experiment.count({ where: { status: { in: ["planned", "running"] } } }),
      prisma.opportunity.aggregate({ _avg: { confidence: true } }),
    ]);

    const snapshot = {
      id: "live",
      totalIdeas,
      totalOpportunities,
      totalVentures,
      avgScoreA: Math.round((avgScoreA._avg.scoreA || 0) * 10) / 10,
      avgScoreB: Math.round((avgScoreB._avg.scoreB || 0) * 10) / 10,
      pipelineValue: pipelineValue._sum.potentialValueCreation || 0,
      activeExperiments,
      avgConfidence: Math.round((avgConfidence._avg.confidence || 0) * 100) / 100,
      calculatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("[PORTFOLIO SNAPSHOT GET]", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/snapshot — Neuen Snapshot speichern
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Live-Werte berechnen
    const [
      totalIdeas,
      totalOpportunities,
      totalVentures,
      avgScoreA,
      avgScoreB,
      pipelineValue,
      activeExperiments,
      avgConfidence,
    ] = await Promise.all([
      prisma.idea.count(),
      prisma.opportunity.count(),
      prisma.venture.count(),
      prisma.opportunity.aggregate({ _avg: { scoreA: true } }),
      prisma.opportunity.aggregate({ _avg: { scoreB: true } }),
      prisma.opportunity.aggregate({ _sum: { potentialValueCreation: true } }),
      prisma.experiment.count({ where: { status: { in: ["planned", "running"] } } }),
      prisma.opportunity.aggregate({ _avg: { confidence: true } }),
    ]);

    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        totalIdeas,
        totalOpportunities,
        totalVentures,
        avgScoreA: Math.round((avgScoreA._avg.scoreA || 0) * 10) / 10,
        avgScoreB: Math.round((avgScoreB._avg.scoreB || 0) * 10) / 10,
        pipelineValue: pipelineValue._sum.potentialValueCreation || 0,
        activeExperiments,
        avgConfidence: Math.round((avgConfidence._avg.confidence || 0) * 100) / 100,
      },
    });

    // Zugehörige Metriken als einzelne PortfolioMetric-Einträge speichern
    const metricTypes = [
      { metricType: "pipeline_value", value: snapshot.pipelineValue },
      { metricType: "avg_score_a", value: snapshot.avgScoreA },
      { metricType: "avg_score_b", value: snapshot.avgScoreB },
      { metricType: "active_count", value: totalVentures },
    ];

    await prisma.portfolioMetric.createMany({
      data: metricTypes.map((m) => ({
        metricType: m.metricType,
        value: m.value,
        period: "daily",
        calculatedAt: snapshot.calculatedAt,
      })),
    });

    return NextResponse.json({
      snapshot: {
        ...snapshot,
        calculatedAt: snapshot.calculatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[PORTFOLIO SNAPSHOT POST]", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
