"use client";

import { useTranslations } from "next-intl";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  onAction,
}: {
  title?: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  const t = useTranslations("EmptyState");
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
      <Inbox className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold text-card-foreground mb-1">{title || t("title")}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description || t("description")}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}
