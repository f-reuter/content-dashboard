import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const ideas = await prisma.idea.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (Array.isArray(body)) {
    const ideas = await prisma.idea.createMany({
      data: body.map((i: Record<string, unknown>) => ({
        hook: i.hook as string,
        description: (i.description as string) || null,
        pillar: i.pillar as string,
        format: (i.format as string) || null,
        rating: (i.rating as number) || 0,
        sourceVideoUrls: (i.sourceVideoUrls as string) || null,
      })),
    });
    return NextResponse.json(ideas, { status: 201 });
  }
  const idea = await prisma.idea.create({
    data: {
      hook: body.hook,
      description: body.description || null,
      pillar: body.pillar,
      format: body.format || null,
      rating: body.rating || 0,
      sourceVideoUrls: body.sourceVideoUrls || null,
    },
  });
  return NextResponse.json(idea, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const idea = await prisma.idea.update({ where: { id }, data });
  return NextResponse.json(idea);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.idea.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
