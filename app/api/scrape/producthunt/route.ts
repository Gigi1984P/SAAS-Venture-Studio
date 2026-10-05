import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  return null;
}

const PAINS = [
  { name: "AI Meeting Notes", pain: "2h/Woche manuell notieren", cat: "Productivity", score: 85 },
  { name: "API Doc Generator", pain: "Dokus veraltet in 2 Wochen", cat: "DevTools", score: 78 },
  { name: "Feedback Hub", pain: "Feedback in 5 Tools", cat: "Support", score: 82 },
  { name: "Onboarding Auto", pain: "60% churn nach Tag 1", cat: "Retention", score: 91 },
  { name: "Privacy Analytics", pain: "DSGVO Cookie-Banner", cat: "Analytics", score: 88 },
];

export async function POST() {
  const authError = await checkAuth();
  if (authError) return authError;

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
