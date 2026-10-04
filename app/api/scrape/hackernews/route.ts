import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const results = [];
    const queries = ["SaaS problem", "startup pain", "workflow automation"];
    
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
          const text = hit.story_text || "";
          const points = hit.points || 0;
          
          const combined = (title + " " + text).toLowerCase();
          const hasPain = combined.includes("problem") || combined.includes("pain") || 
                         combined.includes("struggle") || combined.includes("frustrating") ||
                         combined.includes("difficult") || combined.includes("manual") ||
                         combined.includes("tedious");
          
          if (hasPain || points > 20) {
            try {
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
            } catch (e) {}
            
            results.push({ title: title.substring(0, 80), points });
          }
        }
      } catch (qErr) {}
    }
    
    return NextResponse.json({
      success: true,
      source: "hackernews",
      scraped: results.length,
      posts: results,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
