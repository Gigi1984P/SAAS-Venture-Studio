import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Finde alle Ideas die noch keine Opportunity haben
    const ideas = await prisma.idea.findMany({
      where: { status: { in: ["new", "reviewed"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    
    const results = [];
    
    for (const idea of ideas) {
      // Prüfe ob bereits Opportunity existiert
      const existing = await prisma.opportunity.findFirst({
        where: {
          title: { contains: idea.title.substring(0, 20), mode: "insensitive" }
        }
      });
      
      if (!existing) {
        // Erstelle Opportunity aus Idee
        const opp = await prisma.opportunity.create({
          data: {
            title: idea.title,
            description: idea.description || "",
            status: "discovered",
            painSeverity: 50 + Math.floor(Math.random() * 40),
            frequency: 60 + Math.floor(Math.random() * 30),
            economicImpact: 55 + Math.floor(Math.random() * 35),
            reachability: 60 + Math.floor(Math.random() * 30),
            competitionGap: 50 + Math.floor(Math.random() * 30),
            switchingMotivation: 65 + Math.floor(Math.random() * 25),
            recurringNature: 70 + Math.floor(Math.random() * 20),
            evidenceQuality: 50 + Math.floor(Math.random() * 30),
            mvpSimplicity: 55 + Math.floor(Math.random() * 25),
            aiLeverage: 60 + Math.floor(Math.random() * 30),
            grossMargin: 65 + Math.floor(Math.random() * 25),
            distributionAdvantage: 50 + Math.floor(Math.random() * 30),
            defensibility: 55 + Math.floor(Math.random() * 25),
            scoreA: 0,
            scoreB: 0,
            confidence: 0.3,
          }
        });
        
        // Auto-Score
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        if (baseUrl) {
          await fetch(`${baseUrl}/api/opportunities/${opp.id}/auto-score`, {
            method: "POST",
          }).catch(() => {});
        }
        
        // Update Idea Status
        await prisma.idea.update({
          where: { id: idea.id },
          data: { status: "converted" }
        });
        
        results.push({ idea: idea.title, opportunity: opp.id });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: ideas.length,
      converted: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[AUTO CONVERT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
