import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const sessions = await prisma.batchSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { posts: { select: { id: true, title: true, status: true } } },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await prisma.batchSession.create({
    data: {
      name: body.name,
      plannedDate: body.plannedDate ? new Date(body.plannedDate) : null,
      setupType: body.setupType || null,
      notes: body.notes || null,
      checklist: body.checklist || null,
    },
  });
  return NextResponse.json(session, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.batchSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
