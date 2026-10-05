import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, action } = body; // action: start, pause, stop

    if (!agentId || !action) {
      return NextResponse.json({ error: "agentId und action erforderlich" }, { status: 400 });
    }

    // ScoutRun finden
    let runs = await queryRaw(
      `SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
      agentId
    );

    let run = (runs as any[])?.[0];
    if (!run) {
      // Prisma Client statt RAW SQL — damit CUID automatisch generiert wird
      const newRun = await prisma.scoutRun.create({
        data: {
          agentId,
          status: "stopped",
          intervalSec: 300,
        },
      });
      run = newRun;
    }

    const newStatus = action === "start" ? "running" : action === "pause" ? "paused" : "stopped";
    
    await queryRaw(
      `UPDATE scout_runs SET status = $1, updated_at = NOW() WHERE id = $2`,
      newStatus,
      run.id
    );

    return NextResponse.json({ 
      success: true, 
      agentId, 
      action,
      status: newStatus,
      scoutRunId: run.id,
    });

  } catch (error: any) {
    console.error("[IDEENSCOUT CONTROL]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
