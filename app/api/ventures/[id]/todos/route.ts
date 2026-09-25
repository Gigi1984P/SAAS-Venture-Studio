import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const todos = await prisma.ventureTodo.findMany({
      where: { ventureId: params.id },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(todos);
  } catch (err) {
    console.error("Error fetching todos:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const todo = await prisma.ventureTodo.create({
      data: {
        ventureId: params.id,
        title: body.title,
        description: body.description || "",
        status: body.status || "todo",
        priority: body.priority || "medium",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });
    return NextResponse.json(todo, { status: 201 });
  } catch (err) {
    console.error("Error creating todo:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}
