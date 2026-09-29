import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const opportunityId = searchParams.get("opportunityId");
  const ventureId = searchParams.get("ventureId");

  const where: any = {};
  if (opportunityId) where.opportunityId = opportunityId;
  if (ventureId) where.ventureId = ventureId;

  const events = await prisma.timelineEvent.findMany({
    where,
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const event = await prisma.timelineEvent.create({
    data: {
      opportunityId: body.opportunityId,
      ventureId: body.ventureId,
      title: body.title,
      description: body.description,
      eventType: body.eventType,
      status: body.status || "planned",
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      color: body.color,
    },
  });

  return NextResponse.json(event);
}
