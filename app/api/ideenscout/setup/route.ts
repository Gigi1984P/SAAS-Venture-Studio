import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Erstelle die Tabellen via raw SQL
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      agent_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'stopped',
      last_run_at TIMESTAMP(3),
      total_ideas INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      prompt TEXT NOT NULL DEFAULT 'Finde innovative SaaS-Geschäftsideen für Solopreneure und kleine Teams.',
      interval_sec INTEGER NOT NULL DEFAULT 300,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON agent_runs(agent_id)`;

    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS business_ideas (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      agent_run_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      target_audience TEXT,
      revenue_model TEXT,
      mvp_effort TEXT,
      potential TEXT,
      is_saved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_business_ideas_agent_run_id ON business_ideas(agent_run_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_business_ideas_is_saved ON business_ideas(is_saved)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_business_ideas_created_at ON business_ideas(created_at)`;

    return NextResponse.json({ success: true, message: "Tabellen agent_runs und business_ideas erstellt" });
  } catch (error: any) {
    console.error("[IDEENSCOUT SETUP]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
