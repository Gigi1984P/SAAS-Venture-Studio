import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const solutions = await prisma.solution.findMany({
    where: { opportunityId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(solutions);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const data = await req.json();
  const solution = await prisma.solution.create({
    data: { ...data, opportunityId: id },
  });
  return NextResponse.json(solution, { status: 201 });
}
