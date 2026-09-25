import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const template = await prisma.ventureTemplate.findUnique({
      where: { id: params.id },
    });
    if (!template) return NextResponse.json({ error: "Template nicht gefunden" }, { status: 404 });
    return NextResponse.json(template);
  } catch (err) {
    console.error("Error fetching template:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const template = await prisma.ventureTemplate.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        tags: body.tags,
        repositoryUrl: body.repositoryUrl,
        demoUrl: body.demoUrl,
        readmeContent: body.readmeContent,
        setupSteps: body.setupSteps,
        envVariables: body.envVariables,
        features: body.features,
        techStackIds: body.techStackIds,
      },
    });
    return NextResponse.json(template);
  } catch (err) {
    console.error("Error updating template:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    await prisma.ventureTemplate.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting template:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
