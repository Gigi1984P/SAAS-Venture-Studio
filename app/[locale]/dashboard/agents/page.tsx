import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgentsClientPage from "./agents-client";

// WICHTIG: Als dynamisch markieren, um Hydration-Probleme zu vermeiden
export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const tasks = await prisma.task.findMany({
    include: { agentRuns: { select: { id: true, status: true, agentType: true } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  return <AgentsClientPage tasks={tasks} />;
}
