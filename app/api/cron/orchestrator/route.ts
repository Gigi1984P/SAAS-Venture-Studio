import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: {
          in: ["discovered", "clustered", "pain_verified", "market_research", "competition_research", "business_analysis", "scored", "experiment", "validating", "building", "validated"]
        }
      }
    });
    
    const agentRuns = [];
    
    for (const opp of opportunities) {
      const agentType = getAgentForStatus(opp.status);
      if (agentType) {
        await prisma.agentRun.create({
          data: {
            agentType,
            input: { opportunityId: opp.id, status: opp.status, title: opp.title },
          }
        });
        agentRuns.push({ opp: opp.title, agent: agentType });
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      if (baseUrl) {
        await fetch(`${baseUrl}/api/opportunities/${opp.id}/auto-score`, {
          method: "POST",
        }).catch(() => {});
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
    validating: "build_gate_review",
    building: "progress_tracker",
    validated: "growth_strategist",
  };
  return map[status] || null;
}
