import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const configs = await prisma.brandConfig.findMany();
  const result: Record<string, string> = {};
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const entries: Array<{ key: string; value: string }> = await req.json();

  for (const entry of entries) {
    await prisma.brandConfig.upsert({
      where: { key: entry.key },
      update: { value: entry.value },
      create: { key: entry.key, value: entry.value },
    });
  }

  return NextResponse.json({ success: true });
}
