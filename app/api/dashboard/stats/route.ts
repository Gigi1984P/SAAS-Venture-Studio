import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to safely serialize BigInt values
function safeSerialize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(safeSerialize);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = safeSerialize(obj[key]);
    }
    return result;
  }
  return obj;
}

export async function GET() {
  try {
    const opportunities = await prisma.opportunity.findMany();
    const ideas = await prisma.idea.findMany();
    const ventures = await prisma.venture.findMany();
    
    // Use findMany + length to avoid BigInt issues
    const allBusinessIdeas = await prisma.$queryRaw`
      SELECT * FROM business_ideas WHERE scout_run_id IS NOT NULL LIMIT 500
    `;
    const scrapedTotal = (allBusinessIdeas as any[]).length;
    
    // Sources breakdown - manual count
    const sourceMap: Record<string, number> = {};
    for (const idea of allBusinessIdeas as any[]) {
      const src = idea.scout_run_id || 'unknown';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }
    const sources = Object.entries(sourceMap).map(([source, count]) => ({ source, count }));
    
    // High pain = potential = 'high'
    const highPainCount = (allBusinessIdeas as any[]).filter((i: any) => i.potential === 'high').length;

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

    return NextResponse.json(safeSerialize({
      totalMRR,
      avgScoreA,
      avgScoreB,
      opportunityCount: opportunities.length,
      ventureCount: ventures.length,
      ideaCount: ideas.length,
      scrapedTotal,
      highPainSignals: highPainCount,
      sources,
    }));
  } catch (error: any) {
    console.error("[STATS]", error);
    return NextResponse.json({ 
      totalMRR: 0, avgScoreA: 0, avgScoreB: 0,
      opportunityCount: 0, ventureCount: 0, ideaCount: 0,
      scrapedTotal: 0, highPainSignals: 0, sources: [],
      error: error.message 
    });
  }
}
