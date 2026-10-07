import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CRUD API für ScoutSource (Ideen Scout Quellen-Verwaltung) - Raw SQL

// GET: Alle Quellen
export async function GET() {
  try {
    const sources = await prisma.$queryRaw`
      SELECT id, name, slug, url, category, enabled, max_results as "maxResults", pain_boost as "painBoost", sort_order as "sortOrder", created_at as "createdAt", updated_at as "updatedAt"
      FROM scout_sources ORDER BY sort_order ASC;
    `;
    return NextResponse.json({ sources: sources || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, sources: [] }, { status: 500 });
  }
}

// POST: Neue Quelle erstellen
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await prisma.$queryRaw`
      INSERT INTO scout_sources (id, name, slug, url, category, enabled, max_results, pain_boost, sort_order, created_at, updated_at)
      VALUES (gen_random_uuid(), ${data.name}, ${data.slug}, ${data.url || null}, ${data.category || 'tech'}, ${data.enabled ?? true}, ${data.maxResults || 20}, ${data.painBoost || 0}, ${data.sortOrder || 0}, NOW(), NOW())
      RETURNING id;
    `;
    return NextResponse.json({ success: true, id: Array.isArray(result) ? result[0]?.id : null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
