import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const module_ = await prisma.sharedModule.findUnique({
      where: { id: params.id },
      include: { ventureModules: true },
    });
    if (!module_) return NextResponse.json({ error: "Modul nicht gefunden" }, { status: 404 });
    return NextResponse.json(module_);
  } catch (err) {
    console.error("Error fetching shared module:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const module_ = await prisma.sharedModule.update({
      where: { id: params.id },
      data: {
        name: body.name,
        category: body.category,
        description: body.description,
        codeSnippet: body.codeSnippet,
        dependencies: body.dependencies,
        setupGuide: body.setupGuide,
        testCoverage: body.testCoverage,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(module_);
  } catch (err) {
    console.error("Error updating shared module:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    await prisma.sharedModule.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting shared module:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
