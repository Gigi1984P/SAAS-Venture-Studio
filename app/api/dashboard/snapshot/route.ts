import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dashboard-Snapshot mit aktuellen Daten erstellen
export async function POST() {
  try {
    const opportunities = await prisma.opportunity.findMany();
    const ideas = await prisma.idea.findMany();
    const ventures = await prisma.venture.findMany();

    const businessIdeas = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM business_ideas WHERE scout_run_id IS NOT NULL
    `;
    const scrapedIdeas = (businessIdeas as any[])?.[0]?.count || 0;
    const totalIdeas = ideas.length + scrapedIdeas;

    let totalMRR = 0;
    let scoreASum = 0;
    let scoreBSum = 0;
    let highPainCount = 0;

    for (const o of opportunities) {
      totalMRR += o.mrrEstimate || 0;
      scoreASum += o.scoreA || 0;
      scoreBSum += o.scoreB || 0;
    }

    const avgScoreA = opportunities.length > 0 ? Math.round(scoreASum / opportunities.length) : 0;
    const avgScoreB = opportunities.length > 0 ? Math.round(scoreBSum / opportunities.length) : 0;

    const highPainResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM business_ideas WHERE scout_run_id IS NOT NULL AND potential = 'high'
    `;
    highPainCount = (highPainResult as any[])?.[0]?.count || 0;

    const conversionRate = totalIdeas > 0
      ? Math.round((opportunities.length / totalIdeas) * 100)
      : 0;

    const snapshot = await prisma.dashboardSnapshot.create({
      data: {
        date: new Date(),
        totalIdeas,
        totalOpportunities: opportunities.length,
        totalVentures: ventures.length,
        avgScoreA,
        avgScoreB,
        totalMRR,
        highPainIdeas: highPainCount,
        newSignals: 0,
        conversionRate,
      },
    });

    return NextResponse.json({ success: true, snapshot });
  } catch (error: any) {
    console.error("[SNAPSHOT POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Anzahl Snapshots zurückgeben
export async function GET() {
  try {
    const snapshots = await prisma.dashboardSnapshot.findMany({
      orderBy: { date: "desc" },
      take: 30,
    });
    return NextResponse.json({ count: snapshots.length, snapshots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, count: 0, snapshots: [] });
  }
}
