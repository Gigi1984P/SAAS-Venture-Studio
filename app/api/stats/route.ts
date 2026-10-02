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

    // Scout-Ideen aus business_ideas Tabelle (Raw SQL da Prisma Client evtl. nicht alle Spalten kennt)
    let scoutIdeasCount = 0;
    let scoutRunsCount = 0;
    try {
      const scoutResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM business_ideas`);
      scoutIdeasCount = (scoutResult as any[])?.[0]?.count || 0;
      const runsResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM scout_runs WHERE status = 'running'`);
      scoutRunsCount = (runsResult as any[])?.[0]?.count || 0;
    } catch { /* ignore */ }

    return NextResponse.json({
      totalIdeas,
      totalOpportunities,
      totalSprints,
      totalVentures,
      totalUsers,
      recentIdeas,
      recentOpportunities,
      totalScoutIdeas: scoutIdeasCount,
      activeScoutRuns: scoutRunsCount,
    });
  } catch (error) {
    console.error("[STATS]", error);
    return NextResponse.json({
      totalIdeas: 0,
      totalOpportunities: 0,
      totalSprints: 0,
      totalVentures: 0,
      totalUsers: 0,
      recentIdeas: [],
      recentOpportunities: [],
      totalScoutIdeas: 0,
      activeScoutRuns: 0,
    });
  }
}
