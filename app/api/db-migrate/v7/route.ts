import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Migration v7: Neue deutsche B2B RSS-Quellen hinzufügen
export async function POST() {
  try {
    // Neue RSS-Kategorien als ScoutSource Einträge
    const newSources = [
      // Finanzen & Banking
      { name: "RSS Finanzen & Banking", slug: "rss-finanzen", category: "rss-finanzen", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 50 },
      // Versicherungen
      { name: "RSS Versicherungen", slug: "rss-versicherungen", category: "rss-versicherungen", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 51 },
      // Gesundheit & Medizin
      { name: "RSS Gesundheit & Medizin", slug: "rss-gesundheit", category: "rss-gesundheit", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 52 },
      // Recht & Compliance
      { name: "RSS Recht & Compliance", slug: "rss-recht", category: "rss-recht", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 53 },
      // HR & Personal
      { name: "RSS HR & Personal", slug: "rss-hr", category: "rss-hr", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 54 },
      // Marketing & Vertrieb
      { name: "RSS Marketing & Vertrieb", slug: "rss-marketing", category: "rss-marketing", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 55 },
      // Produktion & Industrie
      { name: "RSS Produktion & Industrie", slug: "rss-produktion", category: "rss-produktion", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 56 },
      // Energie & Umwelt
      { name: "RSS Energie & Umwelt", slug: "rss-energie", category: "rss-energie", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 57 },
      // Bildung & Weiterbildung
      { name: "RSS Bildung & Weiterbildung", slug: "rss-bildung", category: "rss-bildung", url: null, enabled: true, maxResults: 15, painBoost: 0, sortOrder: 58 },
    ];

    const results = [];
    for (const source of newSources) {
      try {
        // Prüfe ob slug bereits existiert
        const existing = await prisma.$queryRaw`
          SELECT id FROM scout_sources WHERE slug = ${source.slug} LIMIT 1;
        `;
        if (Array.isArray(existing) && existing.length > 0) {
          results.push({ slug: source.slug, status: "already_exists" });
          continue;
        }

        await prisma.$queryRaw`
          INSERT INTO scout_sources (id, name, slug, url, category, enabled, max_results, pain_boost, sort_order, created_at, updated_at)
          VALUES (gen_random_uuid(), ${source.name}, ${source.slug}, ${source.url}, ${source.category}, ${source.enabled}, ${source.maxResults}, ${source.painBoost}, ${source.sortOrder}, NOW(), NOW());
        `;
        results.push({ slug: source.slug, status: "created" });
      } catch (e: any) {
        results.push({ slug: source.slug, status: "error", error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Neue B2B RSS-Quellen hinzugefügt",
      results,
      totalNew: results.filter((r: any) => r.status === "created").length,
    });
  } catch (error: any) {
    console.error("[MIGRATION V7]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
