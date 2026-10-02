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

    // Prüfe ob Venture schon existiert (duplikat-verhinderung)
    const existing = await queryRaw(
      `SELECT id FROM ventures WHERE name = $1 LIMIT 1`,
      idea.title
    );
    
    if ((existing as any[])?.length > 0) {
      return NextResponse.json({ error: "Venture mit diesem Namen existiert bereits" }, { status: 409 });
    }

    // Venture erstellen
    const ventures = await queryRaw(
      `INSERT INTO ventures (name, description, category, status, revenue_model, target_audience, created_at)
       VALUES ($1, $2, $3, 'ideation', $4, $5, NOW())
       RETURNING *`,
      idea.title,
      idea.description,
      idea.category || "SaaS",
      idea.revenue_model || "SaaS-Abonnement",
      idea.target_audience || "Solopreneure"
    );

    const venture = (ventures as any[])?.[0];
    
    // Idee als konvertiert markieren
    await queryRaw(
      `UPDATE business_ideas SET is_saved = true, converted_to_venture_id = $1 WHERE id = $2`,
      venture.id,
      ideaId
    );

    return NextResponse.json({ 
      success: true, 
      message: "Idee zu Venture konvertiert",
      venture: {
        id: venture.id,
        name: venture.name,
        status: venture.status,
      }
    });

  } catch (error: any) {
    console.error("[IDEENSCOUT CONVERT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
