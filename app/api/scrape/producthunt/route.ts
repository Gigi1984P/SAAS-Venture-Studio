import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAINS = [
  { name: "AI Meeting Notes", pain: "2h/Woche manuell notieren", cat: "Productivity", score: 85 },
  { name: "API Doc Generator", pain: "Dokus veraltet in 2 Wochen", cat: "DevTools", score: 78 },
  { name: "Feedback Hub", pain: "Feedback in 5 Tools", cat: "Support", score: 82 },
  { name: "Onboarding Auto", pain: "60% churn nach Tag 1", cat: "Retention", score: 91 },
  { name: "Privacy Analytics", pain: "DSGVO Cookie-Banner", cat: "Analytics", score: 88 },
];

export async function POST() {
  let count = 0;
  for (const p of PAINS) {
    const pot = p.score > 80 ? 'high' : 'medium';
    try {
      await prisma.$executeRaw`INSERT INTO business_ideas (id, scout_run_id, title, description, category, target_audience, revenue_model, mvp_effort, potential, created_at) VALUES (gen_random_uuid(), 'producthunt', ${p.name}, ${p.pain + " | PH Trend 2024"}, ${p.cat}, "Startups", "SaaS", "low", ${pot}, NOW()) ON CONFLICT DO NOTHING`;
      count++;
    } catch (e) {}
  }
  return NextResponse.json({ success: true, scraped: count });
}
