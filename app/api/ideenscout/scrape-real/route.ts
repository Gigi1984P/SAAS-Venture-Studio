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


// ─── REDDIT SCRAPER (branchenübergreifend) ───
async function scrapeReddit(subreddits: string[]): Promise<any[]> {
  const results: any[] = [];
  for (const sub of subreddits) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/top.json?t=week&limit=15`,
        { headers: { "User-Agent": "Mozilla/5.0 SaaSVentureStudio/1.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const post of data.data?.children || []) {
        const p = post.data;
        if (!p) continue;
        const combined = `${p.title} ${p.selftext || ""}`;
        const pain = extractPainSignals(combined);
        if (pain.hasPain || p.score >= 20) {
          results.push({
            source: `reddit-${sub}`,
            sourceUrl: `https://www.reddit.com${p.permalink}`,
            sourceName: `Reddit r/${sub}`,
            title: p.title.slice(0, 150),
            content: (p.selftext || p.title).slice(0, 1000),
            author: p.author || "unknown",
            upvotes: p.score || 0,
            comments: p.num_comments || 0,
            painScore: pain.painScore + (p.score >= 50 ? 2 : 0),
            painKeywords: pain.matchedKeywords,
            createdAt: new Date(p.created_utc * 1000).toISOString(),
          });
        }
      }
    } catch (e) {
      console.error(`[Reddit ${sub}]`, e);
    }
  }
  return results;
}

