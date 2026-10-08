import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Auth Check Helper
 */
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert. Bitte einloggen." }, { status: 401 });
  }
  return null;
}

// GET /api/ideas — liefert ALLE Ideen (BusinessIdea = gescrapte Ideen aus Scout)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;
    const search = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const potential = searchParams.get("potential") || "";

    // Build WHERE clause for raw query
    const whereParts: string[] = ["scout_run_id IS NOT NULL"];
    const whereValues: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereParts.push(`(title ILIKE $${paramIdx++} OR description ILIKE $${paramIdx++})`);
      whereValues.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== "all") {
      whereParts.push(`category = $${paramIdx++}`);
      whereValues.push(category);
    }
    if (potential && potential !== "all") {
      whereParts.push(`potential = $${paramIdx++}`);
      whereValues.push(potential);
    }

    const whereClause = whereParts.join(" AND ");

    // Total count
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM business_ideas WHERE ${whereClause}`,
      ...whereValues
    );
    const totalCount = Number((countResult as any[])?.[0]?.count) || 0;

    // Fetch paginated
    const ideas = await prisma.$queryRawUnsafe(
      `SELECT * FROM business_ideas WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      ...whereValues,
      limit,
      offset
    );

    // Categories for filter
    const categories = await prisma.$queryRaw`
      SELECT DISTINCT category FROM business_ideas 
      WHERE scout_run_id IS NOT NULL AND category IS NOT NULL 
      ORDER BY category
    `;

    return NextResponse.json({
      ideas: ideas || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      filters: {
        categories: ((categories as any[]) || []).map((c: any) => c.category).filter(Boolean),
      },
    });
  } catch (error: any) {
    console.error("[IDEAS GET]", error);
    return NextResponse.json({ error: error.message, ideas: [], pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // AUTH CHECK
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { title, description, problem, solution, tags } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
    }

    // XSS Sanitization
    const cleanTitle = title.replace(/<\/?[^>]+>/g, "");
    const cleanDesc = (description || "").replace(/<\/?[^>]+>/g, "");

    // Duplicate Check
    const existing = await prisma.idea.findFirst({
      where: { title: { equals: cleanTitle, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json({ error: "Idee existiert bereits" }, { status: 409 });
    }

    const idea = await prisma.idea.create({
      data: {
        title: cleanTitle,
        description: cleanDesc,
        problem: problem || null,
        solution: solution || null,
        tags: tags || [],
        status: "draft",
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error: any) {
    console.error("[IDEAS POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
