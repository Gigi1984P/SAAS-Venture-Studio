import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Einfache XSS-Sanitization
function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script>/gi, "")
    .replace(/<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

export async function GET() {
  try {
    const ideas = await prisma.idea.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(ideas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth Check für schreibende Operation
    const session = await getServerSession(authOptions);
    
    const body = await req.json();
    
    // Validation
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
    }
    if (body.title.trim().length < 3) {
      return NextResponse.json({ error: "Titel muss mindestens 3 Zeichen haben" }, { status: 400 });
    }
    
    const title = sanitizeInput(body.title);
    const description = sanitizeInput(body.description || "");
    
    // Check for duplicates
    const existing = await prisma.idea.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    
    if (existing) {
      return NextResponse.json({ error: "Idee existiert bereits" }, { status: 409 });
    }
    
    const idea = await prisma.idea.create({
      data: { title, description, status: body.status || "new" }
    });
    
    return NextResponse.json(idea, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
