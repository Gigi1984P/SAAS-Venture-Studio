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
  "too complicated", "too slow", "broken", "bug", "error", "frustrating",
  "not working", "confusing", "overwhelming", "expensive", "too much",
];

function extractPainSignals(text: string): { hasPain: boolean; painScore: number; matchedKeywords: string[] } {
  const lower = text.toLowerCase();
  const matched = PAIN_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
  const painScore = Math.min(10, matched.length * 2 + (lower.length < 200 ? 1 : 0));
  return { hasPain: matched.length >= 2, painScore, matchedKeywords: matched };
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

// ─── INDIE HACKERS SCRAPER ───
async function scrapeIndieHackers(): Promise<any[]> {
  const results: any[] = [];
  try {
    const res = await fetch("https://www.indiehackers.com/api/posts?category=ideas", {
      headers: { "Accept": "application/json", "User-Agent": "SaaSVentureStudio/1.0" },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      const posts = data.posts || data.results || [];
      for (const post of posts.slice(0, 15)) {
        const combined = `${post.title || ""} ${post.body || ""}`;
        const pain = extractPainSignals(combined);
        if (pain.hasPain || post.votes >= 5) {
          results.push({
            source: "indiehackers",
            sourceUrl: post.url || `https://www.indiehackers.com/post/${post.id || ""}`,
            sourceName: "Indie Hackers",
            title: (post.title || "Unbenannt").slice(0, 150),
            content: (post.body || post.title || "").slice(0, 1000),
            author: post.user?.name || "unknown",
            upvotes: post.votes || 0,
            comments: post.comments_count || 0,
            painScore: pain.painScore,
            painKeywords: pain.matchedKeywords,
            createdAt: post.created_at || new Date().toISOString(),
          });
        }
      }
    }
  } catch (e) {
    console.error("[Indie Hackers]", e);
  }
  return results;
}

// ─── STACK OVERFLOW SCRAPER ───
async function scrapeStackOverflow(tags: string[]): Promise<any[]> {
  const results: any[] = [];
  for (const tag of tags) {
    try {
      const res = await fetch(
        `https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&tagged=${encodeURIComponent(tag)}&site=stackoverflow&pagesize=15`,
        { headers: { "Accept": "application/json" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const q of data.items || []) {
        const combined = `${q.title} ${q.body || ""}`;
        const pain = extractPainSignals(combined);
        if (pain.hasPain || q.score >= 10) {
          results.push({
            source: "stackoverflow",
            sourceUrl: q.link,
            sourceName: `Stack Overflow [${tag}]`,
            title: q.title.slice(0, 150),
            content: (q.body || q.title).slice(0, 1000),
            author: q.owner?.display_name || "unknown",
            upvotes: q.score || 0,
            comments: q.answer_count || 0,
            painScore: pain.painScore + (q.score >= 20 ? 2 : 0),
            painKeywords: pain.matchedKeywords,
            createdAt: new Date(q.creation_date * 1000).toISOString(),
          });
        }
      }
    } catch (e) {
      console.error(`[StackOverflow ${tag}]`, e);
    }
  }
  return results;
}

// ─── PRODUCT HUNT SCRAPER ───
async function scrapeProductHunt(): Promise<any[]> {
  const results: any[] = [];
  try {
    const res = await fetch("https://www.producthunt.com/feed", {
      headers: { "Accept": "application/rss+xml", "User-Agent": "SaaSVentureStudio/1.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return results;
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
    if (itemMatches) {
      for (const item of itemMatches.slice(0, 10)) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/<[^\u003e]+>/g, "").trim();
          const pain = extractPainSignals(title);
          if (pain.hasPain) {
            results.push({
              source: "producthunt",
              sourceUrl: linkMatch?.[1] || "https://www.producthunt.com/",
              sourceName: "Product Hunt",
              title: title.slice(0, 150),
              content: title.slice(0, 500),
              author: "unknown",
              upvotes: 10,
              comments: 0,
              painScore: pain.painScore,
              painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[Product Hunt]", e);
  }
  return results;
}

// ─── HEISE DEUTSCHLAND SCRAPER ───
async function scrapeHeise(): Promise<any[]> {
  const results: any[] = [];
  try {
    const res = await fetch("https://www.heise.de/rss/heise-Rubrik-IT.rdf", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return results;
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
    if (itemMatches) {
      for (const item of itemMatches.slice(0, 15)) {
        const titleMatch = item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const descMatch = item.match(/<description>(.*?)<\/description>/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/<[^\u003e]+>/g, "").trim();
          const desc = (descMatch?.[1] || "").replace(/<[^\u003e]+>/g, "").trim();
          const combined = `${title} ${desc}`;
          const pain = extractPainSignals(combined);
          // B2B-Filter: Nur Artikel mit B2B-Relevanz
          const b2bKeywords = ["Software", "SaaS", "Cloud", "Digitalisierung", "IT-Sicherheit", "CRM", "ERP", "Workflow", "Automatisierung", "KI", "Datenschutz", "DGSVO", "Remote", "Homeoffice"];
          const hasB2B = b2bKeywords.some(kw => combined.toLowerCase().includes(kw.toLowerCase()));
          if ((pain.hasPain || hasB2B) && title.length > 20) {
            results.push({
              source: "heise",
              sourceUrl: linkMatch?.[1] || "https://www.heise.de",
              sourceName: "Heise Online (DE)",
              title: title.slice(0, 150),
              content: desc.slice(0, 800) || title.slice(0, 500),
              author: "Heise",
              upvotes: 10,
              comments: 0,
              painScore: pain.hasPain ? pain.painScore : 3,
              painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[Heise]", e);
  }
  return results;
}

// ─── DEUTSCHE STARTUPS SCRAPER ───
async function scrapeDeutscheStartups(): Promise<any[]> {
  const results: any[] = [];
  try {
    const res = await fetch("https://www.deutsche-startups.de/feed/", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return results;
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
    if (itemMatches) {
      for (const item of itemMatches.slice(0, 10)) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]\u003e<\/description>/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/<[^\u003e]+>/g, "").trim();
          const desc = (descMatch?.[1] || "").replace(/<[^\u003e]+>/g, "").trim();
          const pain = extractPainSignals(title + " " + desc);
          // Filtere Startup-News
          const startupRelevant = /startup|gründung|business|software|app|plattform|digital/i.test(title + " " + desc);
          if ((pain.hasPain || startupRelevant) && title.length > 15) {
            results.push({
              source: "deutsche-startups",
              sourceUrl: linkMatch?.[1] || "https://www.deutsche-startups.de",
              sourceName: "Deutsche Startups (DE)",
              title: title.slice(0, 150),
              content: desc.slice(0, 800) || title.slice(0, 500),
              author: "Deutsche Startups",
              upvotes: 5,
              comments: 0,
              painScore: pain.hasPain ? pain.painScore : 2,
              painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[Deutsche Startups]", e);
  }
  return results;
}

// ─── GOLEM DEUTSCHLAND SCRAPER ───
async function scrapeGolem(): Promise<any[]> {
  const results: any[] = [];
  try {
    const res = await fetch("https://rss.golem.de/rss.php?feed=ATOM1.0", {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/atom+xml" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return results;
    const xml = await res.text();
    const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g);
    if (entryMatches) {
      for (const entry of entryMatches.slice(0, 10)) {
        const titleMatch = entry.match(/<title[^\u003e]*>(.*?)<\/title>/);
        const linkMatch = entry.match(/<link[^\u003e]*href="([^"]+)"/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/<[^\u003e]+>/g, "").trim();
          const pain = extractPainSignals(title);
          const b2bRelevant = /software|cloud|sicherheit|daten|it-|digital|unternehmen|b2b/i.test(title);
          if ((pain.hasPain || b2bRelevant) && title.length > 20) {
            results.push({
              source: "golem",
              sourceUrl: linkMatch?.[1] || "https://www.golem.de",
              sourceName: "Golem.de (DE)",
              title: title.slice(0, 150),
              content: title.slice(0, 500),
              author: "Golem",
              upvotes: 8,
              comments: 0,
              painScore: pain.hasPain ? pain.painScore : 3,
              painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[Golem]", e);
  }
  return results;
}
function generateIdeaFromSignal(signal: any): any {
  const title = signal.title.slice(0, 100);
  const pain = signal.content.slice(0, 500);
  
  const categories: Record<string, string> = {
    "CRM": "CRM", "email": "Email Marketing", "invoice": "Finance",
    "contract": "Legal", "team": "Team Collaboration", "remote": "Remote Work",
    "meeting": "Productivity", "analytics": "Analytics", "AI": "AI Tools",
    "automation": "Automation", "chat": "Communication", "support": "Customer Support",
  };
  
  let category = "SaaS";
  for (const [key, val] of Object.entries(categories)) {
    if (signal.content.toLowerCase().includes(key.toLowerCase()) || signal.title.toLowerCase().includes(key.toLowerCase())) {
      category = val;
      break;
    }
  }
  
  const audiences: Record<string, string> = {
    hackernews: "Tech Startups & Founders",
    github: "Developers & Engineering Teams",
    indiehackers: "Indie Hackers & Solopreneurs",
    stackoverflow: "Software Developers",
    producthunt: "Early Adopters & Product People",
    heise: "DACH IT-Entscheider & Unternehmen",
    "deutsche-startups": "DACH Startup Gründer",
    golem: "DACH Tech Professionals",
  };
  
  return {
    title: title,
    description: pain,
    category: category,
    targetAudience: audiences[signal.source] || "SaaS Founders",
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
    // Solo-Modus: Keine Session-Prüfung nötig

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

    // PARALLELES SCRAPING — 8 Quellen (5 internationale + 3 deutsche)
    const [hnSignals, ghSignals, ihSignals, soSignals, phSignals, heiseSignals, dsSignals, golemSignals] = await Promise.all([
      scrapeHackerNews(["SaaS problem", "startup pain", "workflow automation", "developer tool", "selfhosted", "open source alternative"]),
      scrapeGitHub(["SaaS problem", "feature request", "need automation", "pain point", "workflow", "productivity"]),
      scrapeIndieHackers(),
      scrapeStackOverflow(["javascript", "python", "saas", "automation"]),
      scrapeProductHunt(),
      scrapeHeise(),
      scrapeDeutscheStartups(),
      scrapeGolem(),
    ]);

    const allSignals = [...hnSignals, ...ghSignals, ...ihSignals, ...soSignals, ...phSignals, ...heiseSignals, ...dsSignals, ...golemSignals];
    
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
        indiehackers: ihSignals.length,
        stackoverflow: soSignals.length,
        producthunt: phSignals.length,
        heise: heiseSignals.length,
        "deutsche-startups": dsSignals.length,
        golem: golemSignals.length,
      },
      ideas: savedIdeas.slice(0, 5),
    });

  } catch (error: any) {
    console.error("[REAL SCRAPER]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: "POST um echten Markt-Scraping zu starten",
    sources: [
      "HackerNews (Algolia API) — Tech-Startup-Probleme",
      "GitHub Issues (Search API) — Developer Pain Points",
      "Indie Hackers (Posts API) — Solopreneur-Ideen",
      "Stack Overflow (API) — Entwickler-Probleme",
      "Product Hunt (RSS Feed) — Neue Produkte & Nischen",
    ],
    features: [
      "Echte Posts, Issues und Fragen von Nutzern",
      "Pain Signal Erkennung via 25+ Keywords",
      "Automatische Kategorie-Zuordnung",
      "Quellenangabe mit Original-URL",
      "Pain Score 0-10 basierend auf Signal-Stärke",
    ],
  });
}
