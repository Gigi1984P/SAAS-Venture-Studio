import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let totalScoutIdeas = 0;
    let activeScoutRuns = 0;
    let tables = [];
    let rawBusinessCount = null;
    let rawRunsCount = null;

    // Zuerst: Welche Tabellen existieren?
    try {
      const tableResult = await prisma.$queryRawUnsafe(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      tables = (tableResult as any[]).map((r) => r.table_name);
    } catch (e: any) {
      tables = ["ERROR: " + e.message];
    }

    // Dann: Scout-Ideen zählen
    if (tables.includes("business_ideas")) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM business_ideas`);
        rawBusinessCount = result;
        const rows = result as any[];
        if (rows && rows.length > 0) {
          totalScoutIdeas = Number(rows[0].count || 0);
        }
      } catch (e: any) {
        rawBusinessCount = "ERROR: " + e.message;
      }
    }

    // Dann: Scout Runs zählen
    if (tables.includes("scout_runs")) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM scout_runs WHERE status = 'running'`);
        rawRunsCount = result;
        const rows = result as any[];
        if (rows && rows.length > 0) {
          activeScoutRuns = Number(rows[0].count || 0);
        }
      } catch (e: any) {
        rawRunsCount = "ERROR: " + e.message;
      }
    }

    return NextResponse.json({
      totalScoutIdeas,
      activeScoutRuns,
      tables,
      rawBusinessCount,
      rawRunsCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
