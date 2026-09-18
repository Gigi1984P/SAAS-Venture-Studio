"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Radar as RadarIcon,
  Bot,
  Search,
  Briefcase,
  Lightbulb,
  Settings,
  ShieldAlert,
  LogOut,
  Globe,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const localesMeta = [
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "nl", label: "NL", flag: "🇳🇱" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = localesMeta.find((l) => l.code === locale) || localesMeta[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-32 rounded-md border bg-popover p-1 shadow-md">
            {localesMeta.map((l) => (
              <Link
                key={l.code}
                href={pathname}
                locale={l.code as any}
                className={cn(
                  "flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
                  locale === l.code
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-popover-foreground hover:bg-accent"
                )}
                onClick={() => setOpen(false)}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

export function SidebarNav({ roleName }: { roleName?: string }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/dashboard", labelKey: "dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/opportunities", labelKey: "opportunities", icon: <Lightbulb className="w-4 h-4" /> },
    { href: "/ventures", labelKey: "ventures", icon: <Briefcase className="w-4 h-4" /> },
    { href: "/validation", labelKey: "validation", icon: <RadarIcon className="w-4 h-4" /> },
    { href: "/dashboard/intelligence", labelKey: "intelligence", icon: <Search className="w-4 h-4" /> },
    { href: "/dashboard/agents", labelKey: "agents", icon: <Bot className="w-4 h-4" /> },
    { href: "/dashboard/radar", labelKey: "radar", icon: <RadarIcon className="w-4 h-4" /> },
    { href: "/settings", labelKey: "settings", icon: <Settings className="w-4 h-4" /> },
    { href: "/admin/users", labelKey: "admin", icon: <ShieldAlert className="w-4 h-4" />, adminOnly: true },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || roleName === "superadmin");

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3.5 left-4 z-50 rounded-md border bg-card p-2 shadow-sm"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            SVS
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  item.adminOnly && "text-red-600 hover:bg-red-50 hover:text-red-700"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>
                  {item.icon}
                </span>
                {t(item.labelKey as any)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3 space-y-3">
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t("logout")}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
