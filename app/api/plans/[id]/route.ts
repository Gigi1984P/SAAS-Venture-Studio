import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[PLAN PUT]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.plan.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Geloescht" });
  } catch (error) {
    console.error("[PLAN DELETE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
