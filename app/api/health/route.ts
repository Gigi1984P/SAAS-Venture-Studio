import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health
// Öffentlicher Health Check — zeigt DB-Status, ENV-Status, Version
export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  const start = Date.now();

  // 1. Database Check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: "error", error: String(error) };
  }

  // 2. NextAuth Secret Check (nur ob vorhanden, nicht den Wert)
  checks.nextauth = {
    status: process.env.NEXTAUTH_SECRET ? "ok" : "missing",
  };

  // 3. Database URL Check (nur ob vorhanden, nicht den Wert)
  checks.databaseUrl = {
    status: process.env.DATABASE_URL ? "ok" : "missing",
  };

  // 4. Resend API Key Check
  checks.resend = {
    status: process.env.RESEND_API_KEY ? "ok" : "missing",
  };

  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const totalLatency = Date.now() - start;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "error",
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev-v2",
      environment: process.env.VERCEL_ENV || "development",
      nodeEnv: process.env.NODE_ENV || "unknown",
      totalLatencyMs: totalLatency,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
