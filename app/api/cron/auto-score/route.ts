import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Läuft täglich um 2 Uhr: Auto-Score alle Opportunities
export async function GET() {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: {
        OR: [
          { scoreA: { equals: 0 } },
          { scoreA: { equals: null } },
        ]
      }
    });
    
    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
    
    for (const opp of opportunities) {
      const res = await fetch(`${baseUrl}/api/opportunities/${opp.id}/auto-score`, {
        method: "POST",
      }).catch(() => null);
      
      if (res?.ok) {
        const data = await res.json();
        results.push({ id: opp.id, title: opp.title, ...data });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[CRON AUTO-SCORE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
