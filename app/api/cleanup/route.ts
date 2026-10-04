import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.$executeRaw`TRUNCATE TABLE business_ideas CASCADE`;
    return NextResponse.json({ success: true, message: "business_ideas geleert" });
  } catch (error: any) {
    console.error("[CLEANUP]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
