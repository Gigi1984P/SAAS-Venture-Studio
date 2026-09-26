"use client";

import { useState } from "react";

export default function MobileTabNavigation({ tabs, activeTab, onChange }: { tabs: { id: string; label: string }[]; activeTab: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const activeLabel = tabs.find(t => t.id === activeTab)?.label || activeTab;

  return (
    <div className="lg:hidden relative mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg border bg-card px-4 py-2 text-sm font-medium"
      >
        <span>{activeLabel}</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-card shadow-lg z-40 max-h-64 overflow-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { onChange(tab.id); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
