import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/portfolio — Aggregate Stats über alle Ventures
export async function GET() {
  try {
    const [
      ventures,
      totalVentures,
      venturesByStatus,
      totalMrr,
      totalBurn,
      avgRunway,
      recentEvents,
    ] = await Promise.all([
      // Alle Ventures mit Kennzahlen
      prisma.venture.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          mrr: true,
          mau: true,
          churnRate: true,
          cac: true,
          teamSize: true,
          burnRate: true,
          runway: true,
          createdAt: true,
        },
        orderBy: { mrr: "desc" },
      }),
      // Gesamtanzahl
      prisma.venture.count(),
      // Nach Status gruppiert
      prisma.venture.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { mrr: true },
      }),
      // Gesamt MRR
      prisma.venture.aggregate({ _sum: { mrr: true } }),
      // Gesamt Burn
      prisma.venture.aggregate({ _sum: { burnRate: true } }),
      // Durchschn. Runway
      prisma.venture.aggregate({ _avg: { runway: true } }),
      // Letzte 20 Events
      prisma.ventureEvent.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          venture: { select: { name: true, slug: true } },
        },
      }),
    ]);

    // Serialize für Client (Date → ISO String)
    const serializedVentures = ventures.map(v => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    }));

    const serializedEvents = recentEvents.map(e => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ventures: serializedVentures,
      totalVentures,
      venturesByStatus: venturesByStatus.map(s => ({
        status: s.status,
        count: s._count.id,
        totalMrr: s._sum.mrr || 0,
      })),
      totalMrr: totalMrr._sum.mrr || 0,
      totalBurn: totalBurn._sum.burnRate || 0,
      avgRunway: Math.round((avgRunway._avg.runway || 0) * 10) / 10,
      recentEvents: serializedEvents,
    });
  } catch (error) {
    console.error("[PORTFOLIO GET]", error);
    return NextResponse.json(
      { ventures: [], totalVentures: 0, venturesByStatus: [], totalMrr: 0, totalBurn: 0, avgRunway: 0, recentEvents: [] },
      { status: 500 }
    );
  }
}
