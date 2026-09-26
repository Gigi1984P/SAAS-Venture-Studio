"use client";

import GlobalSearch from "./global-search";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-4">
      <div className="flex-1">
        <GlobalSearch />
      </div>
    </header>
  );
}
