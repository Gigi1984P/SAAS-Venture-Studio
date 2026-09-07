import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAgent, AgentTask } from "@/lib/agents/index";
import { runIntelligenceGathering, extractPainPoints } from "@/lib/agents/tools";

// POST /api/tasks/process
// Wird alle 5 Minuten via Vercel Cron aufgerufen
export async function POST(_req: Request) {
  try {
    console.log("[TASK WORKER] Processing started...");
    
    // 1. Hole queued Tasks (max 5 pro Durchlauf)
    const tasks = await prisma.task.findMany({
      where: { status: "queued" },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 5,
      include: { agentRuns: true },
    });
    
    console.log(`[TASK WORKER] Found ${tasks.length} queued tasks`);
    
    if (tasks.length === 0) {
      return NextResponse.json({ message: "Keine Tasks zu verarbeiten", processed: 0 });
    }
    
    const results = [];
    
    for (const task of tasks) {
      try {
        // Update Status → running
        await prisma.task.update({
          where: { id: task.id },
          data: { status: "running", startedAt: new Date(), attempts: { increment: 1 } },
        });
        
        // Prüfe Budget vor Ausführung
        const budgets = await prisma.researchBudget.findMany({
          where: { opportunityId: task.entityId, status: "active" },
        });
        
        const totalSpent = budgets.reduce((s, b) => s + b.spentEur, 0);
        const totalBudget = budgets.reduce((s, b) => s + b.budgetEur, 0);
        
        if (totalSpent >= totalBudget) {
          await prisma.task.update({
            where: { id: task.id },
            data: { status: "failed", error: "Budget exhausted" },
          });
          results.push({ taskId: task.id, status: "failed", reason: "Budget exhausted" });
          continue;
        }
        
        // Hole Opportunity Daten
        const opp = await prisma.opportunity.findUnique({
          where: { id: task.entityId },
          include: { signals: true, painSignals: true },
        });
        
        if (task.agent === "market_researcher" && opp) {
          // Nutze die Intelligence Engine (alle konfigurierten Quellen)
          console.log(`[TASK WORKER] Running Intelligence Gathering for: ${opp.title}`);
          const { sources, stats } = await runIntelligenceGathering(
            `${opp.title} ${opp.targetGroup || "saas"} pain points reviews`,
            opp.industryId || undefined
          );
          
          for (const source of sources.slice(0, 3)) {
            const pains = extractPainPoints(source.text);
            
            // Speichere als Pain Signals
            for (const pain of pains.slice(0, 5)) {
              await prisma.painSignal.create({
                data: {
                  opportunityId: task.entityId,
                  source: new URL(source.url).hostname,
                  sourceUrl: source.url,
                  rawText: pain.pain,
                  pain: pain.pain,
                  painIntensity: pain.intensity,
                  confidence: 0.6,
                },
              });
            }
            
            // Speichere als Signal
            await prisma.signal.create({
              data: {
                opportunityId: task.entityId,
                type: "web_research",
                title: source.title.slice(0, 100),
                description: source.text.slice(0, 500),
                source: new URL(source.url).hostname,
                sourceUrl: source.url,
                confidence: 0.6,
                verified: false,
              },
            });
          }
          
          await prisma.task.update({
            where: { id: task.id },
            data: {
              status: "completed",
              completedAt: new Date(),
              result: { sources: sources.length, stats, taskType: "intelligence_gathering" } as any,
              actualCost: sources.length * 0.5, // Mock Kosten
            },
          });
          
        } else {
          // Standard Agent-Ausführung
          const agentTask: AgentTask = {
            id: task.id,
            agentType: task.agent as any,
            input: {
              title: opp?.title,
              description: opp?.description,
              pain: opp?.pain,
              targetGroup: opp?.targetGroup,
            },
          };
          
          const result = await runAgent(agentTask);
          
          await prisma.task.update({
            where: { id: task.id },
            data: {
              status: result.status === "completed" ? "completed" : "failed",
              completedAt: new Date(),
              result: result.output as any,
              error: result.status === "failed" ? JSON.stringify(result.output.error) : null,
              actualCost: result.runtimeSeconds ? Math.ceil(result.runtimeSeconds / 10) : 0,
            },
          });
        }
        
        // Update Budget
        if (budgets.length > 0) {
          await prisma.researchBudget.updateMany({
            where: { opportunityId: task.entityId, status: "active" },
            data: { spentEur: { increment: 1 } },
          });
        }
        
        results.push({ taskId: task.id, status: "completed" });
        
      } catch (taskError) {
        console.error(`[TASK WORKER] Task ${task.id} failed:`, taskError);
        await prisma.task.update({
          where: { id: task.id },
          data: { status: "failed", error: String(taskError) },
        });
        results.push({ taskId: task.id, status: "failed", error: String(taskError) });
      }
    }
    
    return NextResponse.json({
      message: "Tasks verarbeitet",
      processed: tasks.length,
      results,
    });
    
  } catch (error) {
    console.error("[TASK WORKER ERROR]", error);
    return NextResponse.json({ message: "Worker Fehler", error: String(error) }, { status: 500 });
  }
}

// GET /api/tasks/process
// Manueller Trigger fuer Task Processing
export async function GET() {
  return POST(new Request("http://localhost"));
}
