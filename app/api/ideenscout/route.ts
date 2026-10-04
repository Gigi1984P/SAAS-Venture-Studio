import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId") || "ideen-scout";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    // Filters
    const filterSaved = searchParams.get("saved") === "true";
    const filterCategory = searchParams.get("category");
    const filterPotential = searchParams.get("potential");
    const filterAnalyzed = searchParams.get("analyzed");
    const filterSearch = searchParams.get("q");

    // ScoutRun finden oder erstellen
    let runs = await queryRaw(
      `SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
      agentId
    );

    let run = (runs as any[])?.[0];
    if (!run) {
      await queryRaw(
        `INSERT INTO scout_runs (agent_id, status) VALUES ($1, 'stopped')`,
        agentId
      );
      runs = await queryRaw(
        `SELECT * FROM scout_runs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 1`,
        agentId
      );
      run = (runs as any[])?.[0];
    }

    // Build WHERE clause
    const whereParts: string[] = [`scout_run_id IS NOT NULL`];
    const whereValues: any[] = [];
    let paramIdx = 1;

    if (filterSaved) {
      whereParts.push(`is_saved = true`);
    }
    if (filterCategory) {
      whereParts.push(`category ILIKE $${paramIdx++}`);
      whereValues.push(`%${filterCategory}%`);
    }
    if (filterPotential) {
      whereParts.push(`potential = $${paramIdx++}`);
      whereValues.push(filterPotential);
    }
    if (filterAnalyzed === "true") {
      whereParts.push(`score_overall IS NOT NULL`);
    } else if (filterAnalyzed === "false") {
      whereParts.push(`score_overall IS NULL`);
    }
    if (filterSearch) {
      whereParts.push(`(title ILIKE $${paramIdx++} OR description ILIKE $${paramIdx++})`);
      whereValues.push(`%${filterSearch}%`, `%${filterSearch}%`);
    }

    const whereClause = whereParts.join(" AND ");

    // Total count for pagination
    const countResult = await queryRaw(
      `SELECT COUNT(*) as count FROM business_ideas WHERE ${whereClause}`,
      ...whereValues
    );
    const totalCount = Number((countResult as any[])?.[0]?.count) || 0;

    // Fetch paginated ideas
    const ideas = await queryRaw(
      `SELECT * FROM business_ideas WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      ...whereValues,
      limit,
      offset
    );

    // Get available categories for filter dropdown
    const categories = await queryRaw(
      `SELECT DISTINCT category FROM business_ideas WHERE scout_run_id IS NOT NULL AND category IS NOT NULL ORDER BY category`
    );

    return NextResponse.json({
      run: run || { status: "running", total_ideas: totalCount, agent_id: "multi-source-scraper" },
      ideas: ideas || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      filters: {
        categories: ((categories as any[]) || []).map((c: any) => c.category).filter(Boolean),
      },
    });
  } catch (error: any) {
    console.error("[IDEENSCOUT GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
