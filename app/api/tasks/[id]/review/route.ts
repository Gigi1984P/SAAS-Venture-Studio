import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const { status, notes } = body;
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true },
    });

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        status,
        reviewNotes: notes || null,
        reviewedBy: user?.id || null,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json(task);
  } catch (err) {
    console.error("Error reviewing task:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
