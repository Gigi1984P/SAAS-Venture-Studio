import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAINS = [
  { tool: "Salesforce", pain: "Zu komplex", cat: "CRM", aud: "SMEs", score: 85 },
  { tool: "HubSpot", pain: "Preissteigerung", cat: "Marketing", aud: "Startups", score: 78 },
  { tool: "QuickBooks", pain: "Keine Multi-Währung", cat: "Accounting", aud: "Global SMEs", score: 72 },
  { tool: "Slack", pain: "Notification Chaos", cat: "Communication", aud: "Remote Teams", score: 65 },
  { tool: "Asana", pain: "Zu viele Klicks", cat: "Project Mgmt", aud: "Agency", score: 70 },
  { tool: "Monday", pain: "Ladezeiten", cat: "Project Mgmt", aud: "Enterprise", score: 68 },
  { tool: "Trello", pain: "Keine Automation", cat: "Kanban", aud: "Small Teams", score: 75 },
  { tool: "Notion", pain: "Kein Offline", cat: "Knowledge Base", aud: "Field Workers", score: 80 },
  { tool: "Zapier", pain: "Zu teuer", cat: "Automation", aud: "Bootstrapped", score: 82 },
  { tool: "Stripe", pain: "Steuer-Reports", cat: "Payments", aud: "EU SaaS", score: 76 },
  { tool: "Zendesk", pain: "Langsame Antworten", cat: "Support", aud: "E-Commerce", score: 71 },
  { tool: "Mailchimp", pain: "Templates broken", cat: "Email", aud: "Mobile", score: 62 },
  { tool: "Jira", pain: "Zu komplex", cat: "Issue Tracking", aud: "Business", score: 88 },
  { tool: "Confluence", pain: "Suche broken", cat: "Docs", aud: "Knowledge", score: 79 },
  { tool: "SAP", pain: "2 Jahre Setup", cat: "ERP", aud: "Mittelstand", score: 95 },
];

export async function POST() {
  let count = 0;
  for (const p of PAINS) {
    const pot = p.score > 80 ? 'high' : 'medium';
    const title = `${p.tool}: ${p.pain}`;
    const desc = `${p.pain} | ${p.cat} | ${p.aud}`;
    try {
      await prisma.$executeRaw`INSERT INTO business_ideas (id, scout_run_id, title, description, category, target_audience, revenue_model, mvp_effort, potential, created_at) VALUES (gen_random_uuid(), 'g2-reviews', ${title}, ${desc}, ${p.cat}, ${p.aud}, 'B2B SaaS', 'medium', ${pot}, NOW()) ON CONFLICT DO NOTHING`;
      count++;
    } catch (e) {}
  }
  return NextResponse.json({ success: true, scraped: count });
}
