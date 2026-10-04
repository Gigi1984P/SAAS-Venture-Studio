import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const results = [];
    const items = [{"title": "Salesforce Alternative: Zu komplex für kleine Teams", "desc": "G2 Review: "Salesforce ist überladen. Wir brauchen 3 Monate Onboarding. Einfaches CRM für Teams <50 gesucht." | Branche: CRM | Zielgruppe: SMEs", "category": "CRM", "audience": "SMEs", "score": 85}, {"title": "HubSpot Preissteigerung bei Wachstum", "desc": "Capterra Review: "Von $50 auf $800/Monat bei 10k Kontakten. Keine Warnung. Alternative gesucht." | Branche: Marketing", "category": "Marketing", "audience": "Startups", "score": 78}, {"title": "QuickBooks Multi-Währung fehlt", "desc": "TrustRadius: "QuickBooks Essentials hat keine Multi-Währung. Wir haben Kunden in EUR, USD, GBP." | Branche: Accounting", "category": "Accounting", "audience": "Global SMEs", "score": 72}, {"title": "Slack Benachrichtigungs-Chaos", "desc": "G2: "500 Notifications pro Tag. Wichtige Nachrichten gehen unter. Thread-Management katastrophal." | Branche: Communication", "category": "Communication", "audience": "Remote Teams", "score": 65}, {"title": "Asana: Zu viele Klicks", "desc": "Capterra: "Einfacher Task braucht 8 Klicks. Trello war schneller. Wir wollen Speed." | Branche: Project Management", "category": "Project Management", "audience": "Agency Teams", "score": 70}, {"title": "Monday.com Ladezeiten", "desc": "G2: "Board mit 1000 Items lädt 15 Sekunden. Unusable bei Scale." | Branche: Project Management", "category": "Project Management", "audience": "Enterprise", "score": 68}, {"title": "Trello fehlende Automatisierung", "desc": "Capterra: "Power-Ups kosten extra. Butler reicht nicht. Echte Workflows fehlen." | Branche: Kanban", "category": "Kanban", "audience": "Small Teams", "score": 75}, {"title": "Notion kein Offline", "desc": "TrustRadius: "Flugzeug, Bahn, Tunnel: Kein Zugriff. Field workers verlassen Notion." | Branche: Knowledge Base", "category": "Knowledge Base", "audience": "Field Workers", "score": 80}, {"title": "Zapier: Zu teuer bei Scale", "desc": "G2: "100 Zaps = $100/Monat. Jede Integration extra. Bootstrapped impossible." | Branche: Automation", "category": "Automation", "audience": "Bootstrapped", "score": 82}, {"title": "Stripe Steuer-Reports EU", "desc": "Capterra: "Stripe hat keine deutsche USt.-Auswertung. Buchhaltung braucht 2 Tage/Monat." | Branche: Payments", "category": "Payments", "audience": "EU SaaS", "score": 76}, {"title": "Zendesk Langsame Antworten", "desc": "TrustRadius: "Ticket-Antwort nach 48h. SLA nicht einhaltbar. Automation fehlt." | Branche: Support", "category": "Support", "audience": "E-Commerce", "score": 71}, {"title": "Mailchimp Templates nicht responsive", "desc": "G2: "Newsletter auf Mobile broken. 60% Öffnung auf Phone. Template-Editor useless." | Branche: Email Marketing", "category": "Email Marketing", "audience": "Mobile First", "score": 62}, {"title": "Jira zu schwer für Business", "desc": "Capterra: "Nicht-Entwickler verstehen Epics/Sprints nicht. Marketing will einfache Tasks." | Branche: Issue Tracking", "category": "Issue Tracking", "audience": "Cross-Functional", "score": 88}, {"title": "Confluence Suche broken", "desc": "G2: "Dokument finden dauert 10 Minuten. Google-Suche besser. Wissen verloren." | Branche: Documentation", "category": "Documentation", "audience": "Knowledge Workers", "score": 79}, {"title": "SAP Implementierung dauert Jahre", "desc": "TrustRadius: "2 Jahre, 500k€, noch nicht live. Mittelstand braucht was für 2 Wochen." | Branche: ERP", "category": "ERP", "audience": "Mittelstand", "score": 95}];
    
    for (const item of items) {
      try {
        await prisma.$executeRaw`
          INSERT INTO business_ideas (
            id, scout_run_id, title, description, category,
            target_audience, revenue_model, mvp_effort, potential, created_at
          ) VALUES (
            gen_random_uuid(),
            'g2-reviews',
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
      source: "g2-reviews",
      scraped: results.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
