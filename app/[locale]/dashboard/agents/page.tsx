import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMessages } from "next-intl/server";
import { defaultLocale } from "@/i18n/config";
import AgentsClientPage from "./agents-client";

export default async function AgentsPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const locale = params.locale || defaultLocale;

  // Lade Übersetzungen auf dem Server
  const messages = await getMessages({ locale });
  const agentsMessages = (messages.Agents || {}) as Record<string, string>;

  // Lade Tasks von der DB
  const tasks = await prisma.task.findMany({
    include: { agentRuns: { select: { id: true, status: true, agentType: true } } },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  return <AgentsClientPage tasks={tasks} translations={agentsMessages} />;
}
