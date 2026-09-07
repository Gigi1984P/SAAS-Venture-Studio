import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health
// Health Check Endpoint für CI/CD Pipeline
export async function GET() {
  try {
    // Prüfe DB-Verbindung
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
      environment: process.env.VERCEL_ENV || "development",
      checks: {
        database: "ok",
      },
    });
  } catch (error) {
    console.error("[HEALTH CHECK]", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: String(error),
      },
      { status: 503 }
    );
  }
}
