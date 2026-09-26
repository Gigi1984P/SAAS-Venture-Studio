import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 5. Weekly Digest Generation
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user?.id || "";
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    newIdeas,
    newOpportunities,
    scoreChanges,
    pendingTasks,
    pipelineValue,
  ] = await Promise.all([
    prisma.idea.count({ where: { createdById: userId, createdAt: { gte: oneWeekAgo } } }),
    prisma.opportunity.count({ where: { createdById: userId, createdAt: { gte: oneWeekAgo } } }),
    prisma.score.findMany({
      where: { calculatedAt: { gte: oneWeekAgo } },
      orderBy: { calculatedAt: "desc" },
      take: 10,
      include: { opportunity: { select: { title: true } } },
    }),
    prisma.task.findMany({
      where: { assigneeId: userId, status: { not: "COMPLETED" } },
      orderBy: { priority: "desc" },
      take: 5,
    }),
    prisma.opportunity.aggregate({
      where: { createdById: userId },
      _sum: { mrrEstimate: true },
    }),
  ]);

  const digest = {
    weekOf: new Date().toISOString().split("T")[0],
    newIdeas,
    newOpportunities,
    totalMRR: pipelineValue._sum.mrrEstimate || 0,
    pendingTasks: pendingTasks.length,
    scoreTrends: scoreChanges.map((s: any) => ({
      opportunity: s.opportunity?.title,
      type: s.scoreType,
      value: s.value,
      date: s.calculatedAt,
    })),
    topTasks: pendingTasks.map((t: any) => ({ title: t.title, priority: t.priority, status: t.status })),
  };

  return NextResponse.json(digest);
}
