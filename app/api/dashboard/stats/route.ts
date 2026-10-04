import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all data
    const opportunities = await prisma.opportunity.findMany();
    const ideas = await prisma.idea.findMany();
    const ventures = await prisma.venture.findMany();
    
    // Echte Scraping-Daten aus business_ideas (ohne neue Spalten, nur existierende)
    const scrapedCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM business_ideas WHERE scout_run_id IS NOT NULL
    `;
    const scrapedTotal = Number((scrapedCount as any[])?.[0]?.count) || 0;
    
    // Sources aus scout_run_id (da source Spalte nicht existiert)
    const sourcesRaw = await prisma.$queryRaw`
      SELECT scout_run_id as source, COUNT(*) as count 
      FROM business_ideas 
      WHERE scout_run_id IS NOT NULL
      GROUP BY scout_run_id
    `;
    
    // Pain Score nicht verfügbar, nutze potential als Proxy
    const highPainCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM business_ideas WHERE potential = 'high'
    `;
    const highPain = Number((highPainCount as any[])?.[0]?.count) || 0;

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

    return NextResponse.json({
      totalMRR,
      avgScoreA,
      avgScoreB,
      opportunityCount: opportunities.length,
      ventureCount: ventures.length,
      ideaCount: ideas.length,
      // Echte Scraping-Metriken
      scrapedTotal,
      highPainSignals: highPain,
      sources: sourcesRaw as any[],
    });
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
