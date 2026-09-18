"use client";

import { usePathname } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { locales } from "@/i18n/config";

export function ClientLayout({
  children,
  roleName,
}: {
  children: React.ReactNode;
  roleName?: string;
}) {
  const pathname = usePathname();

  // Strip locale prefix for route matching (e.g. /de/dashboard -> /dashboard)
  const localePrefix = pathname?.split("/")[1];
  const isLocalePath = locales.includes(localePrefix as any);
  const cleanPath = isLocalePath
    ? pathname!.substring(3) // remove /de or /en etc.
    : pathname;

  const isAuthPage = cleanPath?.startsWith("/auth/") ?? false;
  const isPublic = cleanPath === "/" || isAuthPage;

  if (isPublic) {
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
