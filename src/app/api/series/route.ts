import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const series = await prisma.series.findMany({
    orderBy: { createdAt: "desc" },
    include: { posts: { select: { id: true } } },
  });
  return NextResponse.json(series);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const series = await prisma.series.create({
    data: {
      name: body.name,
      description: body.description || null,
      pillar: body.pillar,
      frequency: body.frequency || null,
      templateHook: body.templateHook || null,
      templateFormat: body.templateFormat || null,
    },
  });
  return NextResponse.json(series, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.series.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
