import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const notes = await prisma.ventureNote.findMany({
      where: { ventureId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notes);
  } catch (err) {
    console.error("Error fetching notes:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const note = await prisma.ventureNote.create({
      data: {
        ventureId: params.id,
        title: body.title,
        content: body.content,
        category: body.category || "general",
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("Error creating note:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
