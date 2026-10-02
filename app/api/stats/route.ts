import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalIdeas,
      totalOpportunities,
      totalSprints,
      totalVentures,
      totalUsers,
      recentIdeas,
      recentOpportunities,
    ] = await Promise.all([
      prisma.idea.count(),
      prisma.opportunity.count(),
      prisma.validationRun.count(),
      prisma.venture.count(),
      prisma.user.count(),
      prisma.idea.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, createdAt: true } }),
      prisma.opportunity.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, createdAt: true } }),
    ]);

    // Scout-Ideen zaehlen - versuche verschiedene Methoden
    let totalScoutIdeas = 0;
    let activeScoutRuns = 0;
    
    try {
      // Methode 1: COUNT ohne Cast
      const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM business_ideas`);
      const count = (countResult as any[]);
      totalScoutIdeas = Number(count?.[0]?.count || 0);
    } catch (e: any) {
      console.error("[STATS] business_ideas count failed:", e.message);
    }

    try {
      const runsResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM scout_runs WHERE status = 'running'`);
      const runs = (runsResult as any[]);
      activeScoutRuns = Number(runs?.[0]?.count || 0);
    } catch (e: any) {
      console.error("[STATS] scout_runs count failed:", e.message);
    }

    return NextResponse.json({
      totalIdeas,
      totalOpportunities,
      totalSprints,
      totalVentures,
      totalUsers,
      totalScoutIdeas,
      activeScoutRuns,
      recentIdeas,
      recentOpportunities,
    });
  } catch (error) {
    console.error("[STATS]", error);
    return NextResponse.json({
      totalIdeas: 0, totalOpportunities: 0, totalSprints: 0, totalVentures: 0, totalUsers: 0,
      totalScoutIdeas: 0, activeScoutRuns: 0, recentIdeas: [], recentOpportunities: [],
    });
  }
}
