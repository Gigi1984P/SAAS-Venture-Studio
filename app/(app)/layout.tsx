import { Metadata } from "next";
import { SidebarNav } from "@/components/sidebar-nav";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "SaaS Venture Studio",
  description: "Automatisierte SaaS-Ideenfindung und Venture-Entwicklung",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  const roleName = (session.user as any)?.role || "";

  return (
    <div className="flex min-h-screen">
      <SidebarNav roleName={roleName} />
      <main className="flex-1 ml-64">
        <div className="h-full p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
