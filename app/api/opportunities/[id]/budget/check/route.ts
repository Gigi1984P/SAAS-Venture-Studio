import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Research Budget Enforcement middleware
// Checks: max_runtime, max_agent_runs, minimum_evidence

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const { phase } = await req.json();

  // Get all budgets for this opportunity + phase
  const budgets = await prisma.researchBudget.findMany({
    where: { opportunityId: id, phase },
  });

  if (budgets.length === 0) {
    return NextResponse.json({ allowed: true, message: "No budget configured" });
  }

  const budget = budgets[0];

  // Check spent vs budget
  if (budget.spentEur >= budget.budgetEur) {
    return NextResponse.json(
      { allowed: false, reason: "Budget exhausted", budget: budget.budgetEur, spent: budget.spentEur },
      { status: 403 }
    );
  }

  // Check task count (agent runs)
  const taskCount = await prisma.task.count({
    where: { entityId: id, entityType: "opportunity" },
  });
  if (taskCount >= budget.maxAgentRuns) {
    return NextResponse.json(
      { allowed: false, reason: "Max agent runs reached", max: budget.maxAgentRuns, current: taskCount },
      { status: 403 }
    );
  }

  // Check evidence count
  const evidenceCount = await prisma.evidenceObject.count({
    where: { validationRun: { opportunityId: id } },
  });
  if (evidenceCount < budget.minimumEvidence) {
    return NextResponse.json(
      { allowed: false, reason: "Minimum evidence not met", required: budget.minimumEvidence, current: evidenceCount },
      { status: 403 }
    );
  }

  return NextResponse.json({ allowed: true, budget, taskCount, evidenceCount });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const budgets = await prisma.researchBudget.findMany({
    where: { opportunityId: id },
    orderBy: { createdAt: "desc" },
  });

  // Enrichment with current usage
  const enriched = await Promise.all(
    budgets.map(async (b) => {
      const taskCount = await prisma.task.count({
        where: { entityId: id, entityType: "opportunity" },
      });
      const evidenceCount = await prisma.evidenceObject.count({
        where: { validationRun: { opportunityId: id } },
      });
      return {
        ...b,
        taskCount,
        evidenceCount,
        budgetRemaining: Math.max(0, b.budgetEur - b.spentEur),
        runsRemaining: Math.max(0, b.maxAgentRuns - taskCount),
        evidenceNeeded: Math.max(0, b.minimumEvidence - evidenceCount),
      };
    })
  );

  return NextResponse.json(enriched);
}
