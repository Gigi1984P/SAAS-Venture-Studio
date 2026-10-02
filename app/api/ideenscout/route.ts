import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

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
        `INSERT INTO scout_runs (agent_id, status, prompt) VALUES ($1, 'stopped', 'Finde innovative SaaS-Geschäftsideen für Solopreneure und kleine Teams.') RETURNING *`,
        agentId
      );
      runs = await queryRaw(
        `SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
        agentId
      );
      run = (runs as any[])?.[0];
    }

    // Letzte 20 Ideen mit ALLE Spalten
    const ideas = await queryRaw(
      `SELECT 
        id, scout_run_id, title, description, category, target_audience, revenue_model,
        mvp_effort, potential, competition, differentiation, is_saved, created_at,
        signal_source, signal_quote, pain_level, pain_quote, workaround, persona,
        job_to_be_done, icp, market_size, buyer_persona, wedge,
        score_desirability, score_viability, score_feasibility, score_overall,
        bear_case, confidence, experiment_status, experiment_notes
       FROM business_ideas 
       WHERE scout_run_id = $1 
       ORDER BY created_at DESC LIMIT 20`,
      run?.id
    );

    return NextResponse.json({ run: run || { status: "stopped", total_ideas: 0 }, ideas: ideas || [] });
  } catch (error: any) {
    console.error("[IDEENSCOUT GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
