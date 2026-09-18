import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales, defaultLocale } from "@/i18n/config";
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

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
