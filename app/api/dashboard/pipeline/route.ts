import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [ideas, opportunities, ventures] = await Promise.all([
      prisma.idea.findMany(),
      prisma.opportunity.findMany(),
      prisma.venture.findMany(),
    ]);

    // Calculate conversions
    const ideaToOpportunity = ideas.length > 0
      ? Math.round((opportunities.length / ideas.length) * 100)
      : 0;
    
    const opportunityToVenture = opportunities.length > 0
      ? Math.round((ventures.length / opportunities.length) * 100)
      : 0;

    return NextResponse.json({
      ideas: ideas.length,
      opportunities: opportunities.length,
      ventures: ventures.length,
      conversions: {
        ideaToOpportunity,
        opportunityToVenture,
      },
    });
  } catch (error) {
    console.error("[PIPELINE]", error);
    return NextResponse.json({
      ideas: 0,
      opportunities: 0,
      ventures: 0,
      conversions: { ideaToOpportunity: 0, opportunityToVenture: 0 },
    });
  }
}
