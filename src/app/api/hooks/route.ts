import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const hooks = await prisma.hook.findMany({
    orderBy: { createdAt: "desc" },
    include: { post: { include: { kpis: true } } },
  });
  return NextResponse.json(hooks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const hook = await prisma.hook.create({
    data: {
      text: body.text,
      type: body.type || "QUESTION",
      postId: body.postId || null,
    },
  });
  return NextResponse.json(hook, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.hook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
