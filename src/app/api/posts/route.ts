import { prisma } from "@/lib/prisma";
import { expandPlatformsToChannels, type PlatformChannelKey } from "@/lib/brand-config";
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
    include: { kpis: true, series: true, platformStatuses: true },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const platformsStr = Array.isArray(body.platforms)
    ? body.platforms.join(",")
    : body.platforms;

  const post = await prisma.post.create({
    data: {
      title: body.title,
      hook: body.hook || null,
      script: body.script || null,
      caption: body.caption || null,
      hashtags: body.hashtags || null,
      pillar: body.pillar,
      format: body.format,
      platforms: platformsStr,
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

  const channels = expandPlatformsToChannels(platformsStr, body.format);
  if (channels.length > 0) {
    await prisma.postPlatformStatus.createMany({
      data: channels.map((platform) => ({ postId: post.id, platform })),
    });
  }

  const fullPost = await prisma.post.findUnique({
    where: { id: post.id },
    include: { kpis: true, series: true, platformStatuses: true },
  });
  return NextResponse.json(fullPost, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (data.platforms && Array.isArray(data.platforms)) {
    data.platforms = data.platforms.join(",");
  }
  if (data.scheduledDate) data.scheduledDate = new Date(data.scheduledDate);
  if (data.publishedDate) data.publishedDate = new Date(data.publishedDate);

  const updatedPost = await prisma.post.update({ where: { id }, data });

  // Sync platform statuses
  const channels = expandPlatformsToChannels(updatedPost.platforms, updatedPost.format);
  const existing = await prisma.postPlatformStatus.findMany({ where: { postId: id } });
  const existingPlatforms = existing.map((e) => e.platform);

  const toDelete = existingPlatforms.filter(
    (p) => !channels.includes(p as PlatformChannelKey)
  );
  if (toDelete.length > 0) {
    await prisma.postPlatformStatus.deleteMany({
      where: { postId: id, platform: { in: toDelete } },
    });
  }

  const toCreate = channels.filter((p) => !existingPlatforms.includes(p));
  if (toCreate.length > 0) {
    await prisma.postPlatformStatus.createMany({
      data: toCreate.map((platform) => ({ postId: id, platform })),
    });
  }

  const fullPost = await prisma.post.findUnique({
    where: { id },
    include: { kpis: true, series: true, platformStatuses: true },
  });
  return NextResponse.json(fullPost);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Reset any ideas that point to this post so they go back to the pool
  await prisma.idea.updateMany({
    where: { convertedToPostId: id },
    data: { convertedToPostId: null, status: "REVIEWED" },
  });

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
