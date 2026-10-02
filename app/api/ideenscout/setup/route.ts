import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Prüfe was existiert
    const existingTables = await prisma.$queryRawUnsafe(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
      AND tablename IN ('scout_runs', 'business_ideas')
    `);

    // Drop alte Tabellen falls sie inkompatibel sind
    for (const row of existingTables as any[]) {
      const table = row.tablename;
      if (table === 'scout_runs') {
        // Prüfe ob scout_runs die richtigen Spalten hat
        const cols = await prisma.$queryRawUnsafe(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'scout_runs' AND column_name = 'agent_id'
        `);
        if ((cols as any[]).length === 0) {
          // Alte Tabelle - drop und neu erstellen
          await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS business_ideas CASCADE`);
          await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS scout_runs CASCADE`);
        }
      }
    }

    // Erstelle scout_runs
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS scout_runs (
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
      )
    `);

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_scout_runs_agent_id ON scout_runs(agent_id)`);

    // Erstelle business_ideas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS business_ideas (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        scout_run_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT,
        target_audience TEXT,
        revenue_model TEXT,
        mvp_effort TEXT,
        potential TEXT,
        is_saved BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_business_ideas_scout_run_id ON business_ideas(scout_run_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_business_ideas_is_saved ON business_ideas(is_saved)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_business_ideas_created_at ON business_ideas(created_at)`);

    return NextResponse.json({ success: true, message: "Tabellen bereit" });
  } catch (error: any) {
    console.error("[SCOUT SETUP]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
