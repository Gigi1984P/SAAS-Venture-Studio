import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const results = [];

    // 1. intelligence_source_configs
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS intelligence_source_configs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'scraper',
        base_url TEXT NOT NULL,
        search_url TEXT,
        api_key TEXT,
        api_endpoint TEXT,
        selector_title TEXT,
        selector_content TEXT,
        selector_author TEXT,
        selector_date TEXT,
        rate_limit_rpm INTEGER DEFAULT 10,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 5,
        last_scraped_at TIMESTAMP(3),
        total_scrapes INTEGER DEFAULT 0,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("intelligence_source_configs ✅");

    // 2. intelligence_reports
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS intelligence_reports (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        opportunity_id TEXT,
        source_id TEXT NOT NULL,
        source_slug TEXT NOT NULL,
        source_name TEXT NOT NULL,
        query TEXT,
        url TEXT,
        title TEXT,
        content TEXT,
        sentiment TEXT DEFAULT 'neutral',
        relevance_score REAL,
        raw_data JSONB,
        fetched_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      )
    `;
    results.push("intelligence_reports ✅");

    // 3. autonomous_agents
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS autonomous_agents (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT,
        agent_type TEXT NOT NULL,
        schedule TEXT DEFAULT '0 */6 * * *',
        interval_minutes INTEGER,
        is_active BOOLEAN DEFAULT false,
        config JSONB,
        last_run_at TIMESTAMP(3),
        next_run_at TIMESTAMP(3),
        total_runs INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        fail_count INTEGER DEFAULT 0,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("autonomous_agents ✅");

    // 4. pipeline_events
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS pipeline_events (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        venture_id TEXT NOT NULL,
        opportunity_id TEXT,
        event_type TEXT NOT NULL,
        from_stage TEXT,
        to_stage TEXT,
        score_a INTEGER,
        score_b INTEGER,
        metadata JSONB,
        actor_id TEXT,
        actor_type TEXT DEFAULT 'user',
        notes TEXT,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venture_id) REFERENCES ventures(id) ON DELETE CASCADE,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
      )
    `;
    results.push("pipeline_events ✅");

    // 5. competitor_features
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS competitor_features (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        competitor_id TEXT NOT NULL,
        feature_name TEXT NOT NULL,
        category TEXT DEFAULT 'core',
        has_feature BOOLEAN DEFAULT false,
        quality_score INTEGER,
        price_included BOOLEAN DEFAULT true,
        notes TEXT,
        source_url TEXT,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("competitor_features ✅");

    // 6. competitor_pricing_tiers
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS competitor_pricing_tiers (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        competitor_id TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        price_eur REAL,
        billing_period TEXT DEFAULT 'monthly',
        features TEXT[],
        limitations TEXT[],
        source_url TEXT,
        observed_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("competitor_pricing_tiers ✅");

    // 7. portfolio_metrics
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS portfolio_metrics (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        metric_type TEXT NOT NULL,
        value REAL DEFAULT 0,
        change_percent REAL,
        period TEXT DEFAULT 'daily',
        calculated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `;
    results.push("portfolio_metrics ✅");

    // 8. portfolio_snapshots
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        total_ideas INTEGER DEFAULT 0,
        total_opportunities INTEGER DEFAULT 0,
        total_ventures INTEGER DEFAULT 0,
        avg_score_a REAL DEFAULT 0,
        avg_score_b REAL DEFAULT 0,
        pipeline_value REAL DEFAULT 0,
        active_experiments INTEGER DEFAULT 0,
        avg_confidence REAL DEFAULT 0,
        calculated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;
    results.push("portfolio_snapshots ✅");

    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_reports_opportunity ON intelligence_reports(opportunity_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_reports_slug ON intelligence_reports(source_slug)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_events_venture ON pipeline_events(venture_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_events_opp ON pipeline_events(opportunity_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_events_type ON pipeline_events(event_type)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_metrics_type ON portfolio_metrics(metric_type)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_snapshot_at ON portfolio_snapshots(calculated_at)`;
    results.push("Indexes ✅");

    return NextResponse.json({ success: true, tables: results });
  } catch (error: any) {
    console.error("[DB MIGRATE V2]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
