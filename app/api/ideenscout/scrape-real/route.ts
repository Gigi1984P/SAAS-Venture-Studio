import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Pain-Keywords für Signal-Erkennung
const PAIN_KEYWORDS = [
  "pain", "problem", "struggle", "frustrated", "hate", "difficult", "challenge",
  "waste", "expensive", "manual", "boring", "time-consuming", "annoying",
  "wish", "would love", "need a tool", "looking for", "any recommendations",
  "tired of", "sick of", "can't find", "doesn't exist", "missing feature",
];

function extractPainSignals(text: string): { hasPain: boolean; painScore: number; matchedKeywords: string[] } {
  const lower = text.toLowerCase();
  const matched = PAIN_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
  const painScore = Math.min(10, matched.length * 2 + (lower.length < 200 ? 1 : 0));
  return { hasPain: matched.length >= 2, painScore, matchedKeywords: matched };
}

// ─── REDDIT SCRAPER ───
async function scrapeReddit(subreddits: string[]): Promise<any[]> {
  const results: any[] = [];
  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, {
        headers: { "User-Agent": "SaaSVentureStudio/1.0 (by /u/saas_venture)" },
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const posts = data.data?.children || [];
      for (const post of posts) {
        const p = post.data;
        const combined = `${p.title} ${p.selftext || ""}`;
        const pain = extractPainSignals(combined);
        if (pain.hasPain) {
          results.push({
            source: "reddit",
            sourceUrl: `https://reddit.com${p.permalink}`,
            sourceName: `r/${sub}`,
            title: p.title,
            content: p.selftext?.slice(0, 1000) || p.title,
            author: p.author,
            upvotes: p.ups || 0,
            comments: p.num_comments || 0,
            painScore: pain.painScore,
            painKeywords: pain.matchedKeywords,
            createdAt: new Date(p.created_utc * 1000).toISOString(),
          });
        }
      }
    } catch (e) {
      console.error(`[Reddit r/${sub}]`, e);
    }
  }
  return results;
}

