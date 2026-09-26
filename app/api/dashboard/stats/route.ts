import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user?.id || "";

  const [
    opportunities,
    ideas,
    ventures,
    tasks,
  ] = await Promise.all([
    prisma.opportunity.findMany({ where: { createdById: userId } }),
    prisma.idea.findMany({ where: { createdById: userId } }),
    prisma.venture.findMany({ where: { createdById: userId } }),
    prisma.task.findMany({ where: { assigneeId: userId } }),
  ]);

  const totalMRR = opportunities.reduce((sum, o) => sum + (o.mrrEstimate || 0), 0);
  const avgScoreA = opportunities.length > 0 
    ? opportunities.reduce((sum, o) => sum + (o.scoreA || 0), 0) / opportunities.length 
    : 0;
  const avgScoreB = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + (o.scoreB || 0), 0) / opportunities.length
    : 0;

  // Velocity: ideas converted to opportunities in last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentIdeas = ideas.filter(i => i.status === "converted" && i.createdAt > oneWeekAgo);
  const velocity = recentIdeas.length;

  // Validation progress: avg of validation stages completed
  const validationProgress = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + (o.validationProgress || 0), 0) / opportunities.length
    : 0;

  // Score trend (compare last 2 weeks)
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
    validationProgress,
    scoreTrend,
    opportunityCount: opportunities.length,
    ventureCount: ventures.length,
    ideaCount: ideas.length,
    taskCount: tasks.length,
    taskPending: tasks.filter(t => t.status !== "COMPLETED").length,
  });
}
