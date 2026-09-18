import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });
    }

    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ message: "Name und E-Mail sind erforderlich" }, { status: 400 });
    }

    // Prüfen, ob E-Mail bereits vergeben (von anderem User)
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ message: "E-Mail ist bereits vergeben" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
      select: { id: true, name: true, email: true, updatedAt: true },
    });

    return NextResponse.json({ message: "Profil aktualisiert", user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
