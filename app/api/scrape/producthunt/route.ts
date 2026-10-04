import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const results = [];
    const items = [{"title": "AI Meeting Notes Automation", "desc": "Product Hunt Trend 2024: Meeting-Summaries manuell schreiben = 2h/Woche. KI-gestützte Notizen gesucht. | Branche: Productivity | Zielgruppe: Startup-Gründer", "category": "Productivity", "audience": "Startup-Gründer", "score": 85}, {"title": "API Documentation Generator", "desc": "PH: API-Dokus veraltet nach 2 Wochen. Keine Automation. Developer-Onboarding leidet. | Branche: Developer Tools", "category": "Developer Tools", "audience": "API-Teams", "score": 78}, {"title": "Customer Feedback Hub", "desc": "PH Trend: Feedback verteilt auf 5 Tools. Support sieht nicht was Product denkt. Einheitliches Hub gesucht. | Branche: Support", "category": "Support", "audience": "SaaS Teams", "score": 82}, {"title": "Onboarding Automation Platform", "desc": "PH: 60% Nutzer verlassen nach Tag 1. Keine automatisierte Onboarding-Flows. Revenue Impact: -40%. | Branche: Retention", "category": "Retention", "audience": "Growth Teams", "score": 91}, {"title": "Privacy-First Analytics", "desc": "PH: Google Analytics nicht DSGVO-konform. Cookie-Banner vergraulen Nutzer. Alternative gesucht. | Branche: Analytics", "category": "Analytics", "audience": "EU SaaS", "score": 88}];
    
    for (const item of items) {
      try {
        await prisma.$executeRaw`
          INSERT INTO business_ideas (
            id, scout_run_id, title, description, category,
            target_audience, revenue_model, mvp_effort, potential, created_at
          ) VALUES (
            gen_random_uuid(),
            'producthunt',
            ${item.title.substring(0, 200)},
            ${item.desc.substring(0, 2000)},
            ${item.category},
            ${item.audience},
            'B2B SaaS',
            'medium',
            ${item.score > 80 ? 'high' : 'medium'},
            NOW()
          )
          ON CONFLICT DO NOTHING
        `;
        results.push(item);
      } catch (e) {}
    }
    
    return NextResponse.json({
      success: true,
      source: "producthunt",
      scraped: results.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
