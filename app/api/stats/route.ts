import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalIdeas, totalOpportunities, totalSprints] = await Promise.all([
      prisma.idea.count(),
      prisma.opportunity.count(),
      prisma.validationRun.count(),
    ]);

    return NextResponse.json({
      totalIdeas,
      totalOpportunities,
      scoreA: totalOpportunities,
      totalSprints,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({
      totalIdeas: 0,
      totalOpportunities: 0,
      scoreA: 0,
      totalSprints: 0,
    });
  }
}
