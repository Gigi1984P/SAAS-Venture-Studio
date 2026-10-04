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
        _count: { select: { agentRuns: true } }
      }
    });
    
    const results = [];
    
    for (const opp of opportunities) {
      const agents = AGENT_WORKFLOWS[opp.status] || [];
      
      // Erstelle Task für jeden Agenten
      for (const agentType of agents) {
        // Erstelle zuerst Task
        const task = await prisma.task.create({
          data: {
            title: `${agentType} für ${opp.title}`,
            description: `Automatisch erstellt für Opportunity ${opp.id}`,
            status: "PENDING",
            priority: "medium",
          }
        }).catch(() => null);
        
        if (task) {
          // Erstelle AgentRun mit taskId
          await prisma.agentRun.create({
            data: {
              taskId: task.id,
              agentType,
              input: JSON.stringify({ opportunityId: opp.id, status: opp.status }),
            }
          }).catch(() => {});
          
          results.push({ opportunity: opp.title, agent: agentType, status: "enqueued" });
        }
      }
      
      // Auto-Score bei jedem Durchlauf
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
      include: { task: true }
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
