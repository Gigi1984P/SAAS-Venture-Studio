import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/research-sources/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });

    const body = await req.json();

    const source = await prisma.researchSource.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Source aktualisiert", source });
  } catch (error) {
    console.error("[RESEARCH SOURCE PATCH]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// DELETE /api/research-sources/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });

    await prisma.researchSource.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Source gelöscht" });
  } catch (error) {
    console.error("[RESEARCH SOURCE DELETE]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
