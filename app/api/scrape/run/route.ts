import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * ECHTER Unified Scraper - Direkte API-Aufrufe (keine internen fetches)
 * Reddit + HackerNews + GitHub
 */
export async function POST() {
  const results = { reddit: 0, hackernews: 0, github: 0 };
  
  try {
    // ── 1. REDDIT ──
    try {
      const subreddits = ["SaaS", "startups", "smallbusiness"];
      const painKeywords = ["pain", "problem", "struggle", "frustrated", "hate", "difficult", "challenge", "waste", "expensive", "manual", "boring", "time-consuming"];
      
      for (const sub of subreddits) {
        try {
          const url = `https://www.reddit.com/r/${sub}/hot.json?limit=15`;
          const res = await fetch(url, {
            headers: { "User-Agent": "SaaSVentureStudio/1.0" },
            next: { revalidate: 0 }
          });
          if (!res.ok) continue;
          
          const data = await res.json();
          const posts = data?.data?.children || [];
          
          for (const post of posts) {
            const p = post.data;
            if (!p || p.stickied) continue;
            
            const title = p.title || "";
            const text = p.selftext || "";
            const score = p.score || 0;
            const numComments = p.num_comments || 0;
            const created = new Date(p.created_utc * 1000);
            
            const combined = (title + " " + text).toLowerCase();
            const painMatches = painKeywords.filter(kw => combined.includes(kw));
            const painScore = painMatches.length;
            
            if (painScore > 0 || score > 30) {
              await prisma.$executeRaw`
                INSERT INTO business_ideas (
                  id, scout_run_id, title, description, category,
                  target_audience, revenue_model, mvp_effort, potential, created_at
                ) VALUES (
                  gen_random_uuid(),
                  'reddit-' || ${sub},
                  ${title.substring(0, 200)},
                  ${(text + " | Reddit Score: " + score + ", Comments: " + numComments).substring(0, 2000)},
                  ${sub},
                  'Reddit r/' || ${sub},
                  ${"Pain Signal (Score: " + painScore + ")"},
                  'unknown',
                  ${painScore > 2 ? 'high' : painScore > 0 ? 'medium' : 'low'},
                  ${created}
                )
                ON CONFLICT DO NOTHING
              `;
              results.reddit++;
            }
          }
        } catch (e) {}
      }
    } catch (e) { console.error("Reddit error:", e); }
    
    // ── 2. HACKERNEWS ──
    try {
      const queries = ["SaaS problem", "startup pain", "workflow automation"];
      
      for (const query of queries) {
        try {
          const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=15`;
          const res = await fetch(url, {
            headers: { "User-Agent": "SaaSVentureStudio/1.0" },
            next: { revalidate: 0 }
          });
          if (!res.ok) continue;
          
          const data = await res.json();
          const hits = data.hits || [];
          
          for (const hit of hits) {
            const title = hit.title || "";
            const text = hit.story_text || "";
            const points = hit.points || 0;
            
            const combined = (title + " " + text).toLowerCase();
            const hasPain = combined.includes("problem") || combined.includes("pain") || 
                           combined.includes("struggle") || combined.includes("frustrating") ||
                           combined.includes("difficult") || combined.includes("manual");
            
            if (hasPain || points > 20) {
              await prisma.$executeRaw`
                INSERT INTO business_ideas (
                  id, scout_run_id, title, description, category,
                  target_audience, revenue_model, mvp_effort, potential, created_at
                ) VALUES (
                  gen_random_uuid(),
                  'hackernews',
                  ${title.substring(0, 200)},
                  ${(text + " | HN Score: " + points + " points").substring(0, 2000)},
                  'HackerNews',
                  'HN Community',
                  ${"Pain Signal (HN: " + points + "p)"},
                  'unknown',
                  ${points > 50 ? 'high' : 'medium'},
                  ${new Date(hit.created_at || Date.now())}
                )
                ON CONFLICT DO NOTHING
              `;
              results.hackernews++;
            }
          }
        } catch (e) {}
      }
    } catch (e) { console.error("HN error:", e); }
    
    // ── 3. GITHUB ──
    try {
      const queries = ["feature request automation", "manual process pain"];
      
      for (const query of queries) {
        try {
          const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}+is:issue+state:open&sort=comments&order=desc&per_page=10`;
          const res = await fetch(url, {
            headers: { 
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "SaaSVentureStudio/1.0"
            },
            next: { revalidate: 0 }
          });
          if (!res.ok) continue;
          
          const data = await res.json();
          const items = data.items || [];
          
          for (const item of items) {
            const title = item.title || "";
            const body = item.body || "";
            const comments = item.comments || 0;
            const url = item.html_url || "";
            const repo = item.repository?.full_name || "";
            
            const combined = (title + " " + body).toLowerCase();
            const painKeywords = ["pain", "problem", "struggle", "frustrating", "difficult", "manual", "tedious", "waste", "broken", "slow"];
            const painMatches = painKeywords.filter(kw => combined.includes(kw));
            const painScore = Math.min(painMatches.length * 15 + (comments > 10 ? 20 : 0), 100);
            
            if (painScore > 20 || comments > 5) {
              await prisma.$executeRaw`
                INSERT INTO business_ideas (
                  id, scout_run_id, title, description, category,
                  target_audience, revenue_model, mvp_effort, potential, created_at
                ) VALUES (
                  gen_random_uuid(),
                  'github',
                  ${title.substring(0, 200)},
                  ${(body + " | Comments: " + comments + " | URL: " + url).substring(0, 2000)},
                  ${repo},
                  'GitHub Developers',
                  'Open Source Pain',
                  'medium',
                  ${painScore > 60 ? 'high' : painScore > 30 ? 'medium' : 'low'},
                  ${new Date(item.created_at || Date.now())}
                )
                ON CONFLICT DO NOTHING
              `;
              results.github++;
            }
          }
        } catch (e) {}
      }
    } catch (e) { console.error("GitHub error:", e); }
    
    const total = results.reddit + results.hackernews + results.github;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalScraped: total,
      results: [
        { source: "reddit", scraped: results.reddit },
        { source: "hackernews", scraped: results.hackernews },
        { source: "github", scraped: results.github },
      ],
    });
  } catch (error: any) {
    console.error("[UNIFIED SCRAPE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM business_ideas`;
    const total = Number((count as any[])?.[0]?.count) || 0;
    
    return NextResponse.json({
      totalBusinessIdeas: total,
      status: "Use POST /api/scrape/run to start scraping",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
