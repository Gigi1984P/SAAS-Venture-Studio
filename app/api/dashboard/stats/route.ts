import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const opportunities = await prisma.opportunity.findMany();
    const ventures = await prisma.venture.findMany();
    const ideas = await prisma.idea.findMany();
    
    const activeOpps = opportunities.filter((o: any) => o.status !== "archived");
    
    const totalMRR = ventures.reduce((sum: number, v: any) => sum + (v.mrr || 0), 0);
    const avgScoreA = opportunities.length > 0 
      ? Math.round(opportunities.reduce((s: number, o: any) => s + (o.scoreA || 0), 0) / opportunities.length)
      : 0;
    const avgScoreB = opportunities.length > 0
      ? Math.round(opportunities.reduce((s: number, o: any) => s + (o.scoreB || 0), 0) / opportunities.length)
      : 0;

    return NextResponse.json({
      opportunityCount: activeOpps.length,
      ventureCount: ventures.length,
      ideaCount: ideas.length,
      totalMRR,
      avgScoreA,
      avgScoreB,
    });
  } catch (error: any) {
    console.error("[STATS]", error);
    return NextResponse.json({
      opportunityCount: 0, ventureCount: 0, ideaCount: 0,
      totalMRR: 0, avgScoreA: 0, avgScoreB: 0,
      error: error.message,
    });
  }
}
