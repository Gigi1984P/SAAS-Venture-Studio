import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const stack = await prisma.techStack.findUnique({
      where: { id: params.id },
    });
    if (!stack) return NextResponse.json({ error: "Tech Stack nicht gefunden" }, { status: 404 });
    return NextResponse.json(stack);
  } catch (err) {
    console.error("Error fetching tech stack:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const stack = await prisma.techStack.update({
      where: { id: params.id },
      data: {
        name: body.name,
        category: body.category,
        description: body.description,
        officialUrl: body.officialUrl,
        docsUrl: body.docsUrl,
        version: body.version,
        whyUseIt: body.whyUseIt,
        pros: body.pros,
        cons: body.cons,
        setupCommand: body.setupCommand,
        configExample: body.configExample,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(stack);
  } catch (err) {
    console.error("Error updating tech stack:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    await prisma.techStack.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting tech stack:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
