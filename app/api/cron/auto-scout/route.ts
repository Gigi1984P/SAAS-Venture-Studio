import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Automatisches Marktdaten-Scraping mit Config-Steuerung (Raw SQL weil Schema nicht gepusht)
export async function GET() {
  try {
    // Config via Raw SQL laden oder Default
    const configResult = await prisma.$queryRaw`
      SELECT * FROM auto_scout_configs LIMIT 1
    `;
    const configs = configResult as any[];
    let config = configs[0];

    if (!config) {
      await prisma.$queryRaw`
        INSERT INTO auto_scout_configs (id, enabled, interval_hours, sources, auto_convert, pain_threshold, min_upvotes, created_at, updated_at)
        VALUES (gen_random_uuid()::text, true, 6, '{hackernews,github,stackoverflow,heise,deutsche-startups,golem}', false, 7, 10, NOW(), NOW())
      `;
      config = { enabled: true, interval_hours: 6 };
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

    // Automation Log (existierendes Modell)
    await prisma.automationLog.create({
      data: {
        automationId: config.id || "auto-scout",
        name: "auto_scout",
        entityType: "scout",
        entityId: config.id || "default",
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
      config: { intervalHours: config.interval_hours || 6, sources: config.sources || [] },
    });
  } catch (error: any) {
    console.error("[AUTO-SCOUT]", error);
    return NextResponse.json({ error: error.message, status: "error" }, { status: 500 });
  }
}
