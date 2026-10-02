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

    // Scout-Ideen zaehlen (try/catch fuer den Fall dass Tabellen nicht existieren)
    let totalScoutIdeas = 0;
    let activeScoutRuns = 0;
    try {
      const countResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM business_ideas`);
      totalScoutIdeas = (countResult as any[])?.[0]?.count || 0;
    } catch { /* Tabelle existiert nicht */ }

    try {
      const runsResult = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM scout_runs WHERE status = 'running'`);
      activeScoutRuns = (runsResult as any[])?.[0]?.count || 0;
    } catch { /* Tabelle existiert nicht */ }

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
      totalIdeas: 0,
      totalOpportunities: 0,
      totalSprints: 0,
      totalVentures: 0,
      totalUsers: 0,
      totalScoutIdeas: 0,
      activeScoutRuns: 0,
      recentIdeas: [],
      recentOpportunities: [],
    });
  }
}
