import { generateContent } from "@/lib/claude";
import { AI_PROMPTS } from "@/lib/brand-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hook, description, format, pillar } = body;

    const userPrompt = `Schreibe ein ${format || "REEL"}-Script für folgende Content-Idee:

Hook: ${hook}
${description ? `Beschreibung: ${description}` : ""}
Säule: ${pillar || "AI"}

Liefere das Script mit Zeitangaben, Caption, Hashtags und Thumbnail-Idee.`;

    const result = await generateContent(AI_PROMPTS.scriptWriter, userPrompt);
    return NextResponse.json({ script: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
