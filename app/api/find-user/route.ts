import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/find-user?email=alice@venturestudio.de
// Findet User in der DB für Debugging
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // password: false, // Niemals zurückgeben!
      },
    });
    
    if (!user) {
      return NextResponse.json({
        found: false,
        email: email,
        message: "User not found in database",
      });
    }
    
    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "Database error",
    }, { status: 500 });
  }
}
