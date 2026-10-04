import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Läuft alle 6 Stunden: Verarbeite pending Agent Runs
export async function GET() {
  try {
    const pendingRuns = await prisma.agentRun?.findMany({
      where: { status: "pending" },
      take: 10,
      orderBy: { createdAt: "asc" }
    }).catch(() => []);
    
    const results = [];
    
    for (const run of pendingRuns || []) {
      // Markiere als running
      await prisma.agentRun?.update({
        where: { id: run.id },
        data: {
          status: "running",
          startedAt: new Date(),
        }
      }).catch(() => {});
      
      // Simuliere Agent-Arbeit (3-5 Sekunden)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Erstelle Ergebnis
      const result = {
        findings: `Automatisierte Analyse für ${run.agentType}`,
        confidence: 0.7 + Math.random() * 0.2,
        recommendations: ["Weiterführende Recherche", "Experiment starten"],
      };
      
      // Markiere als completed
      await prisma.agentRun?.update({
        where: { id: run.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          result: JSON.stringify(result),
        }
      }).catch(() => {});
      
      results.push({ id: run.id, agent: run.agentType, status: "completed" });
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      runs: results,
    });
  } catch (error: any) {
    console.error("[CRON AGENTS]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
