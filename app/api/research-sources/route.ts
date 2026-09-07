import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/research-sources
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });

    const sources = await prisma.researchSource.findMany({
      orderBy: [
        { isActive: "desc" },
        { priority: "desc" },
      ],
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error("[RESEARCH SOURCES GET]", error);
    return NextResponse.json({ message: "Interner Fehler" }, { status: 500 });
  }
}

// POST /api/research-sources (Seed initial data)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Nicht authentifiziert" }, { status: 401 });

    const body = await req.json();

    // Seed default sources if "seed" flag
    if (body.seed) {
      const defaults = [
        {
          name: "Reddit",
          slug: "reddit",
          type: "forum",
          baseUrl: "https://www.reddit.com",
          searchUrl: "https://www.reddit.com/search/?q={query}",
          isActive: true,
          priority: 10,
          scrapeMethod: "browser",
          selectorTitle: "h3._eYtD2XCVieq6mZg4",
          selectorContent: "div._1poyrkZ7g36PawDueRza-J",
          selectorAuthor: "a._2tbHP6Z2rehnJG4yN1W0Zr",
          selectorDate: "span._1LLoyNXHm",
          rateLimitRequests: 5,
          rateLimitWindow: 60,
          categories: "saas, property-management, maintenance, startup",
        },
        {
          name: "G2",
          slug: "g2",
          type: "review",
          baseUrl: "https://www.g2.com",
          searchUrl: "https://www.g2.com/search?query={query}",
          isActive: true,
          priority: 9,
          scrapeMethod: "browser",
          selectorTitle: "h2.product-name",
          selectorContent: "div.review-content",
          selectorAuthor: "span.reviewer-name",
          selectorDate: "span.date",
          rateLimitRequests: 3,
          rateLimitWindow: 60,
          categories: "saas, software, property-management",
        },
        {
          name: "HackerNews",
          slug: "hackernews",
          type: "forum",
          baseUrl: "https://news.ycombinator.com",
          searchUrl: "https://hn.algolia.com/?q={query}",
          isActive: true,
          priority: 8,
          scrapeMethod: "browser",
          selectorTitle: "span.titleline",
          selectorContent: "div.commtext",
          selectorAuthor: "a.hnuser",
          selectorDate: "span.age",
          rateLimitRequests: 10,
          rateLimitWindow: 60,
          categories: "saas, startup, tech, ai",
        },
        {
          name: "Trustpilot",
          slug: "trustpilot",
          type: "review",
          baseUrl: "https://www.trustpilot.com",
          searchUrl: "https://www.trustpilot.com/search?query={query}",
          isActive: true,
          priority: 7,
          scrapeMethod: "browser",
          selectorTitle: "h2",
          selectorContent: "p[data-service-review-text-typography]",
          selectorAuthor: "span[data-consumer-name-typography]",
          selectorDate: "span[data-service-review-date-typography]",
          rateLimitRequests: 5,
          rateLimitWindow: 60,
          categories: "saas, software, service",
        },
        {
          name: "Quora",
          slug: "quora",
          type: "forum",
          baseUrl: "https://www.quora.com",
          searchUrl: "https://www.quora.com/search?q={query}",
          isActive: true,
          priority: 6,
          scrapeMethod: "browser",
          rateLimitRequests: 5,
          rateLimitWindow: 60,
          categories: "saas, startup, business, tech",
        },
        {
          name: "TechCrunch",
          slug: "techcrunch",
          type: "news",
          baseUrl: "https://techcrunch.com",
          searchUrl: "https://techcrunch.com/?s={query}",
          isActive: true,
          priority: 5,
          scrapeMethod: "browser",
          selectorTitle: "h2.post-block__title",
          selectorContent: "div.article-content",
          selectorAuthor: "span.byline",
          selectorDate: "time",
          rateLimitRequests: 10,
          rateLimitWindow: 60,
          categories: "saas, startup, tech, funding",
        },
        {
          name: "Capterra",
          slug: "capterra",
          type: "review",
          baseUrl: "https://www.capterra.com",
          searchUrl: "https://www.capterra.com/search/?search={query}",
          isActive: true,
          priority: 7,
          scrapeMethod: "browser",
          rateLimitRequests: 3,
          rateLimitWindow: 60,
          categories: "saas, software, b2b",
        },
        {
          name: "IndieHackers",
          slug: "indiehackers",
          type: "forum",
          baseUrl: "https://www.indiehackers.com",
          searchUrl: "https://www.indiehackers.com/search?q={query}",
          isActive: true,
          priority: 6,
          scrapeMethod: "browser",
          rateLimitRequests: 8,
          rateLimitWindow: 60,
          categories: "saas, startup, indie, bootstrapping",
        },
      ];

      const created = [];
      for (const source of defaults) {
        const existing = await prisma.researchSource.findUnique({
          where: { slug: source.slug },
        });
        if (!existing) {
          const s = await prisma.researchSource.create({ data: source as any });
          created.push(s);
        }
      }

      return NextResponse.json({ message: "Seeded", created: created.length });
    }

    // Create single source
    const source = await prisma.researchSource.create({
      data: {
        name: body.name,
        slug: body.slug,
        type: body.type,
        baseUrl: body.baseUrl,
        searchUrl: body.searchUrl,
        isActive: body.isActive ?? true,
        priority: body.priority ?? 5,
        scrapeMethod: body.scrapeMethod ?? "browser",
        selectorTitle: body.selectorTitle,
        selectorContent: body.selectorContent,
        selectorAuthor: body.selectorAuthor,
        selectorDate: body.selectorDate,
        rateLimitRequests: body.rateLimitRequests ?? 10,
        rateLimitWindow: body.rateLimitWindow ?? 60,
        categories: body.categories,
      },
    });

    return NextResponse.json({ message: "Source erstellt", source }, { status: 201 });
  } catch (error) {
    console.error("[RESEARCH SOURCES POST]", error);
    return NextResponse.json({ message: "Interner Fehler", error: String(error) }, { status: 500 });
  }
}
