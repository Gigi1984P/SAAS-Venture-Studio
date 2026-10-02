import { redirect } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Einfaches Layout ohne Sidebar (ist jetzt in page.tsx)
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
