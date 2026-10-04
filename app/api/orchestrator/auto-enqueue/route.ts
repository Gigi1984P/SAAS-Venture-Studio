import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AGENT_WORKFLOWS: Record<string, string[]> = {
  discovered: ["signal_discovery"],
  clustered: ["pain_analysis"],
  pain_verified: ["market_research", "competitor_research"],
  market_research: ["business_analysis"],
  competition_research: ["fact_check", "critic_review"],
  business_analysis: ["scoring"],
  scored: ["experiment_design"],
  experiment: ["validation_monitor"],
  validating: ["build_gate_review"],
  build_approved: ["build_monitor", "mvp_architect"],
  building: ["progress_tracker", "risk_monitor"],
  validated: ["growth_strategist"],
};

export async function POST() {
  try {
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: { in: Object.keys(AGENT_WORKFLOWS) }
      }
    });
    
    const results = [];
    
    for (const opp of opportunities) {
      const agents = AGENT_WORKFLOWS[opp.status] || [];
      
      for (const agentType of agents) {
        // Create a dummy task first (minimal required fields)
        let taskId = "direct-run";
        try {
          const task = await prisma.task.create({
            data: {
              type: agentType,
              entityId: opp.id,
              entityType: "opportunity",
              agent: agentType,
            }
          });
          taskId = task.id;
        } catch (taskErr: any) {
          console.log("[TASK SKIP]", taskErr.message);
          // Continue without task
        }
        
        // Create AgentRun (with or without task)
        try {
          const runData: any = {
            agentType,
            input: { opportunityId: opp.id, status: opp.status },
          };
          if (taskId !== "direct-run") {
            runData.taskId = taskId;
          }
          
          await prisma.agentRun.create({ data: runData });
          results.push({ opportunity: opp.title, agent: agentType });
        } catch (runErr: any) {
          console.log("[AGENT RUN SKIP]", runErr.message);
        }
      }
      
      // Auto-Score
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      if (baseUrl) {
        await fetch(`${baseUrl}/api/opportunities/${opp.id}/auto-score`, {
          method: "POST",
        }).catch(() => {});
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: opportunities.length,
      enqueued: results.length,
      runs: results,
    });
  } catch (error: any) {
    console.error("[ORCHESTRATOR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const runs = await prisma.agentRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
    });
    
    return NextResponse.json({
      runs: runs || [],
      workflows: AGENT_WORKFLOWS,
    });
  } catch (error: any) {
    console.error("[ORCHESTRATOR GET]", error);
    return NextResponse.json({ runs: [], workflows: AGENT_WORKFLOWS });
  }
}
