import type { Metadata } from "next";
import "./(app)/globals.css";
import ClientProviders from "@/components/client-providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "SAAS Venture Studio",
  description: "Systematische Venture-Entwicklung",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
