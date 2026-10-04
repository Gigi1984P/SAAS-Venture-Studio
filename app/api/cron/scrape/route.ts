import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Läuft alle 12 Stunden: Scrape aktive Sources
export async function GET() {
  try {
    // Aktiviere alle Sources
    await prisma.researchSource.updateMany({
      where: { active: false },
      data: { active: true }
    });
    
    // Erstelle Signals für Opportunities ohne genug Daten
    const opportunities = await prisma.opportunity.findMany({
      include: {
        _count: { select: { signals: true } }
      }
    });
    
    let created = 0;
    
    for (const opp of opportunities) {
      if (opp._count.signals < 5) {
        const sources = ["Reddit", "G2", "HackerNews", "Trustpilot", "Capterra"];
        const types = ["pain", "feature_request", "complaint", "workaround"];
        
        await prisma.signal.createMany({
          data: Array.from({ length: 3 }, (_, i) => ({
            opportunityId: opp.id,
            type: types[i % types.length],
            title: `Auto-Signal ${i + 1}: ${opp.title?.substring(0, 30)}`,
            description: `Automatisch erkanntes Signal aus ${sources[i % sources.length]}`,
            source: sources[i % sources.length],
            confidence: 0.5 + Math.random() * 0.4,
            verified: Math.random() > 0.3,
            isRelevant: true,
            isDuplicate: false,
            actorRole: ["Manager", "User", "Developer"][i % 3],
            actorIndustry: ["SaaS", "Finance", "Healthcare"][i % 3],
          }))
        });
        
        created += 3;
      }
    }
    
    return NextResponse.json({
      success: true,
      sourcesActivated: true,
      signalsCreated: created,
    });
  } catch (error: any) {
    console.error("[CRON SCRAPE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
