import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function queryRaw(sql: string, ...values: any[]) {
  return await prisma.$queryRawUnsafe(sql, ...values);
}

// Idee als gespeichert markieren oder Bewertung aktualisieren
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ideaId, isSaved, rating, notes } = body;

    if (!ideaId) {
      return NextResponse.json({ error: "ideaId erforderlich" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (isSaved !== undefined) {
      updates.push(`is_saved = $${paramIndex++}`);
      values.push(isSaved);
    }
    if (rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      values.push(rating);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Keine Felder zum Aktualisieren" }, { status: 400 });
    }

    values.push(ideaId);
    await queryRaw(
      `UPDATE business_ideas SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      ...values
    );

    return NextResponse.json({ success: true, message: "Idee aktualisiert" });
  } catch (error: any) {
    console.error("[IDEENSCOUT PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Idee zu Venture konvertieren
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ideaId } = body;

    if (!ideaId) {
      return NextResponse.json({ error: "ideaId erforderlich" }, { status: 400 });
    }

    // Idee laden
    const ideas = await queryRaw(`SELECT * FROM business_ideas WHERE id = $1`, ideaId);
    const idea = (ideas as any[])?.[0];
    
    if (!idea) {
      return NextResponse.json({ error: "Idee nicht gefunden" }, { status: 404 });
    }

    // Ersten User finden (solo-operated)
    const users = await queryRaw(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`);
    const ownerId = (users as any[])?.[0]?.id;
    
    if (!ownerId) {
      return NextResponse.json({ error: "Kein User gefunden. Bitte registriere dich zuerst." }, { status: 400 });
    }

    // Slug generieren
    const baseSlug = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

    // Prüfe ob Venture schon existiert
    const existing = await queryRaw(
      `SELECT id FROM ventures WHERE slug = $1 LIMIT 1`,
      slug
    );
    
    if ((existing as any[])?.length > 0) {
      return NextResponse.json({ error: "Venture mit diesem Slug existiert bereits" }, { status: 409 });
    }

    // Venture erstellen
    let ventures;
    try {
      ventures = await queryRaw(
        `INSERT INTO ventures (id, name, slug, description, status, owner_id, created_at, updated_at)
         VALUES (gen_random_uuid()::TEXT, $1, $2, $3, 'ideation', $4, NOW(), NOW())
         RETURNING *`,
        idea.title,
        slug,
        idea.description,
        ownerId
      );
    } catch (dbError: any) {
      console.error("[VENTURE INSERT]", dbError);
      return NextResponse.json({ 
        error: `DB Fehler: ${dbError.message}`, 
        hint: "Prüfe ob ventures Tabelle die richtigen Spalten hat (owner_id, slug)" 
      }, { status: 500 });
    }

    if (!ventures || (ventures as any[]).length === 0) {
      return NextResponse.json({ error: "Venture konnte nicht erstellt werden" }, { status: 500 });
    }

    const venture = (ventures as any[])?.[0];
    
    // Idee als gespeichert markieren
    await queryRaw(
      `UPDATE business_ideas SET is_saved = true WHERE id = $1`,
      ideaId
    );

    return NextResponse.json({ 
      success: true, 
      message: "Idee zu Venture konvertiert",
      venture: {
        id: venture.id,
        name: venture.name,
        slug: venture.slug,
        status: venture.status,
      }
    });

  } catch (error: any) {
    console.error("[IDEENSCOUT CONVERT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
