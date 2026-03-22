import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const kpis = await prisma.kPI.findMany({
    orderBy: { recordedAt: "desc" },
    include: { post: true },
  });
  return NextResponse.json(kpis);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const views = body.views || 0;
  const likes = body.likes || 0;
  const comments = body.comments || 0;
  const saves = body.saves || 0;
  const shares = body.shares || 0;
  const engagementRate = views > 0 ? ((likes + comments + saves + shares) / views) * 100 : 0;

  const kpi = await prisma.kPI.create({
    data: {
      postId: body.postId,
      views,
      likes,
      comments,
      saves,
      shares,
      engagementRate,
      postingTime: body.postingTime || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(kpi, { status: 201 });
}
