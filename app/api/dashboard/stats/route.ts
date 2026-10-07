import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ─── OPPORTUNITIES + VENTURES ───
    const opportunities = await prisma.opportunity.findMany();
    const ventures = await prisma.venture.findMany();
    
    let totalMRR = 0;
    let scoreASum = 0;
    let scoreBSum = 0;
    for (const o of opportunities) {
      totalMRR += o.mrrEstimate || 0;
      scoreASum += o.scoreA || 0;
      scoreBSum += o.scoreB || 0;
    }
    const avgScoreA = opportunities.length > 0 ? Math.round(scoreASum / opportunities.length) : 0;
    const avgScoreB = opportunities.length > 0 ? Math.round(scoreBSum / opportunities.length) : 0;

    // ─── IDEEN: Einheitlicher COUNT ───
    const ideaCountResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM business_ideas WHERE scout_run_id IS NOT NULL
    `;
    const totalIdeas = (ideaCountResult as any[])?.[0]?.count || 0;

    // ─── HIGH PAIN ───
    const highPainResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM business_ideas WHERE scout_run_id IS NOT NULL AND potential = 'high'
    `;
    const highPainCount = (highPainResult as any[])?.[0]?.count || 0;

    // ─── SOURCES BREAKDOWN ───
    const sourceResult = await prisma.$queryRaw`
      SELECT source, COUNT(*)::int as count 
      FROM business_ideas 
      WHERE scout_run_id IS NOT NULL 
      GROUP BY source 
      ORDER BY count DESC
    `;
    const sources = (sourceResult as any[]) || [];

    return NextResponse.json({
      totalMRR,
      avgScoreA,
      avgScoreB,
      opportunityCount: opportunities.length,
      ventureCount: ventures.length,
      totalIdeas,
      highPainSignals: highPainCount,
      sources,
    });
  } catch (error: any) {
    console.error("[STATS]", error);
    return NextResponse.json({ 
      totalMRR: 0, avgScoreA: 0, avgScoreB: 0,
      opportunityCount: 0, ventureCount: 0, totalIdeas: 0,
      highPainSignals: 0, sources: [],
      error: error.message 
    });
  }
}
