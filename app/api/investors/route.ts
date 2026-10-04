import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const relationship = searchParams.get("relationship");

  const where: any = { isActive: true };
  if (type) where.type = type;
  if (relationship) where.relationship = relationship;

  const investors = await prisma.investor.findMany({
    where,
    orderBy: { relationship: "desc" },
    include: {
      rounds: {
        include: {
          venture: { select: { id: true, name: true } },
        },
      },
    },
    take: 100,
  });

  return NextResponse.json(investors);
  } catch (error) {
    console.error("[INVESTORS GET]", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const investor = await prisma.investor.create({
    data: {
      name: body.name,
      type: body.type,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      website: body.website,
      ticketSizeMin: body.ticketSizeMin ? parseFloat(body.ticketSizeMin) : null,
      ticketSizeMax: body.ticketSizeMax ? parseFloat(body.ticketSizeMax) : null,
      focusAreas: body.focusAreas || [],
      stagePreference: body.stagePreference || [],
      geoPreference: body.geoPreference || [],
      relationship: body.relationship || "cold",
      notes: body.notes,
    },
  });

  return NextResponse.json(investor);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const investor = await prisma.investor.update({
    where: { id: body.id },
    data: {
      name: body.name,
      type: body.type,
      relationship: body.relationship,
      notes: body.notes,
      isActive: body.isActive,
    },
  });

  return NextResponse.json(investor);
}
