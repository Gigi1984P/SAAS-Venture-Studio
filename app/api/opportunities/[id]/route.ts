import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[OPP PUT]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
