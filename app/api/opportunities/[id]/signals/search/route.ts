import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    
    // Return existing signals that match query
    const signals = await prisma.signal.findMany({
      where: {
        opportunityId: params.id,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { confidence: "desc" },
      take: 20,
    });
    return NextResponse.json({ signals });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
