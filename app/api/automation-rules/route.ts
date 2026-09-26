import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.automationRule.findMany({
    where: { userId: session.user?.id || "" },
    orderBy: { createdAt: "desc" },
  });

  // Seed default rules if none exist
  if (rules.length === 0) {
    const defaults = [
      { name: "Auto-Score bei Evidence", trigger: "evidence_added", action: "recalculate_score", active: true },
      { name: "Auto-Tasks bei Stage-Wechsel", trigger: "stage_changed", action: "create_task", active: true },
      { name: "Score-Drop Alert", trigger: "score_dropped", action: "send_notification", active: true },
      { name: "Auto-Memo bei Venture", trigger: "venture_converted", action: "generate_memo", active: true },
      { name: "Auto-Red-Team", trigger: "status_changed", action: "generate_review", active: true },
      { name: "Webhook bei Status-Change", trigger: "status_changed", action: "fire_webhook", active: false },
      { name: "Auto-Evidence bei Experiment", trigger: "experiment_completed", action: "create_evidence", active: true },
    ];

    for (const rule of defaults) {
      await prisma.automationRule.create({
        data: { ...rule, userId: session.user?.id || "" },
      });
    }

    const newRules = await prisma.automationRule.findMany({
      where: { userId: session.user?.id || "" },
    });
    return NextResponse.json(newRules);
  }

  return NextResponse.json(rules);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, active } = await req.json();
  const rule = await prisma.automationRule.update({
    where: { id },
    data: { active },
  });

  return NextResponse.json(rule);
}
