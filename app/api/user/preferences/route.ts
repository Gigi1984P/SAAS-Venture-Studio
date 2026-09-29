import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PREFS = { darkMode: "system", sidebarCollapsed: false, locale: "de-DE" };

export async function GET() {
  try {
    // Solo-Betrieb: Keine Auth-Prüfung nötig
    // Erste Preference zurückgeben oder Default
    const prefs = await prisma.userPreference.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(prefs || DEFAULT_PREFS);
  } catch (error) {
    console.error("User preferences GET error:", error);
    return NextResponse.json(DEFAULT_PREFS);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Upsert: Erste Preference aktualisieren oder neue erstellen
    const existing = await prisma.userPreference.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const prefs = await prisma.userPreference.update({
        where: { id: existing.id },
        data: {
          darkMode: body.darkMode ?? existing.darkMode,
          sidebarCollapsed: body.sidebarCollapsed ?? existing.sidebarCollapsed,
          locale: body.locale ?? existing.locale,
        },
      });
      return NextResponse.json(prefs);
    }

    const prefs = await prisma.userPreference.create({
      data: {
        userId: "solo-user",
        darkMode: body.darkMode ?? "system",
        sidebarCollapsed: body.sidebarCollapsed ?? false,
        locale: body.locale ?? "de-DE",
      },
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("User preferences POST error:", error);
    return NextResponse.json(DEFAULT_PREFS);
  }
}
