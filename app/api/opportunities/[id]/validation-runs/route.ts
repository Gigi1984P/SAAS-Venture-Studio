import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const run = await prisma.validationRun.create({
      data: {
        opportunityId: params.id,
        sprintName: body.sprintName || `Sprint ${new Date().toISOString().slice(0, 10)}`,
        timeBoxDays: body.timeBoxDays || 21,
        maxBudgetEur: body.maxBudgetEur || 8000,
        status: "INTAKE",
      },
    });
    return NextResponse.json(run, { status: 201 });
  } catch (err) {
    console.error("Error creating validation run:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const runs = await prisma.validationRun.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(runs);
  } catch (err) {
    console.error("Error fetching validation runs:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
