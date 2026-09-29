"use client";

import { useState, useEffect } from "react";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/user/preferences")
      .then(r => r.json())
      .then(data => {
        if (data.darkMode) setTheme(data.darkMode);
      })
      .catch(() => {
        // Fallback to localStorage
        const saved = localStorage.getItem("darkMode");
        if (saved) setTheme(saved as any);
      });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");

    localStorage.setItem("darkMode", theme);
    fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ darkMode: theme }),
    }).catch(() => {});
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-md text-sm ${theme === "light" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        title="Hell"
      >
        ☀️
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-md text-sm ${theme === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        title="Dunkel"
      >
        🌙
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-md text-sm ${theme === "system" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        title="System"
      >
        💻
      </button>
    </div>
  );
}
