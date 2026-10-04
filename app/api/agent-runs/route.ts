import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });

    const runs = await prisma.agentRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("[AGENT RUNS GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
