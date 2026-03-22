import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const platform = new URL(req.url).searchParams.get("platform");
  const where = platform ? { platform } : {};

  const competitors = await prisma.competitor.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { scannedContent: true } },
      scannedContent: { orderBy: { scannedAt: "desc" }, take: 1, select: { scannedAt: true } },
    },
  });
  return NextResponse.json(competitors);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const competitor = await prisma.competitor.create({
    data: {
      name: body.name,
      platform: body.platform,
      handle: body.handle,
      profileUrl: body.profileUrl || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(competitor, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const competitor = await prisma.competitor.update({ where: { id }, data });
  return NextResponse.json(competitor);
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.competitor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
