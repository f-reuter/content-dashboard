import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const pillar = url.searchParams.get("pillar");

  const where: Record<string, unknown> = {};
  if (pillar) where.pillar = pillar;

  const trends = await prisma.trendSnapshot.findMany({
    where,
    orderBy: { scannedAt: "desc" },
    take: limit,
  });
  return NextResponse.json(trends);
}
