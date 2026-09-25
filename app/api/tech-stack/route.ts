import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const stacks = await prisma.techStack.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(stacks);
  } catch (err) {
    console.error("Error fetching tech stacks:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const stack = await prisma.techStack.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        category: body.category || "frontend",
        description: body.description || "",
        officialUrl: body.officialUrl || null,
        docsUrl: body.docsUrl || null,
        version: body.version || null,
        whyUseIt: body.whyUseIt || null,
        pros: body.pros || null,
        cons: body.cons || null,
        setupCommand: body.setupCommand || null,
        configExample: body.configExample || null,
      },
    });
    return NextResponse.json(stack, { status: 201 });
  } catch (err) {
    console.error("Error creating tech stack:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
