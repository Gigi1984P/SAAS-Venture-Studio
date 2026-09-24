import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// GET /api/db-test
// Testet verschiedene Passwörter aus der History
export async function GET() {
  const passwords = [
    "d7(B5Rpq6)fd",
    "n7%T;4Xt?oq#",
    "z6?THNMpq6E,",
  ];

  const results = [];

  for (const pwd of passwords) {
    const encodedPwd = encodeURIComponent(pwd);
    const url = `postgresql://saas_venture_studio_user:${encodedPwd}@187.124.0.184:32843/saas_venture_studio_db`;
    
    try {
      const testPrisma = new PrismaClient({
        datasources: {
          db: { url },
        },
      });
      
      await testPrisma.$queryRaw`SELECT 1`;
      await testPrisma.$disconnect();
      
      results.push({
        password: pwd.substring(0, 5) + "...",
        status: "success",
      });
    } catch (error: any) {
      results.push({
        password: pwd.substring(0, 5) + "...",
        status: "error",
        error: error.message?.substring(0, 100) || String(error).substring(0, 100),
      });
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
  });
}
