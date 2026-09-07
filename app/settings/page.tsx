import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: {
          role: true,
          organization: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const member = user.memberships[0];

  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: member?.role?.label || "—",
        organization: member?.organization?.name || "—",
      }}
    />
  );
}
