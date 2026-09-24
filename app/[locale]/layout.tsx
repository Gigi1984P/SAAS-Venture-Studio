import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales, defaultLocale } from "@/i18n/config";
import { SidebarNav } from "@/components/sidebar-nav";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAAS Venture Studio",
  description: "Venture-Studio-Plattform für SaaS-Produkte",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = locales.includes(params.locale as any) ? (params.locale as any) : defaultLocale;
  const messages = await getMessages({ locale });
  const session = await getServerSession(authOptions);

  // Auth-Seiten (Login, Register) sollen keine Sidebar haben
  const isAuthPage = false; // Wird im Middleware geregelt

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-screen">
            {/* Sidebar nur wenn eingeloggt */}
            {session?.user ? (
              <SidebarNav roleName={(session.user as any)?.role || undefined} />
            ) : null}
            <main className={`flex-1 ${session?.user ? 'lg:ml-64' : ''}`}>
              {children}
            </main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
