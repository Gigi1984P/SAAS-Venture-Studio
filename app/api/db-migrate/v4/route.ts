import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Migration v4: Dashboard Snapshot + AutoScout Config Tabellen
export async function POST() {
  try {
    // DashboardSnapshot Tabelle
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS dashboard_snapshots (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        total_ideas INTEGER DEFAULT 0,
        total_opportunities INTEGER DEFAULT 0,
        total_ventures INTEGER DEFAULT 0,
        avg_score_a INTEGER DEFAULT 0,
        avg_score_b INTEGER DEFAULT 0,
        total_mrr INTEGER DEFAULT 0,
        high_pain_ideas INTEGER DEFAULT 0,
        new_signals INTEGER DEFAULT 0,
        conversion_rate REAL DEFAULT 0
      )
    `;

    // Index auf date
    await prisma.$queryRaw`
      CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots_date ON dashboard_snapshots(date)
    `;

    // AutoScoutConfig Tabelle
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS auto_scout_configs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        enabled BOOLEAN DEFAULT false,
        interval_hours INTEGER DEFAULT 6,
        sources TEXT[],
        auto_convert BOOLEAN DEFAULT false,
        pain_threshold INTEGER DEFAULT 7,
        min_upvotes INTEGER DEFAULT 10,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Default Config einfügen
    await prisma.$queryRaw`
      INSERT INTO auto_scout_configs (id, enabled, interval_hours, sources, auto_convert, pain_threshold, min_upvotes, created_at, updated_at)
      SELECT gen_random_uuid()::text, true, 6, ARRAY['hackernews','github','stackoverflow','heise','deutsche-startups','golem'], false, 7, 10, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM auto_scout_configs LIMIT 1)
    `;

    return NextResponse.json({
      success: true,
      message: "Migration v4 abgeschlossen: dashboard_snapshots + auto_scout_configs erstellt",
      tables: ["dashboard_snapshots", "auto_scout_configs"],
    });
  } catch (error: any) {
    console.error("[MIGRATE V4]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: "POST um Migration v4 auszuführen (Dashboard Snapshot + AutoScout Config)",
    tables: ["dashboard_snapshots", "auto_scout_configs"],
  });
}
