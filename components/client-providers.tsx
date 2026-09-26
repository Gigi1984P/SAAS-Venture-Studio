"use client";

import { SessionProvider } from "next-auth/react";
import CookieConsent from "@/components/cookie-consent";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div>
        {children}
        <CookieConsent />
      </div>
    </SessionProvider>
  );
}
