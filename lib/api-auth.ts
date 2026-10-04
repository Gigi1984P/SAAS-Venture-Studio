import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Prüft Auth für schreibende Operationen.
 * GET bleibt offen (Solo-Modus).
 * POST/PUT/PATCH/DELETE erfordern Session.
 */
export async function requireAuthForMutations(req: NextRequest) {
  // GET requests are always allowed (read-only, Solo-Mode)
  if (req.method === "GET") {
    return null; // No error = allowed
  }
  
  // For mutations, check session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required for write operations" },
      { status: 401 }
    );
  }
  
  return null; // Auth OK
}
