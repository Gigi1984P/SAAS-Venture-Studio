import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "E-Mail und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    // Prüfen ob User existiert
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "E-Mail ist bereits registriert" },
        { status: 409 }
      );
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    // User erstellen
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(
      { message: "Registrierung erfolgreich", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
