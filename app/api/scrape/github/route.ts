import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GitHub Issues Scraper - Geschützt durch Auth
 */
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }
  return null;
}

export async function POST() {
  // AUTH REQUIRED
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const results = [];
    const queries = ["SaaS problem", "startup pain", "need tool for"];
    
    for (const query of queries) {
      try {
        const res = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}+is:issue+is:open+label:"feature request"&sort=comments&order=desc&per_page=10`, {
          headers: { "Accept": "application/vnd.github.v3+json" },
          next: { revalidate: 0 }
        });
        
        if (res.ok) {
          const data = await res.json();
          for (const item of data.items || []) {
            try {
              const title = item.title || "GitHub Issue";
              const desc = (item.body || "").substring(0, 2000);
              await prisma.$executeRaw`
                INSERT INTO business_ideas (id, scout_run_id, title, description, category, target_audience, revenue_model, mvp_effort, potential, created_at)
                VALUES (gen_random_uuid(), 'github', ${title}, ${desc}, 'unknown', 'GitHub Developers', 'B2B SaaS', 'medium', 'medium', NOW())
                ON CONFLICT DO NOTHING
              `;
              results.push(item);
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
    
    return NextResponse.json({ success: true, scraped: results.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
