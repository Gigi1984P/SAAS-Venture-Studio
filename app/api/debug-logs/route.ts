import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const logs = await prisma.debugLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.debugLog.count();

    return NextResponse.json({ logs, total });
  } catch (error: any) {
    console.error("[DEBUG LOGS GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, msg, detail } = body;

    if (!type || !msg) {
      return NextResponse.json({ error: "type und msg erforderlich" }, { status: 400 });
    }

    const log = await prisma.debugLog.create({
      data: { type, msg, detail: detail || null },
    });

    return NextResponse.json(log);
  } catch (error: any) {
    console.error("[DEBUG LOGS POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
