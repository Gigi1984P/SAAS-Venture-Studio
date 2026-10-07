import { prisma } from "@/lib/prisma";

// Temporärer Seed-Endpunkt für historische Dashboard Snapshots
export async function POST() {
  const snapshots = [
    { date: new Date("2026-09-07T03:00:00Z"), totalIdeas: 5, totalOpportunities: 1, totalVentures: 1, avgScoreA: 45, avgScoreB: 20, totalMRR: 0, highPainIdeas: 4, newSignals: 2, conversionRate: 20 },
    { date: new Date("2026-09-14T03:00:00Z"), totalIdeas: 12, totalOpportunities: 2, totalVentures: 1, avgScoreA: 52, avgScoreB: 28, totalMRR: 0, highPainIdeas: 10, newSignals: 4, conversionRate: 17 },
    { date: new Date("2026-09-21T03:00:00Z"), totalIdeas: 22, totalOpportunities: 3, totalVentures: 1, avgScoreA: 55, avgScoreB: 35, totalMRR: 0, highPainIdeas: 18, newSignals: 5, conversionRate: 14 },
    { date: new Date("2026-09-28T03:00:00Z"), totalIdeas: 35, totalOpportunities: 5, totalVentures: 1, avgScoreA: 58, avgScoreB: 40, totalMRR: 0, highPainIdeas: 30, newSignals: 6, conversionRate: 14 },
    { date: new Date("2026-10-05T03:00:00Z"), totalIdeas: 48, totalOpportunities: 8, totalVentures: 1, avgScoreA: 52, avgScoreB: 38, totalMRR: 0, highPainIdeas: 42, newSignals: 7, conversionRate: 17 },
  ];

  const created = [];
  for (const s of snapshots) {
    try {
      const existing = await prisma.dashboardSnapshot.findFirst({
        where: { date: s.date },
      });
      if (!existing) {
        const snap = await prisma.dashboardSnapshot.create({ data: s });
        created.push(snap);
      }
    } catch (e: any) {
      console.error("Snapshot seed error:", e.message);
    }
  }

  return Response.json({ success: true, created: created.length, total: snapshots.length });
}
