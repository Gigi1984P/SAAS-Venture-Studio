import type { Metadata } from "next";
import "./(app)/globals.css";
import ClientProviders from "@/components/client-providers";

export const metadata: Metadata = {
  title: "SAAS Venture Studio",
  description: "Venture-Studio-Plattform für SaaS-Produkte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
