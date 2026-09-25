import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const modules = await prisma.sharedModule.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: { _count: { select: { ventureModules: true } } },
    });
    return NextResponse.json(modules);
  } catch (err) {
    console.error("Error fetching shared modules:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const module_ = await prisma.sharedModule.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        category: body.category || "auth",
        description: body.description || "",
        codeSnippet: body.codeSnippet || null,
        dependencies: body.dependencies || null,
        setupGuide: body.setupGuide || null,
        testCoverage: body.testCoverage || null,
      },
    });
    return NextResponse.json(module_, { status: 201 });
  } catch (err) {
    console.error("Error creating shared module:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
