import { NextRequest, NextResponse } from "next/server";

// Echte Daten von Reddit und Hacker News
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "problem painful struggle";

    // Reddit Suche (kostenlos, offen, JSON API)
    const redditRes = await fetch(
      `https://www.reddit.com/r/SaaS+startups+Entrepreneurship+indiehackers/search.json?q=${encodeURIComponent(query)}&sort=new&limit=10`,
      { headers: { "User-Agent": "SAAS-Venture-Studio/1.0" } }
    );
    
    const redditData = redditRes.ok ? await redditRes.json() : { data: { children: [] } };
    
    // Hacker News "Ask HN" (kostenlos, offen)
    const hnRes = await fetch(
      `https://hn.algolia.com/api/v1/search_by_date?tags=ask_hn&query=${encodeURIComponent(query)}&hitsPerPage=10`,
      { headers: { "User-Agent": "SAAS-Venture-Studio/1.0" } }
    );
    
    const hnData = hnRes.ok ? await hnRes.json() : { hits: [] };

    // Daten normalisieren
    const signals = [
      // Reddit Posts
      ...(redditData.data?.children || []).map((post: any) => ({
        source: "reddit",
        subreddit: post.data?.subreddit || "unknown",
        title: post.data?.title || "",
        text: post.data?.selftext?.slice(0, 500) || "",
        url: `https://reddit.com${post.data?.permalink || ""}`,
        score: post.data?.score || 0,
        comments: post.data?.num_comments || 0,
        createdAt: new Date((post.data?.created_utc || 0) * 1000).toISOString(),
        painKeywords: extractPainKeywords(post.data?.title + " " + post.data?.selftext),
      })),
      // HN Posts
      ...(hnData.hits || []).map((hit: any) => ({
        source: "hackernews",
        subreddit: "ask_hn",
        title: hit.title || "",
        text: hit.story_text?.slice(0, 500) || hit.comment_text?.slice(0, 500) || "",
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        score: hit.points || 0,
        comments: hit.num_comments || 0,
        createdAt: hit.created_at || new Date().toISOString(),
        painKeywords: extractPainKeywords(hit.title + " " + (hit.story_text || hit.comment_text || "")),
      })),
    ].filter(s => s.painKeywords.length > 0)
     .sort((a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2))
     .slice(0, 15);

    return NextResponse.json({ 
      signals, 
      total: signals.length,
      query,
      sources: ["reddit", "hackernews"],
    });

  } catch (error: any) {
    console.error("[SIGNAL]", error);
    return NextResponse.json({ error: error.message, signals: [] }, { status: 500 });
  }
}

function extractPainKeywords(text: string): string[] {
  const painWords = [
    "struggle", "painful", "frustrated", "annoying", "hate", "problem", "difficult",
    "impossible", "waste", "expensive", "slow", "broken", "confusing", "manual",
    "takes forever", "every time", "always", "never", "wish", "need", "would love",
    "tired of", "sick of", "can't", "doesn't work", "workaround", "hack",
    "spending hours", "wasting time", "repetitive", "boring", "error", "bug",
    "crash", "lost", "missing", "lacking", "no way", "without", "instead of",
  ];
  
  const lowerText = (text || "").toLowerCase();
  const found = painWords.filter(word => lowerText.includes(word));
  
  // Zusätzlich: Wenn "?" oder "help" oder "how to" enthalten
  if (lowerText.includes("?")) found.push("question");
  if (lowerText.includes("help")) found.push("help_needed");
  if (lowerText.match(/\bhow\b.*\bto\b/)) found.push("how_to");
  
  return [...new Set(found)];
}
