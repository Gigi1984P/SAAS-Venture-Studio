import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

// Status + Letzte Ideen abrufen
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId") || "ideen-scout";

    // ScoutRun finden oder erstellen
    let runs = await queryRaw(
      `SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
      agentId
    );

    let run = (runs as any[])?.[0];
    if (!run) {
      await queryRaw(
        `INSERT INTO scout_runs (agent_id, status, prompt) VALUES ($1, 'stopped', 'Finde innovative SaaS-Geschäftsideen für Solopreneure und kleine Teams. Fokus auf Marktlücken, wiederkehrende Einnahmen und niedrige Einstiegshürden.') RETURNING *`,
        agentId
      );
      runs = await queryRaw(
        `SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
        agentId
      );
      run = (runs as any[])?.[0];
    }

    // Letzte 20 Ideen
    const ideas = await queryRaw(
      `SELECT * FROM business_ideas WHERE scout_run_id = $1 ORDER BY created_at DESC LIMIT 20`,
      run?.id
    );

    return NextResponse.json({ run: run || { status: "stopped", total_ideas: 0 }, ideas: ideas || [] });
  } catch (error: any) {
    console.error("[IDEENSCOUT GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