// ─── HACKERNEWS SCRAPER ───
async function scrapeHackerNews(queries: string[]): Promise<any[]> {
  const results: any[] = [];
  for (const query of queries) {
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`,
        { headers: { "User-Agent": "SaaSVentureStudio/1.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const hit of data.hits || []) {
        const combined = `${hit.title} ${hit.story_text || ""}`;
        const pain = extractPainSignals(combined);
        if (pain.hasPain || hit.points >= 10) {
          results.push({
            source: "hackernews",
            sourceUrl: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            sourceName: "HackerNews",
            title: hit.title,
            content: (hit.story_text || hit.title)?.slice(0, 1000) || "",
            author: hit.author || "unknown",
            upvotes: hit.points || 0,
            comments: hit.num_comments || 0,
            painScore: pain.painScore,
            painKeywords: pain.matchedKeywords,
            createdAt: hit.created_at || new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.error(`[HN ${query}]`, e);
    }
  }
  return results;
}

// ─── GITHUB SCRAPER ───
async function scrapeGitHub(queries: string[]): Promise<any[]> {
  const results: any[] = [];
  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(query)}+is:issue+is:open+sort:comments-desc&per_page=10`,
        { headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "SaaSVentureStudio/1.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const issue of data.items || []) {
        const combined = `${issue.title} ${issue.body || ""}`;
        const pain = extractPainSignals(combined);
        if (pain.hasPain || issue.comments >= 5) {
          results.push({
            source: "github",
            sourceUrl: issue.html_url,
            sourceName: `GitHub ${issue.repository_url?.split("/").pop() || "unknown"}`,
            title: issue.title,
            content: (issue.body || issue.title)?.slice(0, 1000) || "",
            author: issue.user?.login || "unknown",
            upvotes: issue.reactions?.["+1"] || 0,
            comments: issue.comments || 0,
            painScore: pain.painScore + (issue.comments >= 10 ? 2 : 0),
            painKeywords: pain.matchedKeywords,
            createdAt: issue.created_at || new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.error(`[GitHub ${query}]`, e);
    }
  }
  return results;
}

// ─── BUSINESS IDEA GENERATION ───
function generateIdeaFromSignal(signal: any): any {
  const title = signal.title.slice(0, 100);
  const pain = signal.content.slice(0, 500);
  
  // Einfache Kategorie-Zuordnung
  const categories: Record<string, string> = {
    "CRM": "CRM",
    "email": "Email Marketing",
    "invoice": "Finance",
    "contract": "Legal",
    "team": "Team Collaboration",
    "remote": "Remote Work",
    "meeting": "Productivity",
    "analytics": "Analytics",
    "AI": "AI Tools",
    "automation": "Automation",
    "chat": "Communication",
    "support": "Customer Support",
  };
  
  let category = "SaaS";
  for (const [key, val] of Object.entries(categories)) {
    if (signal.content.toLowerCase().includes(key.toLowerCase()) || signal.title.toLowerCase().includes(key.toLowerCase())) {
      category = val;
      break;
    }
  }
  
  return {
    title: title,
    description: pain,
    category: category,
    targetAudience: signal.source === "reddit" ? "Reddit Community" : signal.source === "hackernews" ? "Tech Startups" : "Developers",
    revenueModel: "SaaS-Abonnement (€29-99/Monat)",
    mvpEffort: signal.painScore >= 6 ? "medium" : "low",
    potential: signal.upvotes >= 50 ? "high" : signal.upvotes >= 10 ? "medium" : "low",
    source: signal.source,
    sourceUrl: signal.sourceUrl,
    painScore: signal.painScore,
    painKeywords: signal.painKeywords.join(", "),
  };
}

// ─── MAIN API ───
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { agentId = "ideen-scout", maxIdeas = 20 } = await req.json().catch(() => ({}));

    // ScoutRun finden oder erstellen
    let scoutRun = await prisma.scoutRun.findFirst({
      where: { agentId },
      orderBy: { createdAt: "desc" },
    });

    if (!scoutRun) {
      scoutRun = await prisma.scoutRun.create({
        data: { agentId, status: "running", intervalSec: 300 },
      });
    } else {
      await prisma.scoutRun.update({
        where: { id: scoutRun.id },
        data: { status: "running" },
      });
    }

    // PARALLELES SCRAPING (ohne Reddit — blockiert ohne Auth)
    const [hnSignals, ghSignals] = await Promise.all([
      scrapeHackerNews(["SaaS problem", "startup pain", "workflow automation", "developer tool", "selfhosted", "open source alternative"]),
      scrapeGitHub(["SaaS problem", "feature request", "need automation", "pain point", "workflow", "productivity"]),
    ]);

    const allSignals = [...hnSignals, ...ghSignals];
    
    // Nach Pain Score sortieren, Top N nehmen
    const topSignals = allSignals
      .sort((a, b) => b.painScore - a.painScore)
      .slice(0, maxIdeas);

    // In BusinessIdeas umwandeln und speichern
    const savedIdeas = [];
    for (const signal of topSignals) {
      const idea = generateIdeaFromSignal(signal);
      const saved = await prisma.businessIdea.create({
        data: {
          scoutRunId: scoutRun.id,
          title: idea.title,
          description: idea.description,
          category: idea.category,
          targetAudience: idea.targetAudience,
          revenueModel: idea.revenueModel,
          mvpEffort: idea.mvpEffort,
          potential: idea.potential,
          source: signal.source,
          sourceUrl: signal.sourceUrl,
          painScore: signal.painScore,
          painKeywords: signal.painKeywords.join(", "),
        },
      });
      savedIdeas.push({ ...saved, source: signal.source, sourceUrl: signal.sourceUrl, painScore: signal.painScore });
    }

    // ScoutRun updaten
    await prisma.scoutRun.update({
      where: { id: scoutRun.id },
      data: {
        totalIdeas: { increment: savedIdeas.length },
        lastRunAt: new Date(),
        status: "stopped",
      },
    });

    return NextResponse.json({
      success: true,
      scoutRunId: scoutRun.id,
      totalSignals: allSignals.length,
      ideasGenerated: savedIdeas.length,
      sources: {
        hackernews: hnSignals.length,
        github: ghSignals.length,
      },
      ideas: savedIdeas.slice(0, 5), // Top 5 zurückgeben
    });

  } catch (error: any) {
    console.error("[REAL SCRAPER]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: "POST um echten Markt-Scraping zu starten",
    sources: ["Reddit (r/SaaS, r/startups, r/smallbusiness)", "HackerNews (Algolia API)", "GitHub Issues (Search API)"],
    features: [
      "Echte Posts und Issues von Nutzern",
      "Pain Signal Erkennung via Keywords",
      "Automatische Kategorie-Zuordnung",
      "Quellenangabe mit Original-URL",
    ],
  });
}
