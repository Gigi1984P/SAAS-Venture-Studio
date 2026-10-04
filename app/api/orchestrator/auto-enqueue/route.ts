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
      where: { status: { in: Object.keys(AGENT_WORKFLOWS) } }
    });
    
    const results = [];
    const errors = [];
    
    for (const opp of opportunities) {
      const agents = AGENT_WORKFLOWS[opp.status] || [];
      
      for (const agentType of agents) {
        try {
          // Try to create AgentRun (may fail due to schema mismatch)
          await prisma.agentRun.create({
            data: {
              agentType,
              input: { opportunityId: opp.id, status: opp.status, title: opp.title },
            }
          });
          results.push({ opportunity: opp.title, agent: agentType });
        } catch (runErr: any) {
          errors.push({ agent: agentType, error: runErr.message });
          // Continue with other agents
        }
      }
      
      // Auto-Score (best effort)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        if (baseUrl) {
          await fetch(`${baseUrl}/api/opportunities/${opp.id}/auto-score`, {
            method: "POST",
          }).catch(() => {});
        }
      } catch (e) {}
    }
    
    return NextResponse.json({
      success: true,
      processed: opportunities.length,
      enqueued: results.length,
      runs: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[ORCHESTRATOR] Fatal:", error);
    return NextResponse.json({ 
      error: error.message,
      processed: 0,
      enqueued: 0,
    }, { status: 500 });
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
