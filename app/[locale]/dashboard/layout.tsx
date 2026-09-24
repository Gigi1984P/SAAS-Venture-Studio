import { SidebarNav } from "@/components/sidebar-nav";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen">
      <SidebarNav roleName={(session?.user as any)?.role || undefined} />
      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
