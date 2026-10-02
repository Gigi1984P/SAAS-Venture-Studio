import { SidebarNav } from "@/components/sidebar-nav";

export default function ValidationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 lg:ml-64">{children}</main>
    </div>
  );
}
