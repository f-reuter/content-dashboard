import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const platform = url.searchParams.get("platform");
  const minScore = url.searchParams.get("minViralScore");
  const competitorId = url.searchParams.get("competitorId");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};
  if (platform) where.platform = platform;
  if (competitorId) where.competitorId = competitorId;
  if (minScore) where.viralScore = { gte: parseFloat(minScore) };

  const content = await prisma.scannedContent.findMany({
    where,
    orderBy: { viralScore: "desc" },
    take: limit,
    include: { competitor: { select: { name: true, handle: true } } },
  });
  return NextResponse.json(content);
}

export async function POST(req: NextRequest) {
  // Save scanned content as an Idea
  const { scannedContentId } = await req.json();
  const content = await prisma.scannedContent.findUnique({
    where: { id: scannedContentId },
    include: { competitor: true },
  });
  if (!content) {
    return NextResponse.json({ error: "Content nicht gefunden" }, { status: 404 });
  }

  const idea = await prisma.idea.create({
    data: {
      hook: content.title || content.caption?.slice(0, 100) || "Viral-Inspiration",
      description: [
        content.aiAnalysis,
        content.url ? `Quelle: ${content.url}` : null,
        content.competitor ? `Von: ${content.competitor.name} (${content.platform})` : null,
        `${content.views} Views, Score: ${content.viralScore?.toFixed(1)}`,
      ].filter(Boolean).join("\n"),
      pillar: "AI",
      format: content.contentType === "SHORT" || content.contentType === "REEL" ? "REEL" : "YOUTUBE_LONG",
      sourceVideoUrls: content.url || null,
    },
  });

  await prisma.scannedContent.update({
    where: { id: scannedContentId },
    data: { savedAsIdea: true },
  });

  return NextResponse.json(idea, { status: 201 });
}
