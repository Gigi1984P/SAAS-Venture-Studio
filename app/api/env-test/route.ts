import { NextResponse } from "next/server";

// GET /api/env-test
// Einfacher Test: zeigt alle ENV-Variablen ohne Secrets
export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || "not-set",
    VERCEL_ENV: process.env.VERCEL_ENV || "not-set",
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
    DATABASE_URL_START: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) : "not-set",
    NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not-set",
    RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM || "not-set",
  };

  return NextResponse.json({
    status: "debug",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || "development",
    variables: envVars,
  });
}
