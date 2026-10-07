import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: Quelle aktualisieren (z.B. enabled toggeln)
export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const { id, enabled, maxResults, painBoost, sortOrder, name, url } = data;
    
    await prisma.$executeRaw`
      UPDATE scout_sources SET 
        enabled = COALESCE(${enabled ?? null}, enabled),
        max_results = COALESCE(${maxResults ?? null}, max_results),
        pain_boost = COALESCE(${painBoost ?? null}, pain_boost),
        sort_order = COALESCE(${sortOrder ?? null}, sort_order),
        name = COALESCE(${name ?? null}, name),
        url = COALESCE(${url ?? null}, url),
        updated_at = NOW()
      WHERE id = ${id};
    `;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Quelle löschen
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.$executeRaw`DELETE FROM scout_sources WHERE id = ${id};`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
