import type { Metadata } from "next";
import "./(app)/globals.css";
import ClientProviders from "@/components/client-providers";
import OnboardingTour from "@/components/onboarding-tour";
import AIChatAssistant from "@/components/ai-chat-assistant";

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
    <html lang="de" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
        <OnboardingTour />
        <AIChatAssistant />
      </body>
    </html>
  );
}
