import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const subreddits = body.subreddits || ["SaaS", "startups", "smallbusiness"];
    const maxPosts = body.maxPosts || 25;
    
    const results = [];
    const painKeywords = ["pain", "problem", "struggle", "frustrated", "hate", "difficult", "challenge", "waste", "expensive", "manual", "boring", "time-consuming"];
    
    for (const sub of subreddits) {
      try {
        const url = `https://www.reddit.com/r/${sub}/hot.json?limit=${maxPosts}`;
        const response = await fetch(url, {
          headers: { "User-Agent": "SaaSVentureStudio/1.0" },
          next: { revalidate: 0 }
        });
        
        if (!response.ok) continue;
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
          
          const combined = (title + " " + text).toLowerCase();
          const painMatches = painKeywords.filter(kw => combined.includes(kw));
          const painScore = painMatches.length;
          
          if (painScore > 0 || score > 30) {
            try {
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
                  ${new Date(p.created_utc * 1000 || Date.now())}
                )
                ON CONFLICT DO NOTHING
              `;
            } catch (e) {}
            
            results.push({ title: title.substring(0, 100), painScore });
          }
        }
      } catch (subErr) { console.error("Reddit error:", subErr); }
    }
    
    return NextResponse.json({
      success: true,
      source: "reddit",
      scraped: results.length,
      posts: results,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
