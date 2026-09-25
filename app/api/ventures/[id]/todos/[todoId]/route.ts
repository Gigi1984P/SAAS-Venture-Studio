import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { ventureId: string; todoId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "done") updateData.completedAt = new Date();
    }
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority) updateData.priority = body.priority;
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);

    const todo = await prisma.ventureTodo.update({
      where: { id: params.todoId },
      data: updateData,
    });
    return NextResponse.json(todo);
  } catch (err) {
    console.error("Error updating todo:", err);
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { ventureId: string; todoId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  try {
    await prisma.ventureTodo.delete({ where: { id: params.todoId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting todo:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
