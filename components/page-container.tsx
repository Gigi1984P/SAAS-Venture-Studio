"use client";

import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export default function PageContainer({ children, title, actions }: PageContainerProps) {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
