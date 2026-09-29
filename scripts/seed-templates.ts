import { prisma } from "@/lib/prisma";

const templates = [
  {
    name: "Next.js SaaS Starter",
    slug: "nextjs-saas-starter",
    description: "Vollständiger SaaS-Starter mit Next.js 14, Prisma, PostgreSQL, Stripe-Abos, Team-Verwaltung und Admin-Dashboard. Bereit für Multi-Tenant.",
    category: "saas",
    tags: "nextjs,prisma,postgresql,stripe,auth,tailwind",
    repositoryUrl: "https://github.com/example/nextjs-saas-starter",
    demoUrl: "https://saas-starter.demo.com",
  },
  {
    name: "AI Content Generator",
    slug: "ai-content-generator",
    description: "SaaS-Plattform für KI-gestützte Content-Erstellung. Integriert OpenAI, Anthropic und lokale Modelle. Mit Credit-System und API-Zugriff.",
    category: "ai-tool",
    tags: "ai,openai,llm,content,api",
    repositoryUrl: "https://github.com/example/ai-content-gen",
    demoUrl: "https://ai-content.demo.com",
  },
  {
    name: "B2B Marketplace Platform",
    slug: "b2b-marketplace",
    description: "Zweiseitige Marketplace-Lösung für B2B. Vendor-Onboarding, RFQ-System, Escrow-Zahlungen und Lieferanten-Rating.",
    category: "marketplace",
    tags: "marketplace,b2b,vendor,rfq,escrow",
    repositoryUrl: "https://github.com/example/b2b-marketplace",
    demoUrl: "https://b2b-market.demo.com",
  },
  {
    name: "Chrome Extension Boilerplate",
    slug: "chrome-extension-boilerplate",
    description: "Moderner Chrome Extension Starter mit Manifest V3, React, TypeScript und Hot Reload. Inkl. Popup, Content Script und Background Service Worker.",
    category: "chrome-extension",
    tags: "chrome,extension,manifest-v3,typescript",
    repositoryUrl: "https://github.com/example/chrome-ext-boilerplate",
    demoUrl: null,
  },
  {
    name: "React Native Mobile App",
    slug: "react-native-mobile",
    description: "Cross-Platform Mobile App mit React Native, Expo und TypeScript. Inkl. Push Notifications, Deep Linking, und Offline-Support.",
    category: "mobile-app",
    tags: "react-native,expo,mobile,ios,android",
    repositoryUrl: "https://github.com/example/react-native-mobile",
    demoUrl: null,
  },
  {
    name: "Micro-SaaS Analytics Dashboard",
    slug: "micro-saas-analytics",
    description: "Plug-and-Play Analytics für Micro-SaaS. Trackt MRR, Churn, LTV, CAC und cohort-based retention. Mit Embeddable Widgets.",
    category: "saas",
    tags: "analytics,mrr,churn,ltv,metrics",
    repositoryUrl: "https://github.com/example/micro-saas-analytics",
    demoUrl: "https://analytics.demo.com",
  },
  {
    name: "AI Image Generator API",
    slug: "ai-image-api",
    description: "REST-API für KI-Bildgenerierung. Unterstützt Stable Diffusion, DALL-E und Midjourney-Style Prompts. Mit Queue-System und Webhooks.",
    category: "ai-tool",
    tags: "ai,image,stable-diffusion,api,queue",
    repositoryUrl: "https://github.com/example/ai-image-api",
    demoUrl: "https://ai-image.demo.com",
  },
  {
    name: "C2C Marketplace mit AI Matching",
    slug: "c2c-ai-marketplace",
    description: "Consumer-to-Consumer Marketplace mit KI-basiertem Matching. Findet automatisch beste Angebote basierend auf User-Präferenzen.",
    category: "marketplace",
    tags: "marketplace,c2c,ai-matching,recommendations",
    repositoryUrl: "https://github.com/example/c2c-ai-marketplace",
    demoUrl: "https://c2c-market.demo.com",
  },
  {
    name: "Browser Extension für Productivity",
    slug: "productivity-extension",
    description: "Productivity-Browser-Extension mit Time-Tracking, Pomodoro-Timer und Website-Blocker. Sync über Cloud mit Dashboard.",
    category: "chrome-extension",
    tags: "productivity,time-tracking,pomodoro,extension",
    repositoryUrl: "https://github.com/example/productivity-ext",
    demoUrl: null,
  },
  {
    name: "Flutter E-Commerce App",
    slug: "flutter-ecommerce",
    description: "Vollständige E-Commerce Mobile App mit Flutter. Inkl. Product-Katalog, Warenkorb, Stripe-Zahlung und Order-Tracking.",
    category: "mobile-app",
    tags: "flutter,dart,ecommerce,stripe,mobile",
    repositoryUrl: "https://github.com/example/flutter-ecommerce",
    demoUrl: null,
  },
];

export async function seedTemplates() {
  const existing = await prisma.ventureTemplate.count();
  if (existing > 0) {
    console.log(`Skipping seed: ${existing} templates already exist`);
    return;
  }

  for (const t of templates) {
    await prisma.ventureTemplate.create({ data: t });
  }
  console.log(`✅ Seeded ${templates.length} templates`);
}

// Run if executed directly
if (require.main === module) {
  seedTemplates()
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
}
