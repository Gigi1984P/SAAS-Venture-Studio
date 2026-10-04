import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ventureId = searchParams.get("ventureId");

  const where: any = {};
  if (ventureId) where.ventureId = ventureId;

  const rounds = await prisma.investmentRound.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      investor: { select: { id: true, name: true, type: true } },
      venture: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(rounds);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const round = await prisma.investmentRound.create({
    data: {
      ventureId: body.ventureId,
      investorId: body.investorId || null,
      roundType: body.roundType,
      status: body.status || "targeting",
      targetAmount: parseFloat(body.targetAmount),
      raisedAmount: body.raisedAmount ? parseFloat(body.raisedAmount) : 0,
      valuationPre: body.valuationPre ? parseFloat(body.valuationPre) : null,
      valuationPost: body.valuationPost ? parseFloat(body.valuationPost) : null,
      notes: body.notes,
    },
  });

  return NextResponse.json(round);
}
