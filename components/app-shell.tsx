"use client";

import { usePathname } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({
  children,
  roleName,
}: {
  children: React.ReactNode;
  roleName?: string;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth/");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav roleName={roleName} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
