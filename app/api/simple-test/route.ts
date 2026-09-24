import { NextResponse } from "next/server";

// GET /api/simple-test
// Einfacher Test ohne Prisma
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "not-set";
  
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dbUrlSet: dbUrl !== "not-set",
    dbUrlLength: dbUrl.length,
    dbUrlPreview: dbUrl.substring(0, 50),
    env: process.env.VERCEL_ENV || "local",
    nodeEnv: process.env.NODE_ENV || "unknown",
  });
}
