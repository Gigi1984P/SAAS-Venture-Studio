import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/orchestrator/rules/seed
export async function POST(req: NextRequest) {
  try {
    const rules = [
      { name: "Market Research nach Pain Verification", triggerStatus: "pain_verified", minEvidence: 5, agentType: "market_researcher", taskType: "market_research", priority: 8 },
      { name: "Competitor Research nach Pain Verification", triggerStatus: "pain_verified", minEvidence: 5, agentType: "competitor_researcher", taskType: "competitor_research", priority: 8 },
      { name: "Business Analysis nach Market Research", triggerStatus: "market_research", minEvidence: 3, agentType: "business_strategist", taskType: "business_analysis", priority: 7 },
      { name: "Critic Review bei hohem Score", triggerStatus: "scored", minEvidence: 0, agentType: "critic_reviewer", taskType: "critic_review", priority: 9 },
      { name: "Fact Check nach Competition Research", triggerStatus: "competition_research", minEvidence: 2, agentType: "fact_checker", taskType: "fact_check", priority: 7 },
    ];

    let created = 0;
    for (const rule of rules) {
      await prisma.orchestratorRule.upsert({
        where: { id: "x" }, // cannot upsert by id, use create with unique check
        update: {},
        create: rule,
      });
      created++;
    }
    return NextResponse.json({ message: "Rules seeded", created });
  } catch (error) {
    console.error("[ORCHESTRATOR SEED]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
