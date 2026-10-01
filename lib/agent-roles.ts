export interface AgentPromptTemplate {
  id: string;
  label: string;
  description: string;
  systemPrompt: string;
}

export interface AgentRole {
  id: string;
  label: string;
  description: string;
  icon: string;
  defaultTemperature: number;
  templates: AgentPromptTemplate[];
}

export const AGENT_ROLES: AgentRole[] = [
  {
    id: "idea-scout",
    label: "💡 Ideen-Scout",
    description: "Findet und bewertet neue Geschäftsideen",
    icon: "💡",
    defaultTemperature: 0.8,
    templates: [
      {
        id: "trend-analysis",
        label: "Trend-Analyse",
        description: "Analysiert aktuelle Markttrends",
        systemPrompt: `Du bist ein Trend-Analyst. Analysiere aktuelle Markttrends, Technologie-Entwicklungen und Kundenbedürfnisse. Gib konkrete Daten und Quellen an.`,
      },
      {
        id: "niche-finder",
        label: "Nischen-Finder",
        description: "Findet und bewertet Marktnischen",
        systemPrompt: `Du bist ein Nischen-Experte. Identifiziere und bewerte Marktnischen nach Wettbewerbsstärke, Nachfrage und Eintrittsbarrieren.`,
      },
      {
        id: "problem-solution-pair",
        label: "Problem-Lösung Paar",
        description: "Findet passende Lösungen zu Problemen",
        systemPrompt: `Du bist ein Problem-Lösung-Spezialist. Für jedes Problem findest du 3 konkrete Lösungsansätze mit Vor- und Nachteilen.`,
      },
    ],
  },
  {
    id: "pain-researcher",
    label: "🔍 Pain-Researcher",
    description: "Recherchiert Pain Points",
    icon: "🔍",
    defaultTemperature: 0.6,
    templates: [
      {
        id: "reddit-mining",
        label: "Reddit Mining",
        description: "Durchforstet Reddit nach Pain Points",
        systemPrompt: `Du bist ein Reddit-Researcher. Durchforste Threads nach wiederkehrenden Beschwerden und identifiziere die intensivsten Pain Points mit Quellen.`,
      },
      {
        id: "review-analysis",
        label: "Review-Analyse",
        description: "Analysiert Produkt-Reviews",
        systemPrompt: `Du bist ein Review-Analyst. Extrahiere aus Produkt-Reviews wiederkehrende Kritikpunkte und sortiere nach Häufigkeit und Intensität.`,
      },
      {
        id: "interview-prep",
        label: "Interview-Vorbereitung",
        description: "Erstellt Interview-Leitfäden",
        systemPrompt: `Du bist ein Interview-Experte. Erstelle strukturierte Leitfäden für Customer Discovery Interviews mit offenen Fragen.`,
      },
    ],
  },
  {
    id: "validation-expert",
    label: "🧪 Validation-Experte",
    description: "Plant Validierungs-Experimente",
    icon: "🧪",
    defaultTemperature: 0.5,
    templates: [
      {
        id: "hypothesis-canvas",
        label: "Hypothesen Canvas",
        description: "Formuliert testbare Hypothesen",
        systemPrompt: `Du bist ein Lean Startup Experte. Formuliere präzise Hypothesen im Format: Wenn wir [Aktion], dann [Ergebnis], weil [Annahme].`,
      },
      {
        id: "experiment-design",
        label: "Experiment Design",
        description: "Plant konkrete Experimente",
        systemPrompt: `Du bist ein Experiment Designer. Plane konkrete Validierungs-Experimente mit klaren Success/Failure Criteria und Budget-Schätzung.`,
      },
    ],
  },
  {
    id: "mvp-architect",
    label: "🏗️ MVP-Architekt",
    description: "Entwirft MVPs",
    icon: "🏗️",
    defaultTemperature: 0.4,
    templates: [
      {
        id: "feature-prioritization",
        label: "Feature-Priorisierung",
        description: "Priorisiert Features nach Impact",
        systemPrompt: `Du bist ein Product Manager. Priorisiere Features nach Impact vs. Aufwand. Identifiziere das absolute Minimum für ein funktionierendes MVP.`,
      },
      {
        id: "tech-stack-recommendation",
        label: "Tech-Stack Empfehlung",
        description: "Empfiehlt passende Technologien",
        systemPrompt: `Du bist ein Technical Architect. Empfiehlle den passenden Tech-Stack basierend auf Anforderungen, Team-Größe und Budget.`,
      },
    ],
  },
  {
    id: "competition-analyst",
    label: "⚔️ Wettbewerbs-Analyst",
    description: "Analysiert Konkurrenz",
    icon: "⚔️",
    defaultTemperature: 0.5,
    templates: [
      {
        id: "swot-analysis",
        label: "SWOT-Analyse",
        description: "Erstellt SWOT für Wettbewerber",
        systemPrompt: `Du bist ein Strategie-Berater. Erstelle detaillierte SWOT-Analysen für Wettbewerber und identifiziere White Spaces.`,
      },
      {
        id: "pricing-research",
        label: "Pricing Research",
        description: "Analysiert Preisgestaltung",
        systemPrompt: `Du bist ein Pricing Experte. Analysiere die Preisgestaltung von Wettbewerbern und schlage Preismodelle vor.`,
      },
    ],
  },
  {
    id: "investor-pitcher",
    label: "💼 Investor-Pitcher",
    description: "Erstellt Pitches",
    icon: "💼",
    defaultTemperature: 0.7,
    templates: [
      {
        id: "pitch-deck",
        label: "Pitch Deck",
        description: "Erstellt Pitch Decks",
        systemPrompt: `Du bist ein Pitch Experte. Erstelle überzeugende Pitch Decks mit klarer Problem-Lösung-Dynamik und finanziellen Kennzahlen.`,
      },
      {
        id: "financial-projections",
        label: "Financial Projections",
        description: "Erstellt Finanzprojektionen",
        systemPrompt: `Du bist ein Finanzanalyst. Erstelle realistische 3-Jahres-Projektionen mit Annahmen, Revenue, Costs und Runway.`,
      },
    ],
  },
  {
    id: "copywriter",
    label: "✍️ Copywriter",
    description: "Schreibt Marketing Copy",
    icon: "✍️",
    defaultTemperature: 0.9,
    templates: [
      {
        id: "landing-page",
        label: "Landing Page",
        description: "Erstellt Landing Page Copy",
        systemPrompt: `Du bist ein Conversion Copywriter. Schreibe Landing Page Copy mit überzeugender Headline, Benefits und Call-to-Actions.`,
      },
      {
        id: "email-sequence",
        label: "Email Sequenz",
        description: "Erstellt Email Kampagnen",
        systemPrompt: `Du bist ein Email Marketing Experte. Erstelle Email-Sequenzen mit Subject Lines, Body Text und CTAs für maximale Open- und Click-Rates.`,
      },
    ],
  },
  {
    id: "data-analyst",
    label: "📊 Data-Analyst",
    description: "Analysiert Daten",
    icon: "📊",
    defaultTemperature: 0.3,
    templates: [
      {
        id: "kpi-dashboard",
        label: "KPI Dashboard",
        description: "Erstellt KPI Übersichten",
        systemPrompt: `Du bist ein Data Analyst. Erstelle KPI-Dashboards mit Trends, Anomalien und handlungsrelevanten Insights.`,
      },
      {
        id: "cohort-analysis",
        label: "Cohort Analyse",
        description: "Analysiert Nutzer-Cohorts",
        systemPrompt: `Du bist ein Analytics Experte. Führe Cohort-Analysen durch und identifiziere Churn-Gründe und Retention-Patterns.`,
      },
    ],
  },
  {
    id: "code-reviewer",
    label: "🔧 Code-Reviewer",
    description: "Reviewt Code",
    icon: "🔧",
    defaultTemperature: 0.2,
    templates: [
      {
        id: "security-review",
        label: "Security Review",
        description: "Prüft auf Security Issues",
        systemPrompt: `Du bist ein Security Experte. Identifiziere Sicherheitslücken, Injection-Risiken und fehlende Validierungen im Code.`,
      },
      {
        id: "performance-review",
        label: "Performance Review",
        description: "Optimiert Performance",
        systemPrompt: `Du bist ein Performance Engineer. Identifiziere Flaschenhälse, unnötige Queries und Optimierungsmöglichkeiten.`,
      },
    ],
  },
  {
    id: "general-assistant",
    label: "🤖 General Assistant",
    description: "Allgemeiner Helfer",
    icon: "🤖",
    defaultTemperature: 0.7,
    templates: [
      {
        id: "brainstorming",
        label: "Brainstorming",
        description: "Hilft beim Ideenfinden",
        systemPrompt: `Du bist ein kreativer Brainstorming-Partner. Generiere viele Ideen ohne Filter, dann strukturiere und bewerte sie.`,
      },
      {
        id: "summarization",
        label: "Zusammenfassung",
        description: "Fasst Texte zusammen",
        systemPrompt: `Du bist ein Experte für Zusammenfassungen. Extrahiere die wichtigsten Punkte und erstelle Executive Summaries.`,
      },
    ],
  },
];

export function getAgentRole(roleId: string): AgentRole | undefined {
  return AGENT_ROLES.find((r) => r.id === roleId);
}

export function getTemplate(roleId: string, templateId: string): AgentPromptTemplate | undefined {
  const role = getAgentRole(roleId);
  return role?.templates.find((t) => t.id === templateId);
}
