import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Neue Spalten hinzufuegen (falls nicht existieren)
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'business_ideas' AND column_name IN ('competition', 'differentiation')
    `);

    const existing = (cols as any[]).map(c => c.column_name);
    
    if (!existing.includes("competition")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE business_ideas ADD COLUMN competition TEXT`);
    }
    if (!existing.includes("differentiation")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE business_ideas ADD COLUMN differentiation TEXT`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Migration abgeschlossen",
      added: ["competition", "differentiation"].filter(c => !existing.includes(c))
    });
  } catch (error: any) {
    console.error("[MIGRATE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
