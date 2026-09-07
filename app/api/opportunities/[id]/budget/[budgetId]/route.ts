import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/opportunities/[id]/budget/[budgetId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; budgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();

    const budget = await prisma.researchBudget.update({
      where: { id: params.budgetId, opportunityId: params.id },
      data: body,
    });

    return NextResponse.json({ message: "Budget aktualisiert", budget });
  } catch (error) {
    console.error("[BUDGET PATCH]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// DELETE /api/opportunities/[id]/budget/[budgetId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; budgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    await prisma.researchBudget.delete({
      where: { id: params.budgetId, opportunityId: params.id },
    });

    return NextResponse.json({ message: "Budget gelöscht" });
  } catch (error) {
    console.error("[BUDGET DELETE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
