import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Reddit Scraping - Holt echte Posts von r/SaaS und r/startups
 * Nutzt die öffentliche Reddit JSON API (kein Auth nötig)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const subreddits = body.subreddits || ["SaaS", "startups", "smallbusiness", "Entrepreneur"];
    const maxPosts = body.maxPosts || 25;
    
    const results = [];
    const painKeywords = ["pain", "problem", "struggle", "frustrated", "hate", "difficult", "challenge", "impossible", "waste", "expensive", "manual", "boring", "time-consuming"];
    
    for (const sub of subreddits) {
      try {
        // Reddit public JSON API
        const url = `https://www.reddit.com/r/${sub}/hot.json?limit=${maxPosts}`;
        const response = await fetch(url, {
          headers: { "User-Agent": "SaaSVentureStudio/1.0" },
          next: { revalidate: 0 }
        });
        
        if (!response.ok) {
          console.log(`Reddit r/${sub}: HTTP ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        const posts = data?.data?.children || [];
        
        for (const post of posts) {
          const p = post.data;
          if (!p || p.stickied) continue;
          
          const title = p.title || "";
          const text = p.selftext || "";
          const score = p.score || 0;
          const numComments = p.num_comments || 0;
          const url = p.url || "";
          const created = new Date(p.created_utc * 1000);
          
          // Pain detection
          const combined = (title + " " + text).toLowerCase();
          const painMatches = painKeywords.filter(kw => combined.includes(kw));
          const painScore = painMatches.length;
          
          // Only store posts with pain indicators OR high engagement
          if (painScore > 0 || score > 50 || numComments > 20) {
            // Save to business_ideas
            try {
              await prisma.$executeRaw`
                INSERT INTO business_ideas (
                  id, scout_run_id, title, description, category, 
                  target_audience, revenue_model, mvp_effort, potential, created_at
                ) VALUES (
                  gen_random_uuid(),
                  'reddit-' || ${sub},
                  ${title.substring(0, 200)},
                  ${text.substring(0, 2000)},
                  ${sub},
                  'Reddit r/${sub}',
                  'Pain Signal (Score: ${painScore})',
                  'unknown',
                  ${painScore > 2 ? 'high' : painScore > 0 ? 'medium' : 'low'},
                  ${created}
                )
                ON CONFLICT DO NOTHING
              `;
            } catch (e) {
              // Ignore duplicates
            }
            
            results.push({
              source: `reddit-r/${sub}`,
              title: title.substring(0, 100),
              painScore,
              engagement: score + numComments,
              url,
            });
          }
        }
      } catch (subErr) {
        console.error(`Reddit r/${sub} error:`, subErr);
      }
    }
    
    return NextResponse.json({
      success: true,
      source: "reddit",
      scraped: results.length,
      posts: results,
    });
  } catch (error: any) {
    console.error("[REDDIT SCRAPE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
