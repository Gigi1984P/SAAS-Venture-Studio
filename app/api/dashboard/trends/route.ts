import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Liefert die letzten 30 Snapshots für Trend-Charts
export async function GET() {
  try {
    const snapshots = await prisma.dashboardSnapshot.findMany({
      orderBy: { date: "desc" },
      take: 30,
    });

    return NextResponse.json({ snapshots: snapshots.reverse() });
  } catch (error: any) {
    console.error("[TRENDS]", error);
    return NextResponse.json({ snapshots: [] }, { status: 500 });
  }
}
