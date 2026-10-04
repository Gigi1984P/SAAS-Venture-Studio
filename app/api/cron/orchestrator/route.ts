import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Läuft stündlich: Triggere Orchestrator
export async function GET() {
  try {
    // Rufe Orchestrator API auf
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
    if (baseUrl) {
      await fetch(`${baseUrl}/api/orchestrator/auto-enqueue`, {
        method: "POST",
      }).catch(() => {});
    }
    
    // Direkte Orchestrator-Logik
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: {
          in: ["discovered", "clustered", "pain_verified", "market_research", "competition_research", "business_analysis", "scored", "experiment"]
        }
      }
    });
    
    const agentRuns = [];
    
    for (const opp of opportunities) {
      // Prüfe ob Auto-Score nötig
      if (!opp.scoreA || opp.scoreA === 0) {
        await fetch(`${baseUrl}/api/opportunities/${opp.id}/auto-score`, {
          method: "POST",
        }).catch(() => {});
      }
      
      // Erstelle Agent Run basierend auf Status
      const agentType = getAgentForStatus(opp.status);
      if (agentType) {
        const run = await prisma.agentRun?.create({
          data: {
            opportunityId: opp.id,
            agentType,
            status: "pending",
            config: JSON.stringify({ source: "cron", status: opp.status }),
          }
        }).catch(() => null);
        
        if (run) agentRuns.push({ opp: opp.title, agent: agentType });
      }
    }
    
    return NextResponse.json({
      success: true,
      opportunitiesProcessed: opportunities.length,
      agentRunsCreated: agentRuns.length,
      runs: agentRuns,
    });
  } catch (error: any) {
    console.error("[CRON ORCHESTRATOR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getAgentForStatus(status: string): string | null {
  const map: Record<string, string> = {
    discovered: "signal_discovery",
    clustered: "pain_analysis",
    pain_verified: "market_research",
    market_research: "competitor_research",
    competition_research: "fact_check",
    business_analysis: "scoring",
    scored: "experiment_design",
    experiment: "validation_monitor",
  };
  return map[status] || null;
}
