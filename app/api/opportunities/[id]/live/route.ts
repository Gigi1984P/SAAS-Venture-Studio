import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/opportunities/[id]/live
// Server-Sent Events (SSE) fuer Live-Monitoring des Orchestrators
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        // Sende initialen Status
        const agentRuns = await prisma.agentRun.findMany({
          where: { taskId: { startsWith: `task-${params.id}` } },
          orderBy: { startedAt: "asc" },
        });
        
        const message = JSON.stringify({
          type: "init",
          agentRuns: agentRuns.map((run) => ({
            agentType: run.agentType,
            status: run.status,
            runtimeSeconds: run.runtimeSeconds,
            startedAt: run.startedAt,
          })),
        });
        
        controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        
        // Poll alle 2 Sekunden fuer Updates
        const interval = setInterval(async () => {
          try {
            const latestRuns = await prisma.agentRun.findMany({
              where: { taskId: { startsWith: `task-${params.id}` } },
              orderBy: { startedAt: "desc" },
              take: 1,
            });
            
            if (latestRuns.length > 0) {
              const update = JSON.stringify({
                type: "update",
                agentRun: {
                  agentType: latestRuns[0].agentType,
                  status: latestRuns[0].status,
                  runtimeSeconds: latestRuns[0].runtimeSeconds,
                  startedAt: latestRuns[0].startedAt,
                },
              });
              
              controller.enqueue(encoder.encode(`data: ${update}\n\n`));
            }
          } catch (e) {
            console.error("[SSE POLL ERROR]", e);
          }
        }, 2000);
        
        // Cleanup bei Verbindungsabbruch
        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });
    
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
  } catch (error) {
    console.error("[SSE ERROR]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
