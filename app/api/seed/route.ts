import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await prisma.user.findFirst({ where: { email: "gianluigi.plantone@googlemail.com" } });
    const userId = user?.id;

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
      opportunitiesUpdated: opps.length 
    });
  } catch (error: any) {
    console.error("[SEED]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
