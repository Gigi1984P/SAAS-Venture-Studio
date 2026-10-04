import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Automatische Task-Erstellung basierend auf Orchestrator Rules.
 * Wird bei Opportunity Status-Change aufgerufen.
 */
export async function POST(req: NextRequest) {
  try {
    const { opportunityId, status } = await req.json();
    if (!opportunityId || !status) {
      return NextResponse.json({ message: "opportunityId und status erforderlich" }, { status: 400 });
    }

    // Lade alle aktiven Rules fuer diesen Trigger-Status
    const rules = await prisma.orchestratorRule.findMany({
      where: { triggerStatus: status, isActive: true },
      orderBy: { priority: "desc" },
    });

    const createdTasks: any[] = [];

    for (const rule of rules) {
      // Pruefe minEvidence
      if (rule.minEvidence > 0) {
        const evidenceCount = await prisma.signal.count({
          where: { opportunityId, verified: true },
        });
        if (evidenceCount < rule.minEvidence) continue;
      }

      // Erstelle Task
      const task = await prisma.task.create({
        data: {
          type: rule.taskType,
          entityId: opportunityId,
          entityType: "opportunity",
          agent: rule.agentType,
          priority: rule.priority,
          status: "queued",
        },
      });
      createdTasks.push({ taskId: task.id, ruleName: rule.name, agentType: rule.agentType });
    }

    return NextResponse.json({
      triggered: createdTasks.length > 0,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error("[ORCHESTRATOR AUTO-ENQUEUE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
