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

    return NextResponse.json({
      totalIdeas,
      totalOpportunities,
      totalSprints,
      totalVentures,
      totalUsers,
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
      recentIdeas: [],
      recentOpportunities: [],
    });
  }
}
