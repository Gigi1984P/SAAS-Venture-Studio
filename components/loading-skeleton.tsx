"use client";

import { useTranslations } from "next-intl";

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  const t = useTranslations("LoadingSkeleton");
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
