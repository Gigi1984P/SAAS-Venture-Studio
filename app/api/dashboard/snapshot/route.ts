import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tägliches Snapshot erstellen für Score-Trends
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.dashboardSnapshot.findFirst({
      where: { date: { gte: today } },
    });

    if (existing) {
      return NextResponse.json({ snapshot: existing, created: false });
    }

    const opportunities = await prisma.opportunity.findMany();
    const ideas = await prisma.idea.findMany();
    const ventures = await prisma.venture.findMany();

    const businessIdeas = await prisma.$queryRaw`
      SELECT * FROM business_ideas WHERE scout_run_id IS NOT NULL
    `;
    const scrapedIdeas = (businessIdeas as any[]).length;
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

    for (const bi of businessIdeas as any[]) {
      if (bi.potential === 'high' || (bi.pain_score || 0) >= 7) {
        highPainCount++;
      }
    }

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

    return NextResponse.json({ snapshot, created: true });
  } catch (error: any) {
    console.error("[SNAPSHOT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
