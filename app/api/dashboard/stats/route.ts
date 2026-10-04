import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Solo-Modus: keine User-Filterung
    const [
      opportunities,
      ideas,
      ventures,
      tasks,
    ] = await Promise.all([
      prisma.opportunity.findMany(),
      prisma.idea.findMany(),
      prisma.venture.findMany(),
      prisma.task.findMany(),
    ]);

    const totalMRR = opportunities.reduce((sum, o) => sum + (o.mrrEstimate || 0), 0);
    const avgScoreA = opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + (o.scoreA || 0), 0) / opportunities.length
      : 0;
    const avgScoreB = opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + (o.scoreB || 0), 0) / opportunities.length
      : 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentIdeas = ideas.filter(i => i.status === "converted" && i.createdAt > oneWeekAgo);
    const velocity = recentIdeas.length;

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentOpps = opportunities.filter(o => o.createdAt > twoWeeksAgo);
    const olderOpps = opportunities.filter(o => o.createdAt <= twoWeeksAgo);
    const recentAvg = recentOpps.length > 0
      ? recentOpps.reduce((sum, o) => sum + (o.scoreA || 0), 0) / recentOpps.length
      : 0;
    const olderAvg = olderOpps.length > 0
      ? olderOpps.reduce((sum, o) => sum + (o.scoreA || 0), 0) / olderOpps.length
      : 0;
    const scoreTrend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return NextResponse.json({
      totalMRR,
      avgScoreA,
      avgScoreB,
      velocity,
      scoreTrend,
      opportunityCount: opportunities.length,
      ventureCount: ventures.length,
      ideaCount: ideas.length,
      taskCount: tasks.length,
      taskPending: tasks.filter(t => t.status !== "COMPLETED").length,
    });
  } catch (error) {
    console.error("[STATS]", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
