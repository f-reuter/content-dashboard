import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const { postId, platform, published } = await req.json();

  if (!postId || !platform) {
    return NextResponse.json(
      { error: "postId and platform required" },
      { status: 400 }
    );
  }

  const status = await prisma.postPlatformStatus.upsert({
    where: { postId_platform: { postId, platform } },
    update: {
      published,
      publishedAt: published ? new Date() : null,
    },
    create: {
      postId,
      platform,
      published,
      publishedAt: published ? new Date() : null,
    },
  });
  return NextResponse.json(status);
}

export async function GET(req: NextRequest) {
  const postId = new URL(req.url).searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  const statuses = await prisma.postPlatformStatus.findMany({
    where: { postId },
  });
  return NextResponse.json(statuses);
}
