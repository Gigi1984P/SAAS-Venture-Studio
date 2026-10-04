import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GitHub Issues Scraper - Findet echte OSS Pain Points
 * Sucht nach Issues mit Keywords wie "feature request", "pain", "problem"
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const queries = body.queries || [
      "feature request automation",
      "manual process pain",
      "need better workflow",
      "currently using excel",
    ];
    const maxResults = body.maxResults || 30;
    
    const results = [];
    const painKeywords = ["pain", "problem", "struggle", "frustrating", "difficult", "manual", "tedious", "waste", "error-prone", "broken", "slow"];
    
    for (const query of queries) {
      try {
        // GitHub Search API (no auth needed for public repos, but rate limited)
        const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}+is:issue+state:open&sort=comments&order=desc&per_page=${maxResults}`;
        const response = await fetch(url, {
          headers: { 
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SaaSVentureStudio/1.0"
          },
          next: { revalidate: 0 }
        });
        
        if (!response.ok) {
          console.log(`GitHub ${query}: HTTP ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        const items = data.items || [];
        
        for (const item of items) {
          const title = item.title || "";
          const body = item.body || "";
          const comments = item.comments || 0;
          const url = item.html_url || "";
          const repo = item.repository?.full_name || "";
          const created = new Date(item.created_at);
          
          const combined = (title + " " + body).toLowerCase();
          const painMatches = painKeywords.filter(kw => combined.includes(kw));
          const painScore = Math.min(painMatches.length * 15 + (comments > 10 ? 20 : 0), 100);
          
          // Only save high-pain issues
          if (painScore > 20 || comments > 5) {
            try {
              await prisma.$executeRaw`
                INSERT INTO business_ideas (
                  id, scout_run_id, title, description, category,
                  target_audience, revenue_model, mvp_effort, potential,
                  source, source_url, pain_score, pain_signals, engagement, created_at
                ) VALUES (
                  gen_random_uuid(),
                  'github',
                  ${title.substring(0, 200)},
                  ${body.substring(0, 2000)},
                  ${repo},
                  'GitHub Developers',
                  'Open Source Pain',
                  'medium',
                  ${painScore > 60 ? 'high' : painScore > 30 ? 'medium' : 'low'},
                  'github',
                  ${url},
                  ${painScore},
                  ${JSON.stringify(painMatches)},
                  ${comments},
                  ${created}
                )
                ON CONFLICT DO NOTHING
              `;
            } catch (e) {}
            
            results.push({
              source: "github",
              title: title.substring(0, 80),
              painScore,
              repo,
              url,
            });
          }
        }
      } catch (qErr) {
        console.error(`GitHub query error:`, qErr);
      }
    }
    
    return NextResponse.json({
      success: true,
      source: "github",
      scraped: results.length,
      issues: results,
    });
  } catch (error: any) {
    console.error("[GITHUB SCRAPE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
