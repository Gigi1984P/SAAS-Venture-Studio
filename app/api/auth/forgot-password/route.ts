import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: "Email ist erforderlich" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak if email exists
      return NextResponse.json({ message: "Wenn diese E-Mail registriert ist, wurde ein Reset-Link gesendet." });
    }

    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
    // await sendEmail({ to: email, subject: "Passwort zurücksetzen", text: `Klicke hier: ${resetUrl}` });

    return NextResponse.json({ message: "Wenn diese E-Mail registriert ist, wurde ein Reset-Link gesendet." });
  } catch (error) {
    console.error("[FORGOT PASSWORD]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}
