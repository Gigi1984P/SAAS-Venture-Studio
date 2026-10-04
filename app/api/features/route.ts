import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/features
export async function GET() {
  try {
    const features = await prisma.feature.findMany({ orderBy: { category: "asc", name: "asc" } });
    return NextResponse.json(features);
  } catch (error) {
    console.error("[FEATURES GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/features
export async function POST(req: NextRequest) {
  try {
    const { slug, name, category, icon, description } = await req.json();
    const feature = await prisma.feature.create({
      data: { slug, name, category, icon: icon || null, description: description || null },
    });
    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error("[FEATURES POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
