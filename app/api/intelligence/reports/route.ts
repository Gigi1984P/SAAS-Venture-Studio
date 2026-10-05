import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("opportunityId");
    const sourceSlug = searchParams.get("sourceSlug");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where: any = {};
    if (opportunityId) where.opportunityId = opportunityId;
    if (sourceSlug) where.sourceSlug = sourceSlug;

    const [reports, total] = await Promise.all([
      prisma.intelligenceReport.findMany({ where, orderBy: { fetchedAt: "desc" }, take: limit, skip }),
      prisma.intelligenceReport.count({ where }),
    ]);

    return NextResponse.json({ reports, total });
  } catch (error: any) {
    console.error("[INTELLIGENCE REPORTS GET]", error);
    return NextResponse.json({ error: "Fehler beim Laden der Reports" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const report = await prisma.intelligenceReport.create({ data });
    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    console.error("[INTELLIGENCE REPORTS POST]", error);
    return NextResponse.json({ error: "Fehler beim Erstellen des Reports" }, { status: 500 });
  }
}
