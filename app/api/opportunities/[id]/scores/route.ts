import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const scores = await prisma.score.findMany({
    where: { opportunityId: id },
    orderBy: { calculatedAt: "desc" },
  });
  return NextResponse.json(scores);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const data = await req.json();
  const score = await prisma.score.create({
    data: { ...data, opportunityId: id },
  });
  return NextResponse.json(score, { status: 201 });
}
