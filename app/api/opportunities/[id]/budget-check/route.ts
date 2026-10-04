import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/budget-check
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const budgets = await prisma.researchBudget.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetEur, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentEur, 0);
    const remaining = totalBudget - totalSpent;

    // Count agent runs for this opportunity
    const agentRuns = await prisma.agentRun.count({
      where: {
        task: {
          entityId: params.id,
          entityType: "opportunity",
        },
      },
    });

    // Check if budget allows new run
    const canRun = remaining > 0;

    return NextResponse.json({
      budgets,
      summary: {
        totalBudget,
        totalSpent,
        remaining,
        agentRuns,
        canRun,
      },
    });
  } catch (error) {
    console.error("[BUDGET CHECK GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
