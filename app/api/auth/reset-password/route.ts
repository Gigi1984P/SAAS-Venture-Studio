import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/auth/reset-password
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ message: "Token und Passwort sind erforderlich" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Passwort muss mindestens 8 Zeichen lang sein" }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ message: "Token ist ungültig oder abgelaufen" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({ message: "Passwort erfolgreich zurückgesetzt" });
  } catch (error) {
    console.error("[RESET PASSWORD]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
