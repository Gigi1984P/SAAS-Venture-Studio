import { NextResponse } from "next/server";

// GET /api/debug-env
// Zeigt alle ENV-Variablen (ohne Secrets) für Debugging
export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || "not-set",
    VERCEL_ENV: process.env.VERCEL_ENV || "not-set",
    VERCEL_REGION: process.env.VERCEL_REGION || "not-set",
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
    DATABASE_URL_START: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "not-set",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not-set",
    NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0,
    RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM || "not-set",
    PORT: process.env.PORT || "not-set",
    HOSTNAME: process.env.HOSTNAME || "not-set",
  };

  return NextResponse.json({
    status: "debug",
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || "development",
    variables: envVars,
  });
}
