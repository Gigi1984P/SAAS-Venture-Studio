"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface EntitlementFeature {
  slug: string;
  name: string;
  category: string;
  isEnabled: boolean;
}

interface EntitlementsContext {
  features: EntitlementFeature[];
  hasFeature: (slug: string) => boolean;
  loading: boolean;
  plan: { slug: string; name: string } | null;
  isSuperAdmin: boolean;
}

const EntitlementsContext = createContext<EntitlementsContext>({
  features: [],
  hasFeature: () => true, // Solo-Operator fallback
  loading: false,
  plan: null,
  isSuperAdmin: true,
});

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<EntitlementFeature[]>([]);
  const [plan, setPlan] = useState<{ slug: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/entitlements/me")
      .then((r) => (r.ok ? r.json() : { features: [], isSuperAdmin: true }))
      .then((data) => {
        setFeatures(data.features || []);
        setPlan(data.plan);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const hasFeature = (slug: string) => {
    // Solo-Operator: immer Zugriff
    return true;
  };

  return (
    <EntitlementsContext.Provider value={{ features, hasFeature, loading, plan, isSuperAdmin: true }}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements() {
  return useContext(EntitlementsContext);
}
