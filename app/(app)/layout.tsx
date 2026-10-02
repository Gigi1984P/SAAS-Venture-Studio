import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Lightbulb,
  Settings,
  ShieldAlert,
  LogOut,
  Rocket,
  Target,
  Layers,
  Building2,
  Telescope,
} from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Server Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">SVS</Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
          </Link>
          
          <Link href="/studio" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Building2 className="w-4 h-4 shrink-0" /> Studio OS
          </Link>

          {/* IdeenScout */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary bg-primary/10">
              <Telescope className="w-4 h-4 shrink-0 text-primary" />
              <span className="flex-1">🔍 IdeenScout</span>
              <svg className="w-3 h-3 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="ml-4 pl-3 border-l border-border space-y-0.5">
              <Link href="/ideenscout" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                <LayoutDashboard className="w-3 h-3 shrink-0" /> Übersicht
              </Link>
              <Link href="/ideenscout/signal" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                📡 Signals
              </Link>
              <Link href="/ideenscout/pain" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                💔 Pain Graph
              </Link>
              <Link href="/ideenscout/opportunity" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                🎯 Opportunity
              </Link>
              <Link href="/ideenscout/scoring" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                📊 Scoring
              </Link>
              <Link href="/ideenscout/experiment" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                🧪 Experiment
              </Link>
            </div>
          </div>

          <Link href="/ideas" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Lightbulb className="w-4 h-4 shrink-0" /> Ideen
          </Link>
          
          <Link href="/opportunities" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Target className="w-4 h-4 shrink-0" /> Opportunities
          </Link>
          
          <Link href="/ventures" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Briefcase className="w-4 h-4 shrink-0" /> Ventures
          </Link>
          
          <Link href="/templates" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Rocket className="w-4 h-4 shrink-0" /> Templates
          </Link>
          
          <Link href="/template-gallery" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Layers className="w-4 h-4 shrink-0" /> Galerie
          </Link>
          
          <Link href="/settings" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Settings className="w-4 h-4 shrink-0" /> Einstellungen
          </Link>

          <Link href="/admin/users" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
            <ShieldAlert className="w-4 h-4 shrink-0" /> Admin
          </Link>
        </nav>

        <div className="border-t p-3 space-y-3">
          <div className="text-xs text-muted-foreground">🇩🇪 DE</div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <LogOut className="w-4 h-4" /> Abmelden
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col lg:ml-64">
        <main className="flex-1 p-6 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
