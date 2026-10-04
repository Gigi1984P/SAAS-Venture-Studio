import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * HackerNews Scraping - Holt echte Show HN und Ask HN Posts
 */
export async function POST() {
  try {
    const results = [];
    const painKeywords = ["problem", "pain", "struggle", "frustrating", "difficult", "challenging", "annoying", "slow", "broken", "manual"];
    
    const queries = [
      "SaaS problem",
      "startup pain",
      "workflow automation",
      "customer churn",
      "billing problem",
    ];
    
    for (const query of queries) {
      try {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`;
        const response = await fetch(url, {
          headers: { "User-Agent": "SaaSVentureStudio/1.0" },
          next: { revalidate: 0 }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const hits = data.hits || [];
        
        for (const hit of hits) {
          const title = hit.title || "";
          const text = hit.story_text || hit.comment_text || "";
          const points = hit.points || 0;
          const created = new Date(hit.created_at);
          
          const combined = (title + " " + text).toLowerCase();
          const painMatches = painKeywords.filter(kw => combined.includes(kw));
          const painScore = painMatches.length;
          
          if (painScore > 0 || points > 30) {
            try {
              await prisma.$executeRaw`
                INSERT INTO business_ideas (
                  id, scout_run_id, title, description, category,
                  target_audience, revenue_model, mvp_effort, potential, created_at
                ) VALUES (
                  gen_random_uuid(),
                  'hackernews',
                  ${title.substring(0, 200)},
                  ${text.substring(0, 2000)},
                  'HackerNews',
                  'HN Community',
                  'Pain Signal (HN: ${points}p)',
                  'unknown',
                  ${painScore > 1 ? 'high' : 'medium'},
                  ${created}
                )
                ON CONFLICT DO NOTHING
              `;
            } catch (e) {}
            
            results.push({
              source: "hackernews",
              title: title.substring(0, 100),
              painScore,
              points,
            });
          }
        }
      } catch (qErr) {
        console.error(`HN query error:`, qErr);
      }
    }
    
    return NextResponse.json({
      success: true,
      source: "hackernews",
      scraped: results.length,
      posts: results,
    });
  } catch (error: any) {
    console.error("[HN SCRAPE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
