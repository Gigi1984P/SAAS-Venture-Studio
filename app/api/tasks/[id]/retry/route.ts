import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const task = await prisma.task.update({
      where: { id: params.id },
      data: { status: "queued", attempts: { increment: 1 }, error: null },
    });
    return NextResponse.json(task);
  } catch (err) {
    console.error("Error retrying task:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
