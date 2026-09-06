import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold">
            SVS
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/dashboard"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/ventures"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Ventures
          </Link>
          <Link
            href="/settings"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Einstellungen
          </Link>
        </nav>
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            {session.user?.email}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6 lg:justify-end">
          <Link href="/dashboard" className="text-lg font-bold lg:hidden">
            SVS
          </Link>
          <form
            action={async () => {
              "use server";
              const { signOut } = await import("next-auth/react");
              await signOut({ redirect: true, callbackUrl: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Abmelden
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
