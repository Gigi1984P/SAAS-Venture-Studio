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
      // Auto-Score
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      if (baseUrl) {
        await fetch(`${baseUrl}/api/opportunities/${opp.id}/auto-score`, {
          method: "POST",
        }).catch(() => {});
      }
      
      // Create Task + AgentRun with required fields
      const agentType = getAgentForStatus(opp.status);
      if (agentType) {
        const task = await prisma.task.create({
          data: {
            title: `${agentType} für ${opp.title}`,
            description: `Cron-Trigger für Opportunity ${opp.id}`,
            status: "PENDING",
            priority: "medium",
            type: agentType,
            entityId: opp.id,
            entityType: "opportunity",
            agent: agentType,
          }
        }).catch((err: any) => {
          console.error("[CRON TASK ERROR]", err.message);
          return null;
        });
        
        if (task) {
          await prisma.agentRun.create({
            data: {
              taskId: task.id,
              agentType,
              input: { opportunityId: opp.id, status: opp.status },
            }
          }).catch(() => {});
          
          agentRuns.push({ opp: opp.title, agent: agentType, taskId: task.id });
        }
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
