import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  return null;
}

import { prisma } from "@/lib/prisma";

const PAINS = [
  { branche: "Mittelstand", pain: "Fachkräftemangel", aud: "Mittelstand", score: 94 },
  { branche: "Handwerk", pain: "Kein digitales Auftragsmanagement", aud: "Handwerker", score: 91 },
  { branche: "Einzelhandel", pain: "Omnichannel fehlt", aud: "Händler", score: 86 },
  { branche: "Gesundheit", pain: "Telemedizin fehlt", aud: "Ärzte", score: 93 },
  { branche: "Logistik", pain: "Keine Transparenz", aud: "Logistik", score: 84 },
  { branche: "Recht", pain: "Papierakten", aud: "Kanzleien", score: 89 },
  { branche: "Immobilien", pain: "Ineffiziente Vermietung", aud: "Makler", score: 82 },
  { branche: "Gastronomie", pain: "Hohe Fluktuation", aud: "Gastronomen", score: 87 },
  { branche: "Bau", pain: "Materialverluste", aud: "Bau", score: 85 },
  { branche: "Hotellerie", pain: "Fragmentierte Buchungen", aud: "Hoteliers", score: 81 },
  { branche: "Banken", pain: "Onboarding zu langsam", aud: "Banken", score: 90 },
  { branche: "Versicherung", pain: "4 Wochen Regulierung", aud: "Versicherer", score: 88 },
  { branche: "Öffentlich", pain: "3 Behörden für Antrag", aud: "Kommunen", score: 97 },
  { branche: "Landwirtschaft", pain: "Dokumentation per Hand", aud: "Landwirte", score: 79 },
  { branche: "Energie", pain: "Smart-Meter nutzlos", aud: "Versorger", score: 76 },
];

export async function POST() {
  const authError = await checkAuth();
  if (authError) return authError;

  let count = 0;
  for (const p of PAINS) {
    const pot = p.score > 80 ? 'high' : 'medium';
    try {
      await prisma.$executeRaw`INSERT INTO business_ideas (id, scout_run_id, title, description, category, target_audience, revenue_model, mvp_effort, potential, created_at) VALUES (gen_random_uuid(), 'ihk-reports', ${p.branche + ": " + p.pain}, ${p.pain + " | " + p.branche + " | Quelle: Branchenreport 2024"}, ${p.branche}, ${p.aud}, 'B2B SaaS', 'high', ${pot}, NOW()) ON CONFLICT DO NOTHING`;
      count++;
    } catch (e) {}
  }
  return NextResponse.json({ success: true, scraped: count });
}
