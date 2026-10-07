import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Automatisches Marktdaten-Scraping mit Config-Steuerung
// Läuft alle 6 Stunden: Holt echte Daten von HN, GitHub, Heise, etc.
export async function GET() {
  try {
    // Config laden oder Default erstellen
    let config = await prisma.autoScoutConfig.findFirst();
    if (!config) {
      config = await prisma.autoScoutConfig.create({
        data: { enabled: true, intervalHours: 6 },
      });
    }

    if (!config.enabled) {
      return NextResponse.json({ success: true, status: "disabled", message: "Auto-Scout ist deaktiviert" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
    const protocol = baseUrl.includes("localhost") ? "http" : "https";
    const fullUrl = baseUrl.startsWith("http") ? baseUrl : `${protocol}://${baseUrl}`;

    if (!fullUrl) {
      return NextResponse.json({ success: false, error: "Keine APP_URL konfiguriert" }, { status: 500 });
    }

    // Trigger den echten Scraper
    const scrapeRes = await fetch(`${fullUrl}/api/ideenscout/scrape-real`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxIdeas: 15 }),
    }).catch((e) => {
      console.error("[AUTO-SCOUT] Scrape fetch failed:", e);
      return null;
    });

    let scrapeResult: any = { ideasGenerated: 0 };
    if (scrapeRes?.ok) {
      scrapeResult = await scrapeRes.json();
    }

    // Automation Log
    await prisma.automationLog.create({
      data: {
        automationId: config.id,
        name: "auto_scout",
        entityType: "scout",
        entityId: config.id,
        action: "scout_run",
        status: scrapeRes?.ok ? "success" : "failed",
        details: { source: "cron", ideasGenerated: scrapeResult.ideasGenerated || 0 },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      status: "running",
      ideasGenerated: scrapeResult.ideasGenerated || 0,
      sources: scrapeResult.sources || {},
      config: { intervalHours: config.intervalHours, sources: config.sources },
    });
  } catch (error: any) {
    console.error("[AUTO-SCOUT]", error);
    return NextResponse.json({ error: error.message, status: "error" }, { status: 500 });
  }
}
