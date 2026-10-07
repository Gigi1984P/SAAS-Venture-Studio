import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Benachrichtigungen für neue Ideen, High-Scores, Auto-Convert-Vorschläge
export async function GET() {
  try {
    // Letzte 30 Tage Logs
    const logs = await prisma.automationLog.findMany({
      where: {
        triggeredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        action: { in: ["scout_run", "auto_convert", "auto_scored"] },
      },
      orderBy: { triggeredAt: "desc" },
      take: 20,
    });

    // Ungelesene Alerts (simuliert via Log)
    const alerts = logs
      .filter((l: any) => l.status !== "skipped")
      .map((l: any) => ({
        id: l.id,
        type: l.action,
        title: l.action === "scout_run" ? "Neue Ideen gefunden" :
               l.action === "auto_convert" ? "Opportunity konvertiert" :
               "Auto-Score aktualisiert",
        message: l.details?.message || l.name || "",
        status: l.status,
        createdAt: l.triggeredAt,
      }));

    // Neue High-Pain-Ideen der letzten 24h
    const recentHighPain = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM business_ideas
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND (potential = 'high' OR pain_score >= 7)
    `;

    return NextResponse.json({
      alerts,
      unreadCount: alerts.filter((a: any) => a.status === "success").length,
      recentHighPain: (recentHighPain as any[])?.[0]?.count || 0,
    });
  } catch (error: any) {
    console.error("[NOTIFICATIONS]", error);
    return NextResponse.json({ alerts: [], unreadCount: 0, recentHighPain: 0 });
  }
}
