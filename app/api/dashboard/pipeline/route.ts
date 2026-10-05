import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [ideas, opportunities, ventures] = await Promise.all([
      prisma.idea.findMany(),
      prisma.opportunity.findMany(),
      prisma.venture.findMany(),
    ]);

    // Echte Scraping-Daten aus business_ideas
    const businessIdeasCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM business_ideas WHERE scout_run_id IS NOT NULL
    `;
    const scrapedIdeas = (businessIdeasCount as any[])?.[0]?.count || 0;

    // Gesamtzahl = gespeicherte Ideen + gescrapte Ideen
    const totalIdeas = ideas.length + scrapedIdeas;

    // Calculate conversions (inkl. gescrapte Ideen)
    const ideaToOpportunity = totalIdeas > 0
      ? Math.round((opportunities.length / totalIdeas) * 100)
      : 0;
    
    const opportunityToVenture = opportunities.length > 0
      ? Math.round((ventures.length / opportunities.length) * 100)
      : 0;

    return NextResponse.json({
      ideas: ideas.length,
      scrapedIdeas,
      totalIdeas,
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
      scrapedIdeas: 0,
      totalIdeas: 0,
      opportunities: 0,
      ventures: 0,
      conversions: { ideaToOpportunity: 0, opportunityToVenture: 0 },
    });
  }
}
