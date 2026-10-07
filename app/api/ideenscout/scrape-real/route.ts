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
    reddit: "Reddit Community & Founders",
    g2: "B2B Software Buyers",
    trustpilot: "Business Software Users",
    devto: "Developers & Tech Community",
    t3n: "DACH Digital Professionals",
    gruenderszene: "DACH Entrepreneurs",
    getapp: "SMB Software Decision Makers",
    "software-advice": "Enterprise Software Buyers",
    medium: "Tech Readers & Product People",
    "x-twitter": "Social Media Founders & Operators",
    quora: "Q&A Business Community",
    rss: "Branchen-Feeds (Handwerk, Immobilien, Logistik, Buchhaltung)",
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
    };

    // Paralleles Scraping nur aktivierter Quellen
    const scrapePromises = dbSources.map((src: any) => {
      const fn = scrapeFunctions[src.slug];
      if (!fn) {
        console.warn(`[SCOUT] Unbekannte Quelle: ${src.slug}`);
        return Promise.resolve([]);
      }
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
