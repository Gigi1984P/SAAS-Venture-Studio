import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await prisma.user.findFirst({ where: { email: "gianluigi.plantone@googlemail.com" } });
    const userId = user?.id;

    const existing = await prisma.opportunity.findFirst({ where: { title: "Compliance Monitoring Dashboard" } });
    if (existing) {
      // Update mit Business-Dimensionen
      await prisma.opportunity.update({
        where: { id: existing.id },
        data: {
          reachability: 75,
          competitionGap: 60,
          switchingMotivation: 80,
          recurringNature: 90,
          evidenceQuality: 85,
          mvpSimplicity: 70,
          aiLeverage: 80,
          grossMargin: 85,
          distributionAdvantage: 65,
          defensibility: 70,
          painSeverity: 95,
          frequency: 85,
          economicImpact: 90,
        }
      });
      
      // Auto-Score triggern
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/opportunities/${existing.id}/auto-score`, {
        method: "POST",
      }).catch(() => {});
      
      return NextResponse.json({ success: true, action: "updated_with_business_dims", opportunities: 1 });
    }

    // ... existing seed logic ...
    return NextResponse.json({ success: true, action: "seeded" });
  } catch (error: any) {
    console.error("[SEED]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
