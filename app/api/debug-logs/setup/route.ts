import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS debug_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        type TEXT NOT NULL,
        msg TEXT NOT NULL,
        detail TEXT,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_debug_logs_created_at ON debug_logs(created_at);
    `;
    return NextResponse.json({ success: true, message: "Tabelle debug_logs erstellt" });
  } catch (error: any) {
    console.error("[DEBUG SETUP]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
