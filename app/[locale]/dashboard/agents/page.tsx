import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgentsClientPage from "./agents-client";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const tasks = await prisma.task.findMany({
    include: { agentRuns: { select: { id: true, status: true, agentType: true } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  // Serialize Date objects for client
  const serializedTasks = tasks.map(t => ({
    ...t,
    createdAt: t.createdAt?.toISOString(),
    startedAt: t.startedAt?.toISOString() || null,
    completedAt: t.completedAt?.toISOString() || null,
    updatedAt: t.updatedAt?.toISOString(),
  }));

  return <AgentsClientPage tasks={serializedTasks} />;
}
