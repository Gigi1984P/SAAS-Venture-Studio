import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Auth Check Helper
 */
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert. Bitte einloggen." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  try {
    const ideas = await prisma.idea.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(ideas);
  } catch (error: any) {
    console.error("[IDEAS GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // AUTH CHECK
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { title, description, problem, solution, tags } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
    }

    // XSS Sanitization
    const cleanTitle = title.replace(/<\/?[^>]+>/g, "");
    const cleanDesc = (description || "").replace(/<\/?[^>]+>/g, "");

    // Duplicate Check
    const existing = await prisma.idea.findFirst({
      where: { title: { equals: cleanTitle, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json({ error: "Idee existiert bereits" }, { status: 409 });
    }

    const idea = await prisma.idea.create({
      data: {
        title: cleanTitle,
        description: cleanDesc,
        problem: problem || null,
        solution: solution || null,
        tags: tags || [],
        status: "draft",
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error: any) {
    console.error("[IDEAS POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
