import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Liefert die letzten 30 Snapshots für Trend-Charts
export async function GET() {
  try {
    const snapshots = await prisma.dashboardSnapshot.findMany({
      orderBy: { date: "asc" },
      take: 30,
    });

    return NextResponse.json({ 
      snapshots,
      count: snapshots.length 
    });
  } catch (error: any) {
    console.error("[TRENDS]", error);
    return NextResponse.json({ snapshots: [], count: 0, error: error.message }, { status: 500 });
  }
}
