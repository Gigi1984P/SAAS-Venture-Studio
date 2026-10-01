import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { status: string; message: string; time?: number }> = {};
  let overall = "healthy";

  // 1. DB Check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "ok",
      message: "PostgreSQL verbunden",
      time: Date.now() - start,
    };
  } catch (e: any) {
    checks.database = { status: "error", message: e.message };
    overall = "unhealthy";
  }

  // 2. ENV Check
  const requiredEnv = ["DATABASE_URL", "NEXTAUTH_SECRET"];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length === 0) {
    checks.environment = { status: "ok", message: "Alle ENV Variablen gesetzt" };
  } else {
    checks.environment = { status: "error", message: `Fehlend: ${missing.join(", ")}` };
    overall = "unhealthy";
  }

  // 3. Memory Check
  const mem = process.memoryUsage();
  checks.memory = {
    status: "ok",
    message: `Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
  };

  // 4. Agent Count
  try {
    const agentCount = await prisma.agentConfig.count();
    checks.agents = { status: "ok", message: `${agentCount} Agenten konfiguriert` };
  } catch (e: any) {
    checks.agents = { status: "error", message: e.message };
  }

  // 5. Uptime
  checks.uptime = {
    status: "ok",
    message: `${Math.round(process.uptime() / 60)} Minuten`,
  };

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "2.0.0",
      checks,
    },
    { status: overall === "healthy" ? 200 : 503 }
  );
}
