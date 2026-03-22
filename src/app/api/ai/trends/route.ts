import { generateContent } from "@/lib/claude";
import { AI_PROMPTS } from "@/lib/brand-config";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const userPrompt = `Was sind die aktuellen Top-5 AI/Tech-Trends die Content-wuerdig sind?
Fokus auf den deutschen Markt. Antworte als JSON-Array mit den Feldern:
[{ "name": "", "relevance": "", "hookIdea": "", "urgency": 1-5, "pillar": "AI|EFFICIENCY|FITNESS|REALTALK" }]
NUR JSON, kein anderer Text.`;

    const result = await generateContent(AI_PROMPTS.trendScanner, userPrompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Parse error", raw: result }, { status: 500 });
    }
    return NextResponse.json({ trends: JSON.parse(jsonMatch[0]) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
