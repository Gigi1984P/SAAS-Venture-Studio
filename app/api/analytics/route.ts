import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all opps and filter in code
  const allOpps = await prisma.opportunity.findMany();
  const opps = allOpps.filter(o => (o as any).createdBy === userId);

  const totalOpps = opps.length;
  const activeOpps = opps.filter(o => o.status !== "completed").length;
  const avgScoreA = totalOpps > 0 ? opps.reduce((sum, o) => sum + ((o as any).scoreA || 0), 0) / totalOpps : 0;
  const avgScoreB = totalOpps > 0 ? opps.reduce((sum, o) => sum + ((o as any).scoreB || 0), 0) / totalOpps : 0;

  const recentOpps = opps.filter(o => o.createdAt >= thirtyDaysAgo).slice(0, 10);

  const scoreTrends = await prisma.scoreTrend.findMany({
    where: { opportunityId: { in: recentOpps.map(o => o.id) } },
    orderBy: { recordedAt: "asc" },
    take: 30,
  });

  const activityLogs = await prisma.activityLog.findMany({
    where: { userId, createdAt: { gte: thirtyDaysAgo } },
  });
  const activity: Record<string, number> = {};
  activityLogs.forEach(a => {
    activity[a.action] = (activity[a.action] || 0) + 1;
  });

  return NextResponse.json({
    pipeline: {
      total: totalOpps,
      active: activeOpps,
      avgScoreA: Math.round(avgScoreA * 10) / 10,
      avgScoreB: Math.round(avgScoreB * 10) / 10,
    },
    scoreTrends: scoreTrends.map(s => ({
      date: s.recordedAt.toISOString().split("T")[0],
      scoreA: s.scoreA,
      scoreB: s.scoreB,
    })),
    activity,
    recentOpps: recentOpps.map(o => ({
      id: o.id,
      title: (o as any).title,
      scoreA: (o as any).scoreA,
      scoreB: (o as any).scoreB,
      status: o.status,
      createdAt: o.createdAt.toISOString().split("T")[0],
    })),
  });
  } catch (error) {
    console.error("[ANALYTICS GET]", error);
    return NextResponse.json([]);
  }
}
