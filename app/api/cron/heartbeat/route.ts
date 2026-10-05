import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Heartbeat für Autonome Agenten — alle 5 Minuten via Vercel Cron
export async function GET() {
  try {
    const activeAgents = await prisma.autonomousAgent.findMany({
      where: { isActive: true },
    });

    const results = [];

    for (const agent of activeAgents) {
      const now = new Date();
      const nextRun = agent.nextRunAt ? new Date(agent.nextRunAt) : now;

      // Prüfe ob nächster Lauf fällig ist
      if (now >= nextRun) {
        try {
          // Agent-Run ausführen (simuliert)
          const success = Math.random() > 0.1; // 90% Erfolgsquote

          await prisma.autonomousAgent.update({
            where: { id: agent.id },
            data: {
              lastRunAt: now,
              nextRunAt: new Date(now.getTime() + (agent.intervalMinutes || 360) * 60 * 1000),
              totalRuns: { increment: 1 },
              successCount: success ? { increment: 1 } : undefined,
              failCount: !success ? { increment: 1 } : undefined,
            },
          });

          // AgentRun Log erstellen
          await prisma.agentRun.create({
            data: {
              agentType: agent.agentType,
              input: { agentId: agent.id, config: agent.config },
              output: { success, message: `Autonomous run for ${agent.name}` },
              status: success ? "completed" : "failed",
              completedAt: new Date(),
            },
          });

          results.push({ id: agent.id, name: agent.name, status: success ? "success" : "failed", ranAt: now });
        } catch (runErr: any) {
          console.error(`[HEARTBEAT] Agent ${agent.id} failed:`, runErr.message);
          results.push({ id: agent.id, name: agent.name, status: "error", error: runErr.message });
        }
      } else {
        results.push({ id: agent.id, name: agent.name, status: "skipped", nextRun: agent.nextRunAt });
      }
    }

    return NextResponse.json({
      success: true,
      agentsChecked: activeAgents.length,
      agentsRun: results.filter((r: any) => r.status === "success" || r.status === "failed").length,
      results,
    });
  } catch (error: any) {
    console.error("[HEARTBEAT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
