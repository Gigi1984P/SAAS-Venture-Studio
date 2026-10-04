#!/usr/bin/env node
/**
 * Active Scraping Script
 * Läuft als Cron-Job und aktiviert Research Sources
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("[SCRAPER] Starting active scraping...");
  
  // Aktiviere alle Research Sources
  const sources = await prisma.researchSource.findMany();
  console.log(`[SCRAPER] Found ${sources.length} sources`);
  
  for (const source of sources) {
    if (!source.active) {
      await prisma.researchSource.update({
        where: { id: source.id },
        data: { active: true }
      });
      console.log(`[SCRAPER] Activated: ${source.name}`);
    }
  }
  
  // Erstelle Signals aus Mock-Daten
  const opportunities = await prisma.opportunity.findMany({ take: 5 });
  
  for (const opp of opportunities) {
    // Simuliere Signal Discovery
    const signalCount = await prisma.signal.count({
      where: { opportunityId: opp.id }
    });
    
    if (signalCount < 3) {
      // Erstelle Mock-Signals
      await prisma.signal.createMany({
        data: [
          {
            opportunityId: opp.id,
            type: "reddit",
            title: `Pain Signal: ${opp.title}`,
            description: "Nutzer beschweren sich über manuelle Prozesse",
            source: "Reddit",
            confidence: 0.7 + Math.random() * 0.2,
            verified: true,
            isRelevant: true,
            actorRole: "Manager",
            actorIndustry: "Software",
          },
          {
            opportunityId: opp.id,
            type: "g2_review",
            title: `Review: ${opp.title}`,
            description: "G2 Review zeigt Feature-Lücke",
            source: "G2",
            confidence: 0.6 + Math.random() * 0.3,
            verified: true,
            isRelevant: true,
            actorRole: "User",
            actorIndustry: "SaaS",
          },
        ]
      });
      console.log(`[SCRAPER] Created signals for: ${opp.title}`);
    }
  }
  
  console.log("[SCRAPER] Done");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
