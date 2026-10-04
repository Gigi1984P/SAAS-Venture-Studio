import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sql = body.sql;
    
    if (!sql) {
      return NextResponse.json({ error: "SQL required" }, { status: 400 });
    }
    
    // Only allow SELECT and safe operations
    const lower = sql.toLowerCase().trim();
    if (!lower.startsWith('select') && !lower.startsWith('insert') && !lower.startsWith('update') && !lower.startsWith('delete') && !lower.startsWith('alter') && !lower.startsWith('create') && !lower.startsWith('truncate')) {
      return NextResponse.json({ error: "Only SELECT/INSERT/UPDATE/DELETE/ALTER/CREATE/TRUNCATE allowed" }, { status: 400 });
    }
    
    const result = await prisma.$queryRawUnsafe(sql);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("[SQL EXEC]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
