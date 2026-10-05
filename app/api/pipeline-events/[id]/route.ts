import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const event = await prisma.pipelineEvent.findUnique({
      where: { id: params.id },
      include: { venture: { select: { name: true } }, opportunity: { select: { title: true } } },
    });
    if (!event) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(event);
  } catch (error: any) {
    console.error("[PIPELINE EVENT GET]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.pipelineEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[PIPELINE EVENT DELETE]", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
