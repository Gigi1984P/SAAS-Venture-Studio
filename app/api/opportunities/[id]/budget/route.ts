import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/budget
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const budgets = await prisma.researchBudget.findMany({
      where: { opportunityId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("[BUDGET GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/budget
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();

    const budget = await prisma.researchBudget.create({
      data: {
        opportunityId: params.id,
        phase: body.phase,
        maxRuntime: body.maxRuntime,
        maxAgentRuns: body.maxAgentRuns,
        minimumEvidence: body.minimumEvidence,
        budgetEur: body.budgetEur,
      },
    });

    return NextResponse.json({ message: "Budget erstellt", budget }, { status: 201 });
  } catch (error) {
    console.error("[BUDGET POST]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// PATCH /api/opportunities/[id]/budget/[budgetId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();
    const { budgetId, ...data } = body;

    if (!budgetId) {
      return NextResponse.json({ message: "budgetId fehlt" }, { status: 400 });
    }

    const budget = await prisma.researchBudget.update({
      where: { id: budgetId, opportunityId: params.id },
      data,
    });

    return NextResponse.json({ message: "Budget aktualisiert", budget });
  } catch (error) {
    console.error("[BUDGET PATCH]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
