import { ServerSidebar } from "@/components/server-sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <ServerSidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <main className="flex-1 p-6 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
