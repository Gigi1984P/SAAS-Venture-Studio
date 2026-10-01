import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, service, message } = body;

    const alert = await prisma.activityLog.create({
      data: {
        action: "SYSTEM_ALERT",
        entityType: service || "system",
        entityId: level || "error",
        entityName: message?.slice(0, 200),
        userId: "system",
      },
    });

    console.error(`🚨 ALERT [${level}] ${service}: ${message}`);

    return NextResponse.json({ id: alert.id, status: "logged" });
  } catch (error) {
    console.error("[ALERT LOGGING FAILED]", error);
    return NextResponse.json({ error: "Logging failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const alerts = await prisma.activityLog.findMany({
      where: { action: "SYSTEM_ALERT" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(alerts);
  } catch {
    return NextResponse.json([]);
  }
}
