import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/verify-email?token=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ message: "Token fehlt" }, { status: 400 });
    }

    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification || verification.expires < new Date()) {
      return NextResponse.json({ message: "Token ist ungültig oder abgelaufen" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: verification.email },
      data: { emailVerified: new Date() },
    });

    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    return NextResponse.json({ message: "E-Mail erfolgreich bestätigt" });
  } catch (error) {
    console.error("[VERIFY EMAIL]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
