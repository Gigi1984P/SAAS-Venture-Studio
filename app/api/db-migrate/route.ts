import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Check current agent_runs table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'agent_runs' AND column_name = 'task_id'
    `;
    
    const col = (tableInfo as any[])[0];
    const isNullable = col?.is_nullable === 'YES';
    
    if (!isNullable) {
      // Make task_id nullable
      await prisma.$executeRaw`
        ALTER TABLE agent_runs ALTER COLUMN task_id DROP NOT NULL
      `;
      
      return NextResponse.json({
        success: true,
        action: "task_id_made_nullable",
        previous: col,
      });
    }
    
    return NextResponse.json({
      success: true,
      action: "already_nullable",
      column: col,
    });
  } catch (error: any) {
    console.error("[DB MIGRATE]", error);
    return NextResponse.json({ 
      error: error.message,
      hint: "Schema may already be correct"
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'agent_runs'
    `;
    
    return NextResponse.json({
      columns: tableInfo,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
