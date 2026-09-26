import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const opportunityId = formData.get("opportunityId") as string;
  const entityType = formData.get("entityType") as string;
  
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}_${file.name}`;
  const fileUrl = `/uploads/${fileName}`;
  
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  
  await writeFile(path.join(uploadDir, fileName), buffer);
  
  const upload = await prisma.fileUpload.create({
    data: {
      opportunityId: opportunityId || null,
      entityType: entityType || "general",
      fileName: file.name,
      fileUrl,
      fileSize: buffer.length,
      mimeType: file.type,
    },
  });
  
  return NextResponse.json(upload);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const oppId = searchParams.get("opportunityId");
  const items = await prisma.fileUpload.findMany({
    where: oppId ? { opportunityId: oppId } : {},
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}
