import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function VenturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { memberships: { include: { role: true } } },
  });
  const roleName = user?.memberships[0]?.role?.name;

  return (
    <div className="flex min-h-screen">
      <SidebarNav roleName={roleName} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
