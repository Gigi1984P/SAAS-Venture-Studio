import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  
  // Get agent config
  const config = await prisma.agentConfig.findUnique({
    where: { id: body.configId },
  });

  if (!config) {
    return NextResponse.json({ error: "Config not found" }, { status: 404 });
  }

  // Create task (simuliert einen Agent Run)
  const task = await prisma.task.create({
    data: {
      type: "agent_run",
      status: "running",
      entityId: body.configId,
      entityType: "agent_config",
      agent: config.name,
    },
  });

  // Simulate agent run
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 800));
  const runtimeSeconds = Math.round((Date.now() - startTime) / 1000);
  const tokensUsed = Math.floor(Math.random() * 2000) + 500;

  // Create agent run record
  const agentRun = await prisma.agentRun.create({
    data: {
      taskId: task.id,
      agentType: config.name,
      status: "completed",
      input: body.input || "Test input",
      output: JSON.stringify({
        result: `Ergebnis von ${config.label} (${config.model}).`,
        summary: `Dies ist ein simulierter Agent Run.`,
      }),
      tokensUsed,
      runtimeSeconds,
      cost: tokensUsed * (config.costPer1kTokens || 0.002) / 1000,
      completedAt: new Date(),
    },
  });

  // Update task
  await prisma.task.update({
    where: { id: task.id },
    data: { status: "completed", completedAt: new Date() },
  });

  return NextResponse.json({ message: "Agent run completed", agentRun });
}
