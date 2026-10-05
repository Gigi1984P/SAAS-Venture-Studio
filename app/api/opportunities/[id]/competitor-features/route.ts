import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const competitorId = req.nextUrl.searchParams.get("competitorId");
    const where: any = {};
    if (competitorId) where.competitorId = competitorId;

    const features = await prisma.competitorFeature.findMany({
      where,
      orderBy: { featureName: "asc" },
    });
    return NextResponse.json(features);
  } catch (error: any) {
    console.error("[COMPETITOR FEATURES GET]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const feature = await prisma.competitorFeature.create({ data });
    return NextResponse.json(feature, { status: 201 });
  } catch (error: any) {
    console.error("[COMPETITOR FEATURES POST]", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
