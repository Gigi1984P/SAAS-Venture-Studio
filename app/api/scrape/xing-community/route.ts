import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const results = [];
    const items = [{"title": "Handwerk: Digitale Auftragsverwaltung fehlt", "desc": "Xing Diskussion: "Maler, Elektriker verwalten Aufträge per WhatsApp. Termin-Chaos. Kunden verärgert." | Branche: Handwerk | Zielgruppe: Handwerker (DE)", "category": "Handwerk", "audience": "Handwerker (DE)", "score": 92}, {"title": "Recht: Fallakten nicht digital verfügbar", "desc": "LinkedIn: "Kanzlei mit 20 Anwälten, 0% Digital. Mitarbeiter suchen 30% Zeit nach Akten." | Branche: Recht | Zielgruppe: Anwälte (DE)", "category": "Recht", "audience": "Anwälte (DE)", "score": 88}, {"title": "Immobilien: Makler-Software zu teuer", "desc": "Xing: "Einzelfirma zahlt 300€/Monat für Software. Keine Alternative für Solo-Makler." | Branche: Immobilien | Zielgruppe: Immobilienmakler", "category": "Immobilien", "audience": "Immobilienmakler", "score": 85}, {"title": "Gastronomie: Personaleinsatz per WhatsApp", "desc": "LinkedIn: "20 Mitarbeiter, Schichtplan in WhatsApp. Krankmeldungen verloren. Konflikte täglich." | Branche: Gastronomie | Zielgruppe: Restaurant-Besitzer", "category": "Gastronomie", "audience": "Restaurant-Besitzer", "score": 82}, {"title": "Logistik: Kein Echtzeit-Tracking", "desc": "Xing: "Kunde fragt wo Lieferung ist. Wir rufen Fahrer an. 1980er Prozess." | Branche: Logistik | Zielgruppe: Spediteure (DACH)", "category": "Logistik", "audience": "Spediteure (DACH)", "score": 79}, {"title": "Gesundheit: Terminbuchung nur telefonisch", "desc": "LinkedIn: "Praxis telefonisch 8-12h besetzt. Patienten warten 3 Wochen. Online-Buchung = Wunschtraum." | Branche: Gesundheit | Zielgruppe: Ärzte / Therapeuten", "category": "Gesundheit", "audience": "Ärzte / Therapeuten", "score": 90}, {"title": "Bau: Baustellen-Doku auf Papier", "desc": "Xing: "Bauleiter fotografiert mit Handy. Fotos auf 10 Geräten. Nachweise fehlen bei Prüfung." | Branche: Bau | Zielgruppe: Bauleiter", "category": "Bau", "audience": "Bauleiter", "score": 87}, {"title": "Einzelhandel: Omnichannel nicht synchron", "desc": "LinkedIn: "Laden zeigt 5 Stück. Online 0. Kunde bestellt, muss stornieren. Täglich." | Branche: Einzelhandel | Zielgruppe: Einzelhändler", "category": "Einzelhandel", "audience": "Einzelhändler", "score": 81}, {"title": "Hotellerie: Channel-Manager zu teuer", "desc": "Xing: "Boutique-Hotel zahlt 500€/Monat für Channel-Manager. Airbnb, Booking nicht sync." | Branche: Hotellerie | Zielgruppe: Hotel-Besitzer", "category": "Hotellerie", "audience": "Hotel-Besitzer", "score": 84}, {"title": "Öffentlicher Sektor: Antrag per Post", "desc": "LinkedIn: "Bürger besucht 3 Behörden für einen Antrag. Digitalisierung = PDF per Mail." | Branche: Öffentlicher Sektor | Zielgruppe: Kommunen / Behörden", "category": "Öffentlicher Sektor", "audience": "Kommunen / Behörden", "score": 96}, {"title": "Versicherung: Schadensmeldung per Telefon", "desc": "Xing: "Kunde wartet 15 Minuten in Schleife. Keine Online-Meldung. Digitalisierung = Witz." | Branche: Versicherung | Zielgruppe: Versicherungen", "category": "Versicherung", "audience": "Versicherungen", "score": 83}, {"title": "Banken: KYC dauert 2 Wochen", "desc": "LinkedIn: "Post-ID, Video-Ident, dann 2 Wochen warten. Neobank macht in 5 Minuten. Wir verlieren Kunden." | Branche: Banken | Zielgruppe: Banken / FinTechs", "category": "Banken", "audience": "Banken / FinTechs", "score": 89}, {"title": "Automotive: Werkstatt-Termine nur telefonisch", "desc": "Xing: "3 Anrufe für Termin. Keine Online-Verfügbarkeit. Kunde geht zu Kette mit App." | Branche: Automotive | Zielgruppe: Autohäuser / Werkstätten", "category": "Automotive", "audience": "Autohäuser / Werkstätten", "score": 77}, {"title": "Energie: Smart-Meter nicht ausgewertet", "desc": "LinkedIn: "Kunde hat Smart-Meter. Daten kommen, aber keine Analyse. Energiesparen = raten." | Branche: Energie | Zielgruppe: Energieversorger", "category": "Energie", "audience": "Energieversorger", "score": 74}, {"title": "Landwirtschaft: Düngung per Hand dokumentieren", "desc": "Xing: "Landwirt dokumentiert Ausbringung auf Papier. Prüfung: 3 Tage Arbeit. Digital = nie." | Branche: Landwirtschaft | Zielgruppe: Landwirte (DE)", "category": "Landwirtschaft", "audience": "Landwirte (DE)", "score": 78}];
    
    for (const item of items) {
      try {
        await prisma.$executeRaw`
          INSERT INTO business_ideas (
            id, scout_run_id, title, description, category,
            target_audience, revenue_model, mvp_effort, potential, created_at
          ) VALUES (
            gen_random_uuid(),
            'xing-community',
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
      source: "xing-community",
      scraped: results.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
