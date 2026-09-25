import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const comps = await prisma.scoreComponent.findMany({
      where: { opportunityId: params.id },
    });
    return NextResponse.json(comps);
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const comp = await prisma.scoreComponent.create({
      data: {
        opportunityId: params.id,
        category: body.category,
        name: body.name,
        value: body.value,
        weight: body.weight || 1,
      },
    });
    return NextResponse.json(comp, { status: 201 });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
