import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getSessionUser(req?: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Solo-Modus: kein Session-Cookie
  }
  return null;
}

export async function getSessionOrFallback(req?: Request): Promise<{ id: string } | null> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return { id: session.user.id };
    }
  } catch {
    // Solo-Modus: kein Session-Cookie
  }
  return null;
}