// ─── G2 REVIEWS (SaaS Pain Points) ───
async function scrapeG2Reviews(): Promise<any[]> {
  const results: any[] = [];
  const categories = ["project-management", "crm", "accounting-software", "hr-management"];
  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://www.g2.com/categories/${cat}?order=g2_score`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const html = await res.text();
      const reviewTexts = html.match(/"reviewBody":"([^"]+)"/g);
      if (reviewTexts) {
        for (let i = 0; i < Math.min(reviewTexts.length, 5); i++) {
          const text = reviewTexts[i].replace('"reviewBody":"', '').replace('"', '');
          const pain = extractPainSignals(text);
          if (pain.hasPain) {
            results.push({
              source: "g2", sourceUrl: `https://www.g2.com/categories/${cat}`,
              sourceName: `G2 ${cat.replace(/-/g, ' ')}`,
              title: `G2 Review: Pain Point in ${cat.replace(/-/g, ' ')}`,
              content: text.slice(0, 1000), author: "unknown",
              upvotes: 5, comments: 0, painScore: pain.painScore,
              painKeywords: pain.matchedKeywords, createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) { console.error(`[G2 ${cat}]`, e); }
  }
  return results;
}

// ─── TRUSTPILOT BUSINESS REVIEWS ───
async function scrapeTrustpilot(): Promise<any[]> {
  const results: any[] = [];
  const domains = ["www.salesforce.com", "www.hubspot.com", "www.slack.com", "www.zoom.us"];
  for (const domain of domains) {
    try {
      const res = await fetch(
        `https://www.trustpilot.com/review/${domain}?sort=recency`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const html = await res.text();
      const reviewMatches = html.match(/<p[^>]*class="typography_body[^"]*"[^>]*>(.*?)<\/p>/g);
      if (reviewMatches) {
        for (const match of reviewMatches.slice(0, 5)) {
          const text = match.replace(/<[^>]+>/g, '').trim();
          const pain = extractPainSignals(text);
          if (pain.hasPain && text.length > 50) {
            results.push({
              source: "trustpilot", sourceUrl: `https://www.trustpilot.com/review/${domain}`,
              sourceName: `Trustpilot ${domain.replace('www.', '')}`,
              title: `Review: ${domain.replace('www.', '')}`, content: text.slice(0, 800),
              author: "unknown", upvotes: 3, comments: 0,
              painScore: pain.painScore, painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) { console.error(`[Trustpilot ${domain}]`, e); }
  }
  return results;
}

// ─── DEV.TO COMMUNITY ───
async function scrapeDevTo(): Promise<any[]> {
  const results: any[] = [];
  const tags = ["saas", "startup", "productivity", "automation", "b2b"];
  for (const tag of tags) {
    try {
      const res = await fetch(
        `https://dev.to/api/articles?tag=${tag}&top=7&per_page=10`,
        { headers: { "Accept": "application/json", "User-Agent": "SaaSVentureStudio/1.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const post of data || []) {
        const combined = `${post.title || ""} ${post.description || ""}`;
        const pain = extractPainSignals(combined);
        if (pain.hasPain || (post.positive_reactions_count || 0) >= 10) {
          results.push({
            source: "devto", sourceUrl: post.url || `https://dev.to`,
            sourceName: `DEV.to #${tag}`, title: (post.title || "Unbenannt").slice(0, 150),
            content: (post.description || post.title || "").slice(0, 1000),
            author: post.user?.username || "unknown",
            upvotes: post.positive_reactions_count || 0, comments: post.comments_count || 0,
            painScore: pain.painScore, painKeywords: pain.matchedKeywords,
            createdAt: post.published_at || new Date().toISOString(),
          });
        }
      }
    } catch (e) { console.error(`[Dev.to ${tag}]`, e); }
  }
  return results;
}

// ─── T3N (DACH Tech/Startup) ───
async function scrapeT3N(): Promise<any[]> {
  const results: any[] = [];
  try {
    const res = await fetch("https://t3n.de/rss.xml", {
      headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 },
    });
    if (!res.ok) return results;
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
    if (itemMatches) {
      for (const item of itemMatches.slice(0, 10)) {
        const titleMatch = item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
          const pain = extractPainSignals(title);
          const b2bRelevant = /digital|saas|cloud|ki|automation|workflow|b2b|unternehmen/i.test(title);
          if ((pain.hasPain || b2bRelevant) && title.length > 20) {
            results.push({
              source: "t3n", sourceUrl: linkMatch?.[1] || "https://t3n.de",
              sourceName: "t3n (DE)", title: title.slice(0, 150), content: title.slice(0, 500),
              author: "t3n", upvotes: 6, comments: 0,
              painScore: pain.hasPain ? pain.painScore : 3,
              painKeywords: pain.matchedKeywords, createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (e) { console.error("[T3N]", e); }
  return results;
}

// ─── GRÜNDERSZENE (DACH Startup) ───
async function scrapeGruenderszene(): Promise<any[]> {
  const results: any[] = [];
  try {
    const res = await fetch("https://www.gruenderszene.de/feed", {
      headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 },
    });
    if (!res.ok) return results;
    const xml = await res.text();
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
    if (itemMatches) {
      for (const item of itemMatches.slice(0, 10)) {
        const titleMatch = item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
          const pain = extractPainSignals(title);
          const startupRelevant = /startup|gründer|finanzierung|investor|business|saas/i.test(title);
          if ((pain.hasPain || startupRelevant) && title.length > 15) {
            results.push({
              source: "gruenderszene", sourceUrl: linkMatch?.[1] || "https://www.gruenderszene.de",
              sourceName: "Gründerszene (DE)", title: title.slice(0, 150), content: title.slice(0, 500),
              author: "Gründerszene", upvotes: 5, comments: 0,
              painScore: pain.hasPain ? pain.painScore : 2,
              painKeywords: pain.matchedKeywords, createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch (e) { console.error("[Gründerszene]", e); }
  return results;
}

// ─── GETAPP (B2B Software Reviews) ───
async function scrapeGetApp(): Promise<any[]> {
  const results: any[] = [];
  const categories = ["project-management", "accounting", "inventory-management", "erp"];
  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://www.getapp.com/${cat}-software/`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const html = await res.text();
      const reviewMatches = html.match(/"reviewText":"([^"]{50,500})"/g);
      if (reviewMatches) {
        for (const match of reviewMatches.slice(0, 3)) {
          const text = match.replace('"reviewText":"', '').replace('"', '');
          const pain = extractPainSignals(text);
          if (pain.hasPain) {
            results.push({
              source: "getapp", sourceUrl: `https://www.getapp.com/${cat}-software/`,
              sourceName: `GetApp ${cat}`, title: `GetApp Review: ${cat}`,
              content: text.slice(0, 1000), author: "unknown", upvotes: 4, comments: 0,
              painScore: pain.painScore, painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) { console.error(`[GetApp ${cat}]`, e); }
  }
  return results;
}

// ─── SOFTWARE ADVICE (B2B Reviews) ───
async function scrapeSoftwareAdvice(): Promise<any[]> {
  const results: any[] = [];
  const categories = ["human-capital-management", "supply-chain-management", "business-intelligence"];
  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://www.softwareadvice.com/${cat}/`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const html = await res.text();
      const consMatches = html.match(/"cons":"([^"]{30,300})"/g);
      if (consMatches) {
        for (const match of consMatches.slice(0, 4)) {
          const text = match.replace('"cons":"', '').replace('"', '');
          const pain = extractPainSignals(text);
          if (pain.hasPain) {
            results.push({
              source: "software-advice", sourceUrl: `https://www.softwareadvice.com/${cat}/`,
              sourceName: `Software Advice ${cat.split('-').join(' ')}`,
              title: `Software Advice: Pain in ${cat.split('-').join(' ')}`,
              content: text.slice(0, 1000), author: "unknown", upvotes: 4, comments: 0,
              painScore: pain.painScore, painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) { console.error(`[SoftwareAdvice ${cat}]`, e); }
  }
  return results;
}

// ─── MEDIUM (branchenübergreifend via RSS) ───
async function scrapeMedium(): Promise<any[]> {
  const results: any[] = [];
  const tags = ["saas", "b2b-sales", "startup-lessons", "product-management"];
  for (const tag of tags) {
    try {
      const res = await fetch(
        `https://medium.com/feed/tag/${tag}`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
      if (itemMatches) {
        for (const item of itemMatches.slice(0, 8)) {
          const titleMatch = item.match(/<title>(.*?)<\/title>/);
          const linkMatch = item.match(/<link>(.*?)<\/link>/);
          if (titleMatch) {
            const title = titleMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
            const pain = extractPainSignals(title);
            if (pain.hasPain) {
              results.push({
                source: "medium", sourceUrl: linkMatch?.[1] || `https://medium.com/tag/${tag}`,
                sourceName: `Medium #${tag}`, title: title.slice(0, 150), content: title.slice(0, 500),
                author: "unknown", upvotes: 8, comments: 0,
                painScore: pain.painScore, painKeywords: pain.matchedKeywords,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (e) { console.error(`[Medium ${tag}]`, e); }
  }
  return results;
}

// ─── GENERIC RSS SCRAPER ───
async function scrapeRSS(feeds: string[], industryLabel: string): Promise<any[]> {
  const results: any[] = [];
  for (const url of feeds) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      // Versuche <item> oder <entry>
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || xml.match(/<entry>[\s\S]*?<\/entry>/g);
      if (!itemMatches) continue;
      for (const item of itemMatches.slice(0, 5)) {
        const titleMatch = item.match(/<title>(.*?)<\/title>/) || item.match(/<title[^>]*>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/) || item.match(/<link[^>]*href="([^"]+)"/);
        const descMatch = item.match(/<description>(.*?)<\/description>/) || item.match(/<summary>(.*?)<\/summary>/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
          const desc = (descMatch?.[1] || "").replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
          const combined = `${title} ${desc}`;
          const pain = extractPainSignals(combined);
          if (pain.hasPain || title.length > 20) {
            results.push({
              source: "rss",
              sourceUrl: linkMatch?.[1] || url,
              sourceName: `${industryLabel} RSS`,
              title: title.slice(0, 150),
              content: (desc || title).slice(0, 800),
              author: "unknown",
              upvotes: 3,
              comments: 0,
              painScore: pain.hasPain ? pain.painScore : 2,
              painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      // Feed unreachable — silent skip
    }
  }
  return results;
}

// ─── X / TWITTER VIA NITTER RSS ───
async function scrapeXTwitter(): Promise<any[]> {
  const results: any[] = [];
  const queries = ["#SaaS problem", "#B2B pain", "#startup struggle", "#workflow automation"];
  const nitterInstances = ["https://nitter.net", "https://nitter.cz", "https://nitter.privacydev.net"];
  for (const query of queries) {
    for (const base of nitterInstances) {
      try {
        const res = await fetch(`${base}/search/rss?f=tweets&q=${encodeURIComponent(query)}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 0 },
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
        if (!itemMatches) continue;
        for (const item of itemMatches.slice(0, 5)) {
          const titleMatch = item.match(/<title>(.*?)<\/title>/);
          const linkMatch = item.match(/<link>(.*?)<\/link>/);
          if (titleMatch) {
            const title = titleMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
            const pain = extractPainSignals(title);
            if (pain.hasPain) {
              results.push({
                source: "x-twitter",
                sourceUrl: linkMatch?.[1] || `${base}/search?q=${encodeURIComponent(query)}`,
                sourceName: "X / Twitter",
                title: title.slice(0, 150),
                content: title.slice(0, 500),
                author: "unknown",
                upvotes: 2,
                comments: 0,
                painScore: pain.painScore,
                painKeywords: pain.matchedKeywords,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
        break; // Erste funktionierende Nitter-Instanz nutzen
      } catch (e) {
        continue;
      }
    }
  }
  return results;
}

// ─── QUORA VIA RSS (topics) ───
async function scrapeQuora(): Promise<any[]> {
  const results: any[] = [];
  const topics = ["SaaS", "Business-Software", "Small-Business", "Startup-Advice"];
  for (const topic of topics) {
    try {
      const res = await fetch(
        `https://www.quora.com/topic/${topic}/rss`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 0 } }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g);
      if (!itemMatches) continue;
      for (const item of itemMatches.slice(0, 5)) {
        const titleMatch = item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        if (titleMatch) {
          const title = titleMatch[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
          const pain = extractPainSignals(title);
          if (pain.hasPain) {
            results.push({
              source: "quora",
              sourceUrl: linkMatch?.[1] || `https://www.quora.com/topic/${topic}`,
              sourceName: `Quora ${topic}`,
              title: title.slice(0, 150),
              content: title.slice(0, 500),
              author: "unknown",
              upvotes: 4,
              comments: 0,
              painScore: pain.painScore,
              painKeywords: pain.matchedKeywords,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (e) {
      // Quora blockiert oft
    }
  }
  return results;
}
// ─── KI-ÜBERSETZUNG (DeepSeek via OpenRouter) ───
async function translateIdeaWithAI(title: string, description: string): Promise<{ title: string; description: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OLLAMA_API_KEY;
  if (!apiKey) {
    console.warn("[TRANSLATE] Kein API-Key gefunden — Fallback auf Keyword-Übersetzung");
    return { title: translateToGerman(title), description: translateToGerman(description) };
  }

  try {
    const prompt = `Übersetze folgenden SaaS-Geschäftsideen-Titel und Beschreibung FLÜSSIG und NATÜRLICH ins Deutsche. Behalte Fachbegriffe wie SaaS, API, KI, Workflow bei, aber übersetze den Satzfluss vollständig.

Titel (Englisch): ${title}
Beschreibung (Englisch): ${description}

Gib NUR dieses JSON zurück (keine Markdown, keine Erklärungen):
{"title": "...", "description": "..."}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://saas-venture-studio.vercel.app",
        "X-Title": "SaaS Venture Studio",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("[TRANSLATE] OpenRouter Fehler:", response.status, await response.text());
      return { title: translateToGerman(title), description: translateToGerman(description) };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // JSON parsen
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title?.slice(0, 100) || translateToGerman(title),
        description: parsed.description?.slice(0, 500) || translateToGerman(description),
      };
    }

    return { title: translateToGerman(title), description: translateToGerman(description) };
  } catch (error: any) {
    console.error("[TRANSLATE] Fehler:", error.message);
    return { title: translateToGerman(title), description: translateToGerman(description) };
  }
}

// ─── DEUTSCHER OFFLINE-ÜBERSETZER (Fallback) ───
const EN_DE: Record<string, string> = {
  // SaaS / Tech
  "saas": "SaaS", "software": "Software", "platform": "Plattform", "tool": "Tool",
  "solution": "Lösung", "product": "Produkt", "service": "Dienst", "app": "App",
  "application": "Anwendung", "system": "System", "program": "Programm",
  // Geschäft
  "business": "Geschäft", "startup": "Startup", "company": "Unternehmen",
  "enterprise": "Unternehmen", "customer": "Kunde", "client": "Kunde",
  "user": "Nutzer", "buyer": "Käufer", "seller": "Verkäufer",
  "market": "Markt", "industry": "Branche", "sector": "Sektor",
  "revenue": "Umsatz", "profit": "Gewinn", "cost": "Kosten",
  "price": "Preis", "pricing": "Preisgestaltung", "subscription": "Abonnement",
  "payment": "Zahlung", "billing": "Abrechnung", "invoice": "Rechnung",
  // Probleme / Pain
  "problem": "Problem", "pain": "Schmerz", "frustration": "Frustration",
  "issue": "Problem", "bug": "Fehler", "error": "Fehler",
  "broken": "kaputt", "slow": "langsam", "fast": "schnell",
  "manual": "manuell", "automatic": "automatisch", "automated": "automatisiert",
  "difficult": "schwierig", "easy": "einfach", "hard": "hart",
  "waste": "Verschwendung", "wasting": "verschwendet", "time": "Zeit",
  "money": "Geld", "resource": "Ressource", "effort": "Aufwand",
  // Arbeit
  "work": "Arbeit", "job": "Aufgabe", "task": "Aufgabe", "project": "Projekt",
  "team": "Team", "employee": "Mitarbeiter", "manager": "Manager",
  "remote": "Remote", "office": "Büro", "meeting": "Besprechung",
  "collaboration": "Zusammenarbeit", "communication": "Kommunikation",
  "email": "E-Mail", "message": "Nachricht", "notification": "Benachrichtigung",
  // Daten
  "data": "Daten", "information": "Information", "analytics": "Analyse",
  "report": "Bericht", "dashboard": "Dashboard", "metric": "Kennzahl",
  "tracking": "Tracking", "monitoring": "Überwachung", "logging": "Protokollierung",
  // KI / Automation
  "ai": "KI", "artificial intelligence": "Künstliche Intelligenz",
  "machine learning": "Maschinelles Lernen", "ml": "ML",
  "automation": "Automatisierung", "workflow": "Workflow",
  "integration": "Integration", "api": "API", "bot": "Bot",
  // Marketing / Vertrieb
  "marketing": "Marketing", "sales": "Vertrieb", "lead": "Lead",
  "conversion": "Konversion", "funnel": "Trichter", "campaign": "Kampagne",
  "seo": "SEO", "social media": "Social Media", "content": "Inhalt",
  // Entwicklung
  "developer": "Entwickler", "code": "Code", "coding": "Programmierung",
  "programming": "Programmierung", "deployment": "Deployment",
  "testing": "Testen", "debugging": "Fehlersuche", "devops": "DevOps",
  "frontend": "Frontend", "backend": "Backend", "fullstack": "Fullstack",
  // Security
  "security": "Sicherheit", "privacy": "Datenschutz", "gdpr": "DSGVO",
  "compliance": "Compliance", "encryption": "Verschlüsselung",
  // Support
  "support": "Support", "help": "Hilfe", "guide": "Anleitung",
  "documentation": "Dokumentation", "tutorial": "Tutorial",
  "faq": "FAQ", "ticket": "Ticket", "chat": "Chat",
  // Zustände
  "new": "neu", "old": "alt", "good": "gut", "bad": "schlecht",
  "better": "besser", "best": "beste", "great": "großartig",
  "awesome": "toll", "amazing": "erstaunlich", "terrible": "schrecklich",
  // Verben
  "create": "erstellen", "build": "bauen", "make": "machen",
  "manage": "verwalten", "organize": "organisieren", "track": "verfolgen",
  "monitor": "überwachen", "analyze": "analysieren", "report": "berichten",
  "send": "senden", "receive": "empfangen", "share": "teilen",
  "export": "exportieren", "import": "importieren", "sync": "synchronisieren",
  "integrate": "integrieren", "connect": "verbinden", "automate": "automatisieren",
  // Phrasen
  "customer support": "Kundensupport", "customer service": "Kundenservice",
  "project management": "Projektmanagement", "task management": "Aufgabenverwaltung",
  "team collaboration": "Teamzusammenarbeit", "remote work": "Remote-Arbeit",
  "time tracking": "Zeiterfassung", "expense tracking": "Ausgabenverfolgung",
  "workflow automation": "Workflow-Automatisierung", "data analysis": "Datenanalyse",
  "business intelligence": "Business Intelligence", "sales pipeline": "Vertriebspipeline",
  "email marketing": "E-Mail-Marketing", "social media management": "Social Media Management",
  "content management": "Content Management", "document management": "Dokumentenmanagement",
  "knowledge base": "Wissensdatenbank", "help desk": "Helpdesk",
  "human resources": "Personalwesen", "hr": "HR", "payroll": "Gehaltsabrechnung",
  "inventory management": "Lagerverwaltung", "supply chain": "Lieferkette",
  "accounting": "Buchhaltung", "bookkeeping": "Buchführung",
  "invoice generation": "Rechnungserstellung", "payment processing": "Zahlungsabwicklung",
  "subscription billing": "Abonnement-Abrechnung", "recurring payment": " wiederkehrende Zahlung",
  "user onboarding": "Nutzer-Onboarding", "user experience": "Nutzererfahrung",
  "customer journey": "Kundenreise", "conversion rate": "Konversionsrate",
  "churn rate": "Abwanderungsrate", "lifetime value": "Lebenszeitwert",
  "monthly recurring revenue": "monatlicher wiederkehrender Umsatz", "mrr": "MRR",
  "annual recurring revenue": "jährlicher wiederkehrender Umsatz", "arr": "ARR",
  // Remote / Teams
  "video conference": "Videokonferenz", "screen sharing": "Bildschirmfreigabe",
  "file sharing": "Dateifreigabe", "cloud storage": "Cloud-Speicher",
  "real-time": "Echtzeit", "asynchronous": "asynchron", "synchronous": "synchron",
  "collaborative": "kollaborativ", "distributed": "verteilt",
  // Development
  "version control": "Versionskontrolle", "code review": "Code-Review",
  "continuous integration": "Continuous Integration", "ci": "CI",
  "continuous deployment": "Continuous Deployment", "cd": "CD",
  "open source": "Open Source", "repository": "Repository", "repo": "Repo",
  "pull request": "Pull Request", "merge": "Mergen", "branch": "Branch",
  "feature": "Feature", "bug fix": "Fehlerbehebung", "hotfix": "Hotfix",
  "release": "Release", "version": "Version", "update": "Update",
  "changelog": "Änderungsprotokoll", "roadmap": "Roadmap",
  // Finance
  "financial": "finanziell", "account": "Konto", "bank": "Bank",
  "transaction": "Transaktion", "transfer": "Überweisung",
  "expense": "Ausgabe", "income": "Einnahme", "budget": "Budget",
  "forecast": "Prognose", "prediction": "Vorhersage", "planning": "Planung",
};

function translateToGerman(text: string): string {
  if (!text || typeof text !== "string") return text;
  
  let translated = text;
  
  // Erst Phrasen (2-3 Wörter) — längere zuerst
  const phrases = Object.keys(EN_DE)
    .filter(k => k.includes(" "))
    .sort((a, b) => b.length - a.length);
  
  for (const phrase of phrases) {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$\u0026")}\\b`, "gi");
    translated = translated.replace(regex, EN_DE[phrase]);
  }
  
  // Dann einzelne Wörter
  const words = Object.keys(EN_DE).filter(k => !k.includes(" "));
  const wordMap = new Map(words.map(w => [w.toLowerCase(), EN_DE[w]]));
  
  translated = translated.replace(/\b[a-zA-Z]+\b/g, (match) => {
    const lower = match.toLowerCase();
    if (wordMap.has(lower)) {
      // Behalte Groß-/Kleinschreibung bei
      if (match === match.toUpperCase()) return wordMap.get(lower)!.toUpperCase();
      if (match[0] === match[0].toUpperCase()) {
        const de = wordMap.get(lower)!;
        return de.charAt(0).toUpperCase() + de.slice(1);
      }
      return wordMap.get(lower)!;
    }
    return match;
  });
  
  return translated;
}

// ─── IDEEN-GENERATOR (Original-Text, KI übersetzt später) ───
function generateIdeaFromSignal(signal: any): any {
  
  const categories: Record<string, string> = {
    "CRM": "CRM", "email": "E-Mail-Marketing", "invoice": "Rechnungsstellung",
    "contract": "Vertragsmanagement", "team": "Teamzusammenarbeit", "remote": "Remote-Arbeit",
    "meeting": "Besprechung", "analytics": "Analyse", "AI": "KI-Tools",
    "automation": "Automatisierung", "chat": "Kommunikation", "support": "Kundensupport",
  };
  
  let category = "SaaS";
  for (const [key, val] of Object.entries(categories)) {
    if (signal.content.toLowerCase().includes(key.toLowerCase()) || signal.title.toLowerCase().includes(key.toLowerCase())) {
      category = val;
      break;
    }
  }
  
  const audiences: Record<string, string> = {
    hackernews: "Tech-Startups & Gründer",
    github: "Entwickler & Engineering-Teams",
    indiehackers: "Indie Hacker & Solopreneure",
    stackoverflow: "Software-Entwickler",
    producthunt: "Early Adopters & Product-People",
    heise: "DACH IT-Entscheider & Unternehmen",
    "deutsche-startups": "DACH Startup-Gründer",
    golem: "DACH Tech-Professionals",
    reddit: "Reddit-Community & Gründer",
    g2: "B2B Software-Käufer",
    trustpilot: "Business Software-Nutzer",
    devto: "Entwickler & Tech-Community",
    t3n: "DACH Digital-Professionals",
    gruenderszene: "DACH Entrepreneure",
    getapp: "SMB Software-Entscheider",
    "software-advice": "Enterprise Software-Käufer",
    medium: "Tech-Leser & Product-People",
    "x-twitter": "Social Media Gründer & Betreiber",
    quora: "Q&A Business-Community",
    rss: "Branchen-Feeds (Handwerk, Immobilien, Logistik, Buchhaltung)",
  };
  
  return {
    title: translateToGerman(signal.title).slice(0, 100),
    description: translateToGerman(signal.content).slice(0, 500),
    category: category,
    targetAudience: audiences[signal.source] || "SaaS-Gründer",
    revenueModel: "SaaS-Abonnement (€29-99/Monat)",
    mvpEffort: signal.painScore >= 6 ? "medium" : "low",
    potential: signal.upvotes >= 50 ? "hoch" : signal.upvotes >= 10 ? "mittel" : "niedrig",
    painScore: signal.painScore,
    painKeywords: signal.painKeywords.map((k: string) => EN_DE[k.toLowerCase()] || k).join(", "),
    source: signal.source,
    sourceUrl: signal.sourceUrl,
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

    // LADE QUELLEN AUS DB (dynamisch, UI-gesteuert)
    let dbSources: any[] = [];
    try {
      dbSources = await prisma.$queryRaw`
        SELECT id, name, slug, url, category, enabled, max_results as "maxResults", pain_boost as "painBoost"
        FROM scout_sources WHERE enabled = true ORDER BY sort_order ASC;
      ` || [];
    } catch (e) {
      console.error("[SCOUT] DB sources error", e);
    }

    // Fallback wenn DB leer
    if (!Array.isArray(dbSources) || dbSources.length === 0) {
      dbSources = [
        { slug: "hackernews", maxResults: 20, painBoost: 0 },
        { slug: "github", maxResults: 10, painBoost: 2 },
        { slug: "stackoverflow", maxResults: 15, painBoost: 2 },
        { slug: "heise", maxResults: 15, painBoost: 0 },
        { slug: "deutsche-startups", maxResults: 10, painBoost: 0 },
        { slug: "golem", maxResults: 10, painBoost: 0 },
      ];
    }

    const scrapeFunctions: Record<string, Function> = {
      "hackernews": () => scrapeHackerNews(["SaaS problem", "startup pain", "workflow automation", "developer tool"]),
      "github": () => scrapeGitHub(["SaaS problem", "feature request", "need automation", "pain point"]),
      "indiehackers": () => scrapeIndieHackers(),
      "stackoverflow": () => scrapeStackOverflow(["javascript", "python", "saas", "automation"]),
      "producthunt": () => scrapeProductHunt(),
      "devto": () => scrapeDevTo(),
      "medium": () => scrapeMedium(),
      "heise": () => scrapeHeise(),
      "deutsche-startups": () => scrapeDeutscheStartups(),
      "golem": () => scrapeGolem(),
      "t3n": () => scrapeT3N(),
      "gruenderszene": () => scrapeGruenderszene(),
      "reddit": () => scrapeReddit(["SaaS", "startups", "smallbusiness", "Entrepreneur", "webdev"]),
      "g2": () => scrapeG2Reviews(),
      "trustpilot": () => scrapeTrustpilot(),
      "getapp": () => scrapeGetApp(),
      "software-advice": () => scrapeSoftwareAdvice(),
      "x-twitter": () => scrapeXTwitter(),
      "quora": () => scrapeQuora(),
      "rss-handwerk-bau": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.handwerk_bau || [], "Handwerk & Bau"); } catch (e) { return []; } },
      "rss-immobilien": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.immobilien || [], "Immobilien"); } catch (e) { return []; } },
      "rss-logistik": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.logistik || [], "Logistik & Supply Chain"); } catch (e) { return []; } },
      "rss-buchhaltung": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.buchhaltung || [], "Buchhaltung & Steuern"); } catch (e) { return []; } },
      "rss-finanzen": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.finanzen_banking || [], "Finanzen & Banking"); } catch (e) { return []; } },
      "rss-versicherungen": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.versicherungen || [], "Versicherungen"); } catch (e) { return []; } },
      "rss-gesundheit": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.gesundheit_medizin || [], "Gesundheit & Medizin"); } catch (e) { return []; } },
      "rss-recht": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.recht_compliance || [], "Recht & Compliance"); } catch (e) { return []; } },
      "rss-hr": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.hr_personal || [], "HR & Personal"); } catch (e) { return []; } },
      "rss-marketing": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.marketing_vertrieb || [], "Marketing & Vertrieb"); } catch (e) { return []; } },
      "rss-produktion": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.produktion_industrie || [], "Produktion & Industrie"); } catch (e) { return []; } },
      "rss-energie": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.energie_umwelt || [], "Energie & Umwelt"); } catch (e) { return []; } },
      "rss-bildung": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.bildung_weiterbildung || [], "Bildung & Weiterbildung"); } catch (e) { return []; } },
      "rss-retail": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.retail_ecommerce || [], "Retail & E-Commerce"); } catch (e) { return []; } },
      "rss-food": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.food_gastronomie || [], "Food & Gastronomie"); } catch (e) { return []; } },
      "rss-transport": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.transport_mobilitaet || [], "Transport & Mobilität"); } catch (e) { return []; } },
      "rss-telekom": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.telekommunikation || [], "Telekommunikation"); } catch (e) { return []; } },
      "rss-sicherheit": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.sicherheit_ueberwachung || [], "Sicherheit & Überwachung"); } catch (e) { return []; } },
      "rss-tourismus": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.tourismus_hotellerie || [], "Tourismus & Hotellerie"); } catch (e) { return []; } },
      "rss-druck": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.druck_medien || [], "Druck & Medien"); } catch (e) { return []; } },
      "rss-chemie": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.chemie_pharma || [], "Chemie & Pharma"); } catch (e) { return []; } },
      "rss-automobil": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.automobil_zulieferer || [], "Automobil & Zulieferer"); } catch (e) { return []; } },
      "rss-bau": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.bau_architektur || [], "Bau & Architektur"); } catch (e) { return []; } },
      "rss-agrar": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.agrar_landwirtschaft || [], "Agrar & Landwirtschaft"); } catch (e) { return []; } },
      "rss-textil": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.textil_mode || [], "Textil & Mode"); } catch (e) { return []; } },
      "rss-sport": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.sport_fitness || [], "Sport & Fitness"); } catch (e) { return []; } },
      "rss-musik": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.musik_events || [], "Musik & Events"); } catch (e) { return []; } },
      "rss-kunst": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.kunst_kultur || [], "Kunst & Kultur"); } catch (e) { return []; } },
      "rss-wissenschaft": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.wissenschaft_forschung || [], "Wissenschaft & Forschung"); } catch (e) { return []; } },
      "rss-gemeinden": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.gemeinden_verwaltung || [], "Gemeinden & Verwaltung"); } catch (e) { return []; } },
      "rss-nonprofit": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.non_profit || [], "Non-Profit & NGOs"); } catch (e) { return []; } },
      "rss-datenschutz": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.datenschutz_it_sicherheit || [], "Datenschutz & IT-Sicherheit"); } catch (e) { return []; } },
      "rss-ki": async () => { try { const cfg = await import("@/config/rss-feeds.json").then(m => m.default || m); return scrapeRSS(cfg.ki_automation || [], "KI & Automation"); } catch (e) { return []; } },
    };

    // Fallback-Handler für dynamische/custom Quellen
    function getScraperForSource(src: any): Function {
      // Wenn slug in scrapeFunctions → direkt nutzen
      if (scrapeFunctions[src.slug]) {
        return scrapeFunctions[src.slug];
      }
      
      // Fallback: Wenn URL ein RSS-Feed ist → RSS scraping
      if (src.url && (src.url.endsWith('.xml') || src.url.endsWith('.rss') || src.url.includes('/feed') || src.url.includes('/rss'))) {
        return () => scrapeRSS([src.url], src.name || src.slug);
      }
      
      // Fallback: Für alle anderen URLs → einfache HTTP-Anfrage mit Pain-Extraction
      if (src.url) {
        return async () => {
          try {
            const res = await fetch(src.url, {
              headers: { "User-Agent": "Mozilla/5.0" },
              next: { revalidate: 0 },
            });
            if (!res.ok) return [];
            const html = await res.text();
            // Extrahiere Text aus HTML
            const text = html.replace(/\u003c[^\u003e]+\u003e/g, ' ').replace(/\s+/g, ' ').slice(0, 5000);
            const pain = extractPainSignals(text);
            
            if (pain.hasPain || text.length > 200) {
              return [{
                source: src.slug,
                sourceUrl: src.url,
                sourceName: src.name,
                title: `${src.name} — Relevanter Inhalt gefunden`,
                content: text.slice(0, 500),
                author: "unknown",
                upvotes: 3,
                comments: 0,
                painScore: pain.hasPain ? pain.painScore : 3,
                painKeywords: pain.matchedKeywords,
                createdAt: new Date().toISOString(),
              }];
            }
            return [];
          } catch (e) {
            return [];
          }
        };
      }
      
      // Kein Scraper verfügbar
      console.warn(`[SCOUT] Kein Scraper für Quelle: ${src.slug} (${src.name})`);
      return () => Promise.resolve([]);
    }

    // Paralleles Scraping nur aktivierter Quellen
    const scrapePromises = dbSources.map((src: any) => {
      const fn = getScraperForSource(src);
      return fn().then((signals: any[]) => {
        if (src.painBoost > 0) {
          signals.forEach((s: any) => { s.painScore = Math.min(10, s.painScore + src.painBoost); });
        }
        return signals.slice(0, src.maxResults || 20);
      }).catch((e: any) => {
        console.error(`[SCOUT ${src.slug}]`, e.message);
        return [];
      });
    });

    const allSignalsArrays = await Promise.all(scrapePromises);
    const allSignals = allSignalsArrays.flat();
    
    // Nach Pain Score sortieren, Top N nehmen
    const topSignals = allSignals
      .sort((a, b) => b.painScore - a.painScore)
      .slice(0, maxIdeas);

    // In BusinessIdeas umwandeln, ÜBERSETZEN und speichern
    const savedIdeas = [];
    for (const signal of topSignals) {
      const idea = generateIdeaFromSignal(signal);
      
      // 🔥 KI-ÜBERSETZUNG (DeepSeek via OpenRouter)
      const translated = await translateIdeaWithAI(idea.title, idea.description);
      
      const saved = await prisma.businessIdea.create({
        data: {
          scoutRunId: scoutRun.id,
          title: translated.title,
          description: translated.description,
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
      ideasGenerated: savedIdeas.length,
      sourceCounts: dbSources.reduce((acc: any, src: any) => {
        acc[src.slug] = allSignalsArrays[dbSources.indexOf(src)]?.length || 0;
        return acc;
      }, {}),
      totalSignals: allSignals.length,
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
      "HackerNews — Tech-Startup-Probleme",
      "GitHub Issues — Developer Pain Points",
      "Indie Hackers — Solopreneur-Ideen",
      "Stack Overflow — Entwickler-Probleme",
      "Product Hunt — Neue Produkte & Nischen",
      "Reddit (7 Subreddits) — Community Pain Points",
      "G2 Reviews — B2B Software Pain Points",
      "Trustpilot — Business Software Reviews",
      "DEV.to — Developer & Tech Community",
      "t3n — DACH Digital Professionals",
      "Gründerszene — DACH Entrepreneurs & Startups",
      "GetApp — SMB Software Decision Makers",
      "Software Advice — Enterprise Software Buyers",
      "Medium — Tech Readers & Product Management",
      "X / Twitter (via Nitter) — Social Media Pain Points",
      "Quora — Q&A Business Community",
      "RSS Feeds — 99 branchenübergreifende Feeds (Handwerk/Bau, Immobilien, Logistik, Buchhaltung)",
    ],
    industries: [
      "Software / SaaS", "IT / Developer Tools", "Finance / Accounting",
      "HR / People Ops", "Sales / CRM", "Marketing / Productivity",
      "Supply Chain / ERP", "BI / Analytics", "Remote Work / Collaboration",
      "Handwerk & Bau", "Immobilien & Property Management", "Logistik & Supply Chain"
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
