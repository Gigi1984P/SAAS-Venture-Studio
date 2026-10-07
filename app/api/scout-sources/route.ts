import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Alle Quellen (Raw SQL — Prisma Client kennt ScoutSource nicht)
export async function GET() {
  try {
    const sources = await prisma.$queryRaw`
      SELECT id, name, slug, url, category, enabled, max_results as "maxResults", pain_boost as "painBoost", sort_order as "sortOrder", created_at as "createdAt", updated_at as "updatedAt"
      FROM scout_sources ORDER BY sort_order ASC;
    `;
    return NextResponse.json({ sources: sources || [] });
  } catch (error: any) {
    console.error("[SCOUT SOURCES GET]", error);
    return NextResponse.json({ error: error.message, sources: [] }, { status: 500 });
  }
}

// POST: Neue Quelle erstellen (Raw SQL)
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!data.name || !data.slug) {
      return NextResponse.json({ error: "Name und Slug sind erforderlich" }, { status: 400 });
    }
    
    const result = await prisma.$queryRaw`
      INSERT INTO scout_sources (id, name, slug, url, category, enabled, max_results, pain_boost, sort_order, created_at, updated_at)
      VALUES (gen_random_uuid(), ${data.name}, ${data.slug}, ${data.url || null}, ${data.category || 'tech'}, ${data.enabled ?? true}, ${data.maxResults || 20}, ${data.painBoost || 0}, ${data.sortOrder || 0}, NOW(), NOW())
      RETURNING id, name, slug, url, category, enabled, max_results as "maxResults", pain_boost as "painBoost", sort_order as "sortOrder";
    `;
    
    const newSource = Array.isArray(result) ? result[0] : null;
    return NextResponse.json({ success: true, source: newSource });
  } catch (error: any) {
    console.error("[SCOUT SOURCES POST]", error);
    // Prüfe auf Unique-Constraint-Verletzung
    if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Slug bereits vergeben" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
