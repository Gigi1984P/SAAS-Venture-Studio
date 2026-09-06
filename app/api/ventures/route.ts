import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

// GET /api/ventures - Liste der Ventures des eingeloggten Users
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const ventures = await prisma.venture.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(ventures);
  } catch (error) {
    console.error("Ventures GET error:", error);
    return NextResponse.json({ message: "Interner Serverfehler" }, { status: 500 });
  }
}

// POST /api/ventures - Neues Venture erstellen
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, status, website, github, mrr } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Name ist erforderlich" }, { status: 400 });
    }

    // Slug generieren
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      return NextResponse.json({ message: "Ungültiger Name für Slug" }, { status: 400 });
    }

    const venture = await prisma.venture.create({
      data: {
        name: name.trim(),
        slug,
        description: description || null,
        status: status || "idea",
        website: website || null,
        github: github || null,
        mrr: mrr || 0,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(venture, { status: 201 });
  } catch (error) {
    console.error("Ventures POST error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ message: "Ein Venture mit diesem Slug existiert bereits" }, { status: 409 });
    }
    return NextResponse.json({ message: "Interner Serverfehler" }, { status: 500 });
  }
}
