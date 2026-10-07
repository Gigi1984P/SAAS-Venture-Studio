import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Migration v6: ScoutSource Tabelle + Seed-Daten
export async function POST() {
  try {
    // Tabelle erstellen (falls nicht vorhanden)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS scout_sources (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        url TEXT,
        category TEXT NOT NULL DEFAULT 'tech',
        enabled BOOLEAN NOT NULL DEFAULT true,
        max_results INT NOT NULL DEFAULT 20,
        pain_boost INT NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Seed-Daten: alle 21 Quellen
    const sources = [
      { name: "HackerNews", slug: "hackernews", url: "https://hn.algolia.com", category: "tech", enabled: true, maxResults: 20, painBoost: 0, sortOrder: 1 },
      { name: "GitHub Issues", slug: "github", url: "https://api.github.com", category: "tech", enabled: true, maxResults: 10, painBoost: 2, sortOrder: 2 },
      { name: "Stack Overflow", slug: "stackoverflow", url: "https://api.stackexchange.com", category: "tech", enabled: true, maxResults: 15, painBoost: 2, sortOrder: 3 },
      { name: "Indie Hackers", slug: "indiehackers", url: "https://www.indiehackers.com/api", category: "tech", enabled: true, maxResults: 15, painBoost: 0, sortOrder: 4 },
      { name: "Product Hunt", slug: "producthunt", url: "https://www.producthunt.com/feed", category: "tech", enabled: true, maxResults: 10, painBoost: 0, sortOrder: 5 },
      { name: "DEV.to", slug: "devto", url: "https://dev.to/api/articles", category: "tech", enabled: true, maxResults: 10, painBoost: 0, sortOrder: 6 },
      { name: "Medium", slug: "medium", url: "https://medium.com/feed/tag", category: "tech", enabled: true, maxResults: 8, painBoost: 0, sortOrder: 7 },
      { name: "Heise", slug: "heise", url: "https://www.heise.de/rss/heise-Rubrik-IT.rdf", category: "dach", enabled: true, maxResults: 15, painBoost: 0, sortOrder: 8 },
      { name: "Golem", slug: "golem", url: "https://rss.golem.de/rss.php?feed=ATOM1.0", category: "dach", enabled: true, maxResults: 10, painBoost: 0, sortOrder: 9 },
      { name: "Deutsche Startups", slug: "deutsche-startups", url: "https://www.deutsche-startups.de/feed/", category: "dach", enabled: true, maxResults: 10, painBoost: 0, sortOrder: 10 },
      { name: "t3n", slug: "t3n", url: "https://t3n.de/rss.xml", category: "dach", enabled: true, maxResults: 10, painBoost: 0, sortOrder: 11 },
      { name: "Gründerszene", slug: "gruenderszene", url: "https://www.gruenderszene.de/feed", category: "dach", enabled: true, maxResults: 10, painBoost: 0, sortOrder: 12 },
      { name: "G2 Reviews", slug: "g2", url: "https://www.g2.com", category: "reviews", enabled: false, maxResults: 5, painBoost: 1, sortOrder: 13 },
      { name: "Trustpilot", slug: "trustpilot", url: "https://www.trustpilot.com", category: "reviews", enabled: false, maxResults: 5, painBoost: 1, sortOrder: 14 },
      { name: "X / Twitter", slug: "x-twitter", url: "https://nitter.net", category: "social", enabled: false, maxResults: 5, painBoost: 0, sortOrder: 15 },
      { name: "Quora", slug: "quora", url: "https://www.quora.com", category: "social", enabled: false, maxResults: 5, painBoost: 0, sortOrder: 16 },
      { name: "Reddit", slug: "reddit", url: "https://www.reddit.com", category: "social", enabled: false, maxResults: 15, painBoost: 2, sortOrder: 17 },
      { name: "RSS Handwerk & Bau", slug: "rss-handwerk-bau", url: "config/rss-feeds.json", category: "rss-handwerk", enabled: true, maxResults: 39, painBoost: 0, sortOrder: 18 },
      { name: "RSS Immobilien", slug: "rss-immobilien", url: "config/rss-feeds.json", category: "rss-immobilien", enabled: true, maxResults: 19, painBoost: 0, sortOrder: 19 },
      { name: "RSS Logistik", slug: "rss-logistik", url: "config/rss-feeds.json", category: "rss-logistik", enabled: true, maxResults: 20, painBoost: 0, sortOrder: 20 },
      { name: "RSS Buchhaltung", slug: "rss-buchhaltung", url: "config/rss-feeds.json", category: "rss-buchhaltung", enabled: true, maxResults: 21, painBoost: 0, sortOrder: 21 },
    ];

    let created = 0;
    let updated = 0;
    for (const src of sources) {
      const existing = await prisma.$queryRaw`SELECT id FROM scout_sources WHERE slug = ${src.slug}`;
      if (existing && Array.isArray(existing) && existing.length > 0) {
        await prisma.$executeRaw`
          UPDATE scout_sources SET 
            name = ${src.name}, url = ${src.url}, category = ${src.category},
            enabled = ${src.enabled}, max_results = ${src.maxResults},
            pain_boost = ${src.painBoost}, sort_order = ${src.sortOrder},
            updated_at = NOW()
          WHERE slug = ${src.slug};
        `;
        updated++;
      } else {
        await prisma.$executeRaw`
          INSERT INTO scout_sources (id, name, slug, url, category, enabled, max_results, pain_boost, sort_order, created_at, updated_at)
          VALUES (gen_random_uuid(), ${src.name}, ${src.slug}, ${src.url}, ${src.category}, ${src.enabled}, ${src.maxResults}, ${src.painBoost}, ${src.sortOrder}, NOW(), NOW());
        `;
        created++;
      }
    }

    return NextResponse.json({ success: true, created, updated, total: sources.length });
  } catch (error: any) {
    console.error("[MIGRATION V6]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
