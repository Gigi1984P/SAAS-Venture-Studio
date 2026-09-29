import { SidebarNav } from "@/components/sidebar-nav";
import Header from "@/components/header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
