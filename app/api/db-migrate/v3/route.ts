import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const results = [];

    // Neue Spalten für BusinessIdea (echte Scraping-Daten)
    
    // Prüfen ob Spalte existiert
    const cols = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_ideas' AND column_name = 'source'
    `;
    
    if ((cols as any[]).length === 0) {
      await prisma.$executeRaw`ALTER TABLE business_ideas ADD COLUMN source TEXT DEFAULT 'ideenscout'`;
      await prisma.$executeRaw`ALTER TABLE business_ideas ADD COLUMN source_url TEXT`;
      await prisma.$executeRaw`ALTER TABLE business_ideas ADD COLUMN pain_score INTEGER`;
      await prisma.$executeRaw`ALTER TABLE business_ideas ADD COLUMN pain_keywords TEXT`;
      results.push("business_ideas: source, source_url, pain_score, pain_keywords hinzugefügt ✅");
    } else {
      results.push("business_ideas: Spalten bereits vorhanden ✅");
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("[DB MIGRATE V3]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ info: "POST um neue Spalten hinzuzufügen" });
}
