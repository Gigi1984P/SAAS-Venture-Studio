import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.debugLog.deleteMany({});
    return NextResponse.json({ success: true, deleted: "all" });
  } catch (error: any) {
    console.error("[DEBUG LOGS CLEAR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
