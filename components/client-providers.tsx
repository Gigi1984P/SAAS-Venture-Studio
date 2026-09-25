"use client";

import CookieConsent from "@/components/cookie-consent";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <CookieConsent />
    </div>
  );
}
