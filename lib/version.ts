// ============================================================
// SAAS VENTURE STUDIO — VERSION CONTROL
// ============================================================

export const CURRENT_VERSION = {
  version: "2.0.0",
  codename: "Studio OS",
  buildDate: new Date().toISOString(),
  gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
};

export const RELEASE_NOTES = [
  {
    version: "2.0.0",
    date: "2026-09-29",
    title: "Studio OS — Das Betriebssystem für Venture Studios",
    changes: [
      "🏢 Venture Entity Management — Gründe GmbH/UG/LLC direkt aus Opportunities",
      "🔗 Shared Services Dashboard — DevOps, Marketing, Legal für alle Ventures",
      "🔥 Burn Rate & Runway Tracker — Automatische Finanz-Kalkulation",
      "👥 Founder Marketplace — Finde Co-Founder nach Skills",
      "💼 Investor CRM — Verwalte Investor-Beziehungen und Funding-Runden",
    ],
  },
  {
    version: "1.9.0",
    date: "2026-09-29",
    title: "10 Neue Features und Automatisierungen",
    changes: [
      "🤖 AI Chat Assistant — Floating Chat mit Ollama Integration",
      "📊 Analytics Dashboard — Pipeline Metrics und Score Trends",
      "📝 Activity Log — Audit Trail für alle User-Aktionen",
      "📦 Bulk Actions — Massen-Export und Massen-Löschung",
      "🌙 Dark Mode Toggle — Hell/Dunkel/System",
      "💬 Opportunity Comments — Threaded Diskussionen",
      "💰 Revenue Calculator — MRR/ARR/LTV Rechner",
      "📅 Timeline View — Visuelle Roadmap mit Milestones",
      "🎓 Onboarding Tour — 5-Schritte Guided Tour",
      "🔍 Advanced Filters — Score-Bereich, Status, Datum",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-09-28",
    title: "Ollama Integration und Auth Hardening",
    changes: [
      "🔗 Ollama Remote API Integration in Settings",
      "🔒 3-Lagen Auth Guard — Middleware, Layout, Sidebar",
      "📐 Einheitliches Page-Layout über alle Seiten",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-09-28",
    title: "20 Automatisierungen",
    changes: [
      "⚡ Auto-Deduplication, Pain Signal Discovery, Validation Reminder",
      "⚡ Budget Alert, Score Trend Alert, MVP Deadline Check",
      "⚡ Pitch Deck Update, Weekly Backup, Competitor Entry",
      "⚡ Venture Readiness Score Threshold",
      "⏰ 7 Cron-Jobs für automatische Prozesse",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-09-28",
    title: "6 Gap-Features geschlossen",
    changes: [
      "🔍 Globale Suche über alle Entities",
      "📥 CSV Import/Export",
      "📱 Mobile Navigation",
      "📊 Dashboard Widgets",
      "🔑 API Key und Webhook Management",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-09-27",
    title: "Phase A–G komplett",
    changes: [
      "📈 Phase A: Pain Graph, Auto-Scoring",
      "🎯 Phase B: Evidence Funnel, Validation Experiments",
      "📊 Phase C: Financial Model, Unit Economics",
      "🚀 Phase D: MVP Generator, PRD Builder",
      "🌍 Phase E: GTM Plan, Pricing Strategy",
      "🤝 Phase F: Partnership Map, Integration API",
      "⚖️ Phase G: Risk Matrix, Compliance Checklist",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-09-27",
    title: "Initial Release",
    changes: [
      "🏗️ Core Platform mit Next.js 14, Prisma, PostgreSQL",
      "👤 Auth mit NextAuth.js",
      "📋 Opportunity Management mit 22 Tabs",
      "🤖 Agent Orchestrator",
      "📡 Intelligence Radar",
      "🎨 Shadcn/UI Design System",
    ],
  },
];
