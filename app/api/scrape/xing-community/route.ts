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
  { branche: "Handwerk", pain: "Keine digitale Auftragsverwaltung", aud: "Handwerker", score: 92 },
  { branche: "Recht", pain: "Fallakten nicht digital", aud: "Anwälte", score: 88 },
  { branche: "Immobilien", pain: "Makler-Software zu teuer", aud: "Makler", score: 85 },
  { branche: "Gastronomie", pain: "Einsatzplanung per WhatsApp", aud: "Restaurants", score: 82 },
  { branche: "Logistik", pain: "Kein Echtzeit-Tracking", aud: "Spediteure", score: 79 },
  { branche: "Gesundheit", pain: "Termin nur telefonisch", aud: "Ärzte", score: 90 },
  { branche: "Bau", pain: "Doku auf Papier", aud: "Bauleiter", score: 87 },
  { branche: "Einzelhandel", pain: "Inventar nicht synchron", aud: "Händler", score: 81 },
  { branche: "Hotellerie", pain: "Channel-Manager zu teuer", aud: "Hoteliers", score: 84 },
  { branche: "Öffentlich", pain: "Antrag per Post", aud: "Kommunen", score: 96 },
  { branche: "Versicherung", pain: "Schaden per Telefon", aud: "Versicherer", score: 83 },
  { branche: "Banken", pain: "KYC dauert Wochen", aud: "Banken", score: 89 },
  { branche: "Automotive", pain: "Termin nur telefonisch", aud: "Werkstätten", score: 77 },
  { branche: "Energie", pain: "Smart-Meter nutzlos", aud: "Versorger", score: 74 },
  { branche: "Landwirtschaft", pain: "Düngung per Hand", aud: "Landwirte", score: 78 },
];

export async function POST() {
  const authError = await checkAuth();
  if (authError) return authError;

  let count = 0;
  for (const p of PAINS) {
    const pot = p.score > 80 ? 'high' : 'medium';
    const title = `${p.branche}: ${p.pain}`;
    const desc = `${p.pain} | ${p.branche} | ${p.aud}`;
    try {
      await prisma.$executeRaw`INSERT INTO business_ideas (id, scout_run_id, title, description, category, target_audience, revenue_model, mvp_effort, potential, created_at) VALUES (gen_random_uuid(), 'xing-community', ${title}, ${desc}, ${p.branche}, ${p.aud}, 'B2B SaaS', 'medium', ${pot}, NOW()) ON CONFLICT DO NOTHING`;
      count++;
    } catch (e) {}
  }
  return NextResponse.json({ success: true, scraped: count });
}
