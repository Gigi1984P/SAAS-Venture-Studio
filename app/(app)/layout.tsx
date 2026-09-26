import { SidebarNav } from "@/components/sidebar-nav";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ClientProviders from "@/components/client-providers";
import Header from "@/components/header";

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
      <div className={`flex-1 flex flex-col ${session?.user ? 'lg:ml-64' : ''}`}>
        {session?.user && <Header />}
        <ClientProviders>
          <main className="flex-1 p-4">
            {children}
          </main>
        </ClientProviders>
      </div>
    </div>
  );
}
