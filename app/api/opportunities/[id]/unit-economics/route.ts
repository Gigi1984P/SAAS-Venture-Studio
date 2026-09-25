import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const models = await prisma.unitEconomicsModel.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    return NextResponse.json(models[0] || null);
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
    const model = await prisma.unitEconomicsModel.create({
      data: {
        opportunityId: params.id,
        cac: body.cac || 0,
        ltv: body.ltv || 0,
        monthlyChurn: body.monthlyChurn || 0.05,
        arpu: body.arpu || 0,
        grossMargin: body.grossMargin || 0.7,
        paybackMonths: body.paybackMonths || 0,
      },
    });
    return NextResponse.json(model, { status: 201 });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
