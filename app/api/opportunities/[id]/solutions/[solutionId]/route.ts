import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string; solutionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { solutionId } = params;
  const data = await req.json();
  const solution = await prisma.solution.update({
    where: { id: solutionId },
    data,
  });
  return NextResponse.json(solution);
}

export async function DELETE(req: Request, { params }: { params: { id: string; solutionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.solution.delete({ where: { id: params.solutionId } });
  return NextResponse.json({ success: true });
}
