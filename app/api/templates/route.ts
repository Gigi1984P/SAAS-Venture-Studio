import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const templates = await prisma.ventureTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (err) {
    console.error("Error fetching templates:", err);
    return NextResponse.json({ error: "Fehler beim Laden der Templates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const template = await prisma.ventureTemplate.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: body.description || "",
        category: body.category || "saas",
        tags: body.tags || "",
        repositoryUrl: body.repositoryUrl || null,
        demoUrl: body.demoUrl || null,
        readmeContent: body.readmeContent || null,
        setupSteps: body.setupSteps || null,
        envVariables: body.envVariables || null,
        features: body.features || null,
        techStackIds: body.techStackIds || null,
      },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("Error creating template:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen des Templates" }, { status: 500 });
  }
}
