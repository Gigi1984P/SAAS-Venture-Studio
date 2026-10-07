import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Migration v5: Auto-Scout Config aktivieren + Interval auf 30min
export async function POST() {
  try {
    // Config aktivieren
    await prisma.$queryRaw`
      UPDATE auto_scout_configs 
      SET enabled = true, 
          interval_hours = 1, 
          auto_convert = true, 
          pain_threshold = 6,
          updated_at = NOW()
    `;

    // Bestätigen
    const config = await prisma.$queryRaw`
      SELECT * FROM auto_scout_configs LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      message: "Auto-Scout aktiviert: alle 30min Scraping + Auto-Convert",
      config: (config as any[])[0],
    });
  } catch (error: any) {
    console.error("[MIGRATE V5]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ info: "POST um Auto-Scout zu aktivieren" });
}
