import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.saasMetric.findMany({ where: { opportunityId: params.id }, orderBy: { recordedAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const item = await prisma.saasMetric.create({ data: { ...data, opportunityId: params.id } });
  return NextResponse.json(item, { status: 201 });
}
