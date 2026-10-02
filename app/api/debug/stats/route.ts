import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let totalScoutIdeas = 0;
    let activeScoutRuns = 0;
    let errors: string[] = [];

    // Scout-Ideen zaehlen
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM business_ideas`);
      const rows = result as any[];
      totalScoutIdeas = Number(rows?.[0]?.count || 0);
    } catch (e: any) {
      errors.push("business_ideas: " + e.message);
    }

    // Scout Runs zaehlen
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM scout_runs WHERE status = 'running'`);
      const rows = result as any[];
      activeScoutRuns = Number(rows?.[0]?.count || 0);
    } catch (e: any) {
      errors.push("scout_runs: " + e.message);
    }

    return NextResponse.json({
      totalScoutIdeas,
      activeScoutRuns,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
