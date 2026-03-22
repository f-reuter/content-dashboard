import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const platform = url.searchParams.get("platform");
  const pillar = url.searchParams.get("pillar");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (pillar) where.pillar = { contains: pillar };
  if (platform) where.platforms = { contains: platform };

  const hooks = await prisma.hook.findMany({
    where,
    orderBy: [{ isFavorite: "desc" }, { performanceScore: "desc" }, { createdAt: "desc" }],
    include: { post: { select: { id: true, title: true, status: true } } },
  });
  return NextResponse.json(hooks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const hook = await prisma.hook.create({
    data: {
      text: body.text,
      type: body.type || "QUESTION",
      platforms: Array.isArray(body.platforms) ? body.platforms.join(",") : body.platforms || null,
      formats: Array.isArray(body.formats) ? body.formats.join(",") : body.formats || null,
      pillar: Array.isArray(body.pillar) ? body.pillar.join(",") : body.pillar || null,
      postId: body.postId || null,
      performanceScore: body.performanceScore || null,
      notes: body.notes || null,
      isFavorite: body.isFavorite || false,
    },
  });
  return NextResponse.json(hook, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (data.platforms && Array.isArray(data.platforms)) data.platforms = data.platforms.join(",");
  if (data.formats && Array.isArray(data.formats)) data.formats = data.formats.join(",");
  if (data.pillar && Array.isArray(data.pillar)) data.pillar = data.pillar.join(",");
  const hook = await prisma.hook.update({ where: { id }, data });
  return NextResponse.json(hook);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.hook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
