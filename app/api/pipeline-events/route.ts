import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ventureId = searchParams.get("ventureId");
    const opportunityId = searchParams.get("opportunityId");
    const eventType = searchParams.get("eventType");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (ventureId) where.ventureId = ventureId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (eventType) where.eventType = eventType;

    const events = await prisma.pipelineEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { venture: { select: { name: true } }, opportunity: { select: { title: true } } },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("[PIPELINE EVENTS GET]", error);
    return NextResponse.json({ error: "Fehler beim Laden der Events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const event = await prisma.pipelineEvent.create({ data });
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("[PIPELINE EVENTS POST]", error);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
