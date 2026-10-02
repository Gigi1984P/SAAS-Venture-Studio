import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Raw SQL Helper um Prisma Typ-Probleme zu umgehen
async function queryFirst(sql: string, ...values: any[]) {
  const result = await prisma.$queryRawUnsafe(sql, ...values);
  return Array.isArray(result) ? result[0] : null;
}

async function queryMany(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

// Status + Letzte Ideen abrufen
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId") || "ideen-scout";

    // AgentRun finden oder erstellen
    let runs = await queryMany(
      `SELECT * FROM agent_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
      agentId
    );

    let run = runs?.[0];
    if (!run) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO agent_runs (agent_id, status) VALUES ($1, 'stopped') RETURNING *`,
        agentId
      );
      runs = await queryMany(
        `SELECT * FROM agent_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
        agentId
      );
      run = runs?.[0];
    }

    // Letzte 10 Ideen
    const ideas = await queryMany(
      `SELECT * FROM business_ideas WHERE agent_run_id = $1 ORDER BY created_at DESC LIMIT 10`,
      run?.id
    );

    return NextResponse.json({ run: run || { status: "stopped", total_ideas: 0 }, ideas: ideas || [] });
  } catch (error: any) {
    console.error("[IDEENSCOUT GET]", error);
    return NextResponse.json({ error: error.message, hint: "Bitte /api/ideenscout/setup aufrufen" }, { status: 500 });
  }
}
