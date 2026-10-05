import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sources = await prisma.intelligenceSourceConfig.findMany({ orderBy: { priority: "asc" } });
    return NextResponse.json(sources);
  } catch (error: any) {
    console.error("[INTELLIGENCE SOURCES GET]", error);
    return NextResponse.json({ error: "Fehler beim Laden der Sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const source = await prisma.intelligenceSourceConfig.create({ data });
    return NextResponse.json(source, { status: 201 });
  } catch (error: any) {
    console.error("[INTELLIGENCE SOURCES POST]", error);
    return NextResponse.json({ error: "Fehler beim Erstellen der Source" }, { status: 500 });
  }
}
