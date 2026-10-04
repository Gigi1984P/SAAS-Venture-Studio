import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all data
    const opportunities = await prisma.opportunity.findMany();
    const ideas = await prisma.idea.findMany();
    const ventures = await prisma.venture.findMany();
    const tasks = await prisma.task.findMany();

    // Calculate stats
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
      taskCount: tasks.length,
    });
  } catch (error) {
    console.error("[STATS]", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
