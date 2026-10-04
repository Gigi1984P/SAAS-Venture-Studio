import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Orchestrator: Auto-Enqueue basierend auf Opportunity-Status

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
};

export async function POST() {
  try {
    // Finde alle Opportunities die Agenten brauchen
    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: {
          in: Object.keys(AGENT_WORKFLOWS)
        }
      },
      include: {
        _count: {
          select: { agentRuns: true }
        }
      }
    });
    
    const results = [];
    
    for (const opp of opportunities) {
      const agents = AGENT_WORKFLOWS[opp.status] || [];
      
      for (const agentType of agents) {
        // Prüfe ob Agent bereits läuft
        const existing = await prisma.agentRun?.findFirst({
          where: {
            opportunityId: opp.id,
            agentType,
            status: { in: ["pending", "running"] }
          }
        }).catch(() => null);
        
        if (!existing) {
          // Erstelle Agent Run
          const run = await prisma.agentRun?.create({
            data: {
              opportunityId: opp.id,
              agentType,
              status: "pending",
              config: JSON.stringify({ trigger: "orchestrator", status: opp.status }),
            }
          }).catch(() => null);
          
          if (run) {
            results.push({ opportunity: opp.title, agent: agentType, status: "enqueued" });
          }
        }
      }
      
      // Auto-Score bei jedem Durchlauf
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/opportunities/${opp.id}/auto-score`, {
        method: "POST",
      }).catch(() => {});
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
    const runs = await prisma.agentRun?.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);
    
    return NextResponse.json({
      runs: runs || [],
      workflows: AGENT_WORKFLOWS,
    });
  } catch (error: any) {
    console.error("[ORCHESTRATOR GET]", error);
    return NextResponse.json({ runs: [], workflows: AGENT_WORKFLOWS });
  }
}
