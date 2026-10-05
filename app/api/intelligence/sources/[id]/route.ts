import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const source = await prisma.intelligenceSourceConfig.findUnique({ where: { id: params.id } });
    if (!source) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(source);
  } catch (error: any) {
    console.error("[INTELLIGENCE SOURCE GET]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const source = await prisma.intelligenceSourceConfig.update({ where: { id: params.id }, data });
    return NextResponse.json(source);
  } catch (error: any) {
    console.error("[INTELLIGENCE SOURCE PUT]", error);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.intelligenceSourceConfig.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[INTELLIGENCE SOURCE DELETE]", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
