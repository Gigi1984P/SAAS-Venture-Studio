import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(prefs || { darkMode: "system", sidebarCollapsed: false, locale: "de-DE" });
  } catch (error) {
    console.error("User preferences GET error:", error);
    return NextResponse.json({ darkMode: "system", sidebarCollapsed: false, locale: "de-DE" }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const prefs = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        darkMode: body.darkMode,
        sidebarCollapsed: body.sidebarCollapsed ?? false,
        locale: body.locale,
      },
      update: {
        darkMode: body.darkMode,
        sidebarCollapsed: body.sidebarCollapsed,
        locale: body.locale,
      },
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("User preferences POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
