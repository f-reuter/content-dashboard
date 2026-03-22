import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pillar = url.searchParams.get("pillar");
  const status = url.searchParams.get("status");
  const where: Record<string, string> = {};
  if (pillar) where.pillar = pillar;
  if (status) where.status = status;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { scheduledDate: "desc" },
    include: { kpis: true, series: true },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const post = await prisma.post.create({
    data: {
      title: body.title,
      hook: body.hook || null,
      script: body.script || null,
      caption: body.caption || null,
      hashtags: body.hashtags || null,
      pillar: body.pillar,
      format: body.format,
      platforms: Array.isArray(body.platforms) ? body.platforms.join(",") : body.platforms,
      status: body.status || "IDEA",
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      publishedDate: body.publishedDate ? new Date(body.publishedDate) : null,
      thumbnailIdea: body.thumbnailIdea || null,
      ctaText: body.ctaText || null,
      seriesId: body.seriesId || null,
      parentPostId: body.parentPostId || null,
      batchSessionId: body.batchSessionId || null,
    },
  });
  return NextResponse.json(post, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (data.platforms && Array.isArray(data.platforms)) {
    data.platforms = data.platforms.join(",");
  }
  if (data.scheduledDate) data.scheduledDate = new Date(data.scheduledDate);
  if (data.publishedDate) data.publishedDate = new Date(data.publishedDate);

  const post = await prisma.post.update({ where: { id }, data });
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
