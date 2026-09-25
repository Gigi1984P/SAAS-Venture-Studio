import { SidebarNav } from "@/components/sidebar-nav";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar nur wenn eingeloggt */}
      {session?.user ? (
        <SidebarNav roleName={(session.user as any)?.role || undefined} />
      ) : null}
      <main className={`flex-1 ${session?.user ? 'lg:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
}
