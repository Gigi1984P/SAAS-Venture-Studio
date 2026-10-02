import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const needed = [
      // Signal Discovery
      { name: "signal_source", type: "TEXT" },
      { name: "signal_quote", type: "TEXT" },
      { name: "signal_url", type: "TEXT" },
      // Pain Graph
      { name: "pain_level", type: "INTEGER" },
      { name: "pain_quote", type: "TEXT" },
      { name: "workaround", type: "TEXT" },
      { name: "persona", type: "TEXT" },
      { name: "job_to_be_done", type: "TEXT" },
      // Opportunity
      { name: "icp", type: "TEXT" },
      { name: "market_size", type: "TEXT" },
      { name: "buyer_persona", type: "TEXT" },
      { name: "wedge", type: "TEXT" },
      // Scoring
      { name: "score_desirability", type: "INTEGER" },
      { name: "score_viability", type: "INTEGER" },
      { name: "score_feasibility", type: "INTEGER" },
      { name: "score_overall", type: "INTEGER" },
      { name: "bear_case", type: "TEXT" },
      { name: "confidence", type: "TEXT" },
      // Experiment
      { name: "experiment_status", type: "TEXT" },
      { name: "landing_page_url", type: "TEXT" },
      { name: "experiment_notes", type: "TEXT" },
      { name: "converted_to_venture_id", type: "TEXT" },
    ];

    const results = [];
    for (const col of needed) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE business_ideas ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        results.push(col.name);
      } catch (e: any) {
        if (!e.message?.includes("already exists")) {
          console.error(`[MIGRATE] Fehler bei ${col.name}:`, e.message);
        }
      }
    }

    return NextResponse.json({ success: true, added: results, count: results.length });
  } catch (error: any) {
    console.error("[MIGRATE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
