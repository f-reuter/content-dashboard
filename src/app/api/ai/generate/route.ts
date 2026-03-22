import { generateContent } from "@/lib/claude";
import { AI_PROMPTS } from "@/lib/brand-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pillar = body.pillar || "alle";
    const count = body.count || 5;
    const context = body.context || "";

    const userPrompt = `Generiere ${count} Content-Ideen${pillar !== "alle" ? ` für die Säule "${pillar}"` : ""}.
${context ? `Kontext/Trend: ${context}` : ""}
Antworte NUR mit einem JSON-Array, kein anderer Text.`;

    const result = await generateContent(AI_PROMPTS.ideaGenerator, userPrompt);

    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Konnte keine Ideen parsen", raw: result }, { status: 500 });
    }

    const ideas = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ideas });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
