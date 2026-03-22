import { getApiKeyStatus, setApiKey } from "@/lib/api-keys";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const status = await getApiKeyStatus();
  return NextResponse.json(status);
}

export async function PUT(req: NextRequest) {
  const { name, value } = await req.json();
  if (!name || !value) {
    return NextResponse.json({ error: "name and value required" }, { status: 400 });
  }
  await setApiKey(name, value);
  return NextResponse.json({ success: true });
}
