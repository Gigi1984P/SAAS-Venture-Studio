import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await prisma.user.findFirst({ where: { email: "gianluigi.plantone@googlemail.com" } });
    const userId = user?.id;

    // === INTELLIGENCE SOURCES ===
    const existingSources = await prisma.intelligenceSourceConfig.count();
    if (existingSources === 0) {
      await prisma.intelligenceSourceConfig.createMany({
        data: [
          {
            slug: "reddit",
            name: "Reddit",
            description: "Reddit Communities für Pain Signals",
            type: "scraper",
            baseUrl: "https://reddit.com",
            searchUrl: "https://reddit.com/search?q=",
            rateLimitRpm: 30,
            isActive: true,
            priority: 1,
          },
          {
            slug: "hackernews",
            name: "HackerNews",
            description: "HN Comments und Posts",
            type: "scraper",
            baseUrl: "https://news.ycombinator.com",
            searchUrl: "https://hn.algolia.com/?q=",
            rateLimitRpm: 20,
            isActive: true,
            priority: 2,
          },
          {
            slug: "g2",
            name: "G2 Reviews",
            description: "Software Reviews von G2",
            type: "scraper",
            baseUrl: "https://g2.com",
            rateLimitRpm: 10,
            isActive: true,
            priority: 3,
          },
          {
            slug: "github",
            name: "GitHub Discussions",
            description: "GitHub Issues und Discussions",
            type: "api",
            baseUrl: "https://api.github.com",
            apiEndpoint: "https://api.github.com/search/issues",
            rateLimitRpm: 60,
            isActive: true,
            priority: 4,
          },
        ],
      });
    }

    // === AUTONOMOUS AGENTS ===
    const existingAgents = await prisma.autonomousAgent.count();
    if (existingAgents === 0) {
      await prisma.autonomousAgent.createMany({
        data: [
          {
            name: "IdeenScout",
            description: "Durchsucht Quellen nach neuen Geschäftsideen",
            agentType: "scout",
            schedule: "0 */6 * * *",
            intervalMinutes: 360,
            isActive: false,
            config: { sources: ["reddit", "hackernews", "github"], keywords: ["SaaS", "pain point", "frustrated"] },
          },
          {
            name: "PainValidator",
            description: "Validiert erkannte Pain Signals mit externen Quellen",
            agentType: "validator",
            schedule: "0 */12 * * *",
            intervalMinutes: 720,
            isActive: false,
            config: { minConfidence: 0.7, crossReference: true },
          },
          {
            name: "MarketMonitor",
            description: "Überwacht Marktentwicklungen und Wettbewerber",
            agentType: "monitor",
            schedule: "0 0 * * *",
            intervalMinutes: 1440,
            isActive: false,
            config: { trackCompetitors: true, trackPricing: true },
          },
        ],
      });
    }

    // Update existing opportunities with business dimensions
    const opps = await prisma.opportunity.findMany();
    
    for (const opp of opps) {
      await prisma.opportunity.update({
        where: { id: opp.id },
        data: {
          reachability: opp.reachability || 70 + Math.floor(Math.random() * 20),
          competitionGap: opp.competitionGap || 60 + Math.floor(Math.random() * 25),
          switchingMotivation: opp.switchingMotivation || 75 + Math.floor(Math.random() * 15),
          recurringNature: opp.recurringNature || 80 + Math.floor(Math.random() * 15),
          evidenceQuality: opp.evidenceQuality || 70 + Math.floor(Math.random() * 20),
          mvpSimplicity: opp.mvpSimplicity || 65 + Math.floor(Math.random() * 25),
          aiLeverage: opp.aiLeverage || 75 + Math.floor(Math.random() * 20),
          grossMargin: opp.grossMargin || 80 + Math.floor(Math.random() * 15),
          distributionAdvantage: opp.distributionAdvantage || 60 + Math.floor(Math.random() * 25),
          defensibility: opp.defensibility || 65 + Math.floor(Math.random() * 25),
        }
      });
      
      // Trigger auto-score
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/opportunities/${opp.id}/auto-score`, {
        method: "POST",
      }).catch(() => {});
    }
    
    return NextResponse.json({ 
      success: true, 
      action: "business_dimensions_updated",
      opportunitiesUpdated: opps.length,
      intelligenceSourcesCreated: existingSources === 0 ? 4 : 0,
      autonomousAgentsCreated: existingAgents === 0 ? 3 : 0,
    });
  } catch (error: any) {
    console.error("[SEED]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
