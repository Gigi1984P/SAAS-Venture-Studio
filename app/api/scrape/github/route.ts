import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * METHODE 1: GitHub Issues Scraper
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const queries = body.queries || [
      "feature request automation",
      "manual process pain",
      "need workflow tool",
      "currently using excel",
      "boring repetitive task",
      "error-prone manual",
    ];
    const maxResults = body.maxResults || 15;
    
    const results = [];
    const painKeywords = ["pain", "problem", "struggle", "frustrating", "difficult", "manual", "tedious", "waste", "error-prone", "broken", "slow", "boring", "repetitive"];
    
    for (const query of queries) {
      try {
        const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}+is:issue+state:open&sort=comments&order=desc&per_page=${maxResults}`;
        const response = await fetch(url, {
          headers: { 
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SaaSVentureStudio/1.0"
          },
          next: { revalidate: 0 }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const items = data.items || [];
        
        for (const item of items) {
          const title = item.title || "";
          const bodyText = item.body || "";
          const comments = item.comments || 0;
          const url = item.html_url || "";
          const repo = item.repository?.full_name || "unknown";
          
          const combined = (title + " " + bodyText).toLowerCase();
          const painMatches = painKeywords.filter(kw => combined.includes(kw));
          const painScore = Math.min(painMatches.length * 15 + (comments > 10 ? 20 : 0), 100);
          
          if (painScore > 15 || comments > 3) {
            try {
              await prisma.$executeRaw`
                INSERT INTO business_ideas (
                  id, scout_run_id, title, description, category,
                  target_audience, revenue_model, mvp_effort, potential, created_at
                ) VALUES (
                  gen_random_uuid(),
                  'github',
                  ${title.substring(0, 200)},
                  ${(bodyText + "\n\nRepo: " + repo + " | Comments: " + comments + " | PainScore: " + painScore + " | URL: " + url).substring(0, 2000)},
                  ${repo},
                  'GitHub Developers',
                  'Open Source Pain',
                  'medium',
                  ${painScore > 60 ? 'high' : painScore > 30 ? 'medium' : 'low'},
                  ${new Date(item.created_at || Date.now())}
                )
                ON CONFLICT DO NOTHING
              `;
            } catch (e) {}
            
            results.push({ title: title.substring(0, 80), painScore, repo, comments });
          }
        }
      } catch (qErr) {}
    }
    
    return NextResponse.json({
      success: true,
      source: "github",
      scraped: results.length,
      issues: results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
