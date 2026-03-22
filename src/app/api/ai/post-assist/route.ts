import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/claude";
import { loadBrandContext, buildSystemPromptFromContext } from "@/lib/brand-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { postId, message, conversationHistory, videoDuration } = await req.json();

    if (!postId || !message) {
      return NextResponse.json({ error: "postId and message required" }, { status: 400 });
    }

    // Load the post with all data
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { platformStatuses: true, hooks: true, series: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post nicht gefunden" }, { status: 404 });
    }

    // Load brand context
    const brandCtx = await loadBrandContext();
    const brandPrompt = buildSystemPromptFromContext(brandCtx);

    // Load skill prompt for this format
    let skillPrompt = "";
    if (brandCtx.skillPrompts) {
      try {
        const skills = JSON.parse(brandCtx.skillPrompts);
        const formatSkill = skills[post.format];
        if (formatSkill) {
          skillPrompt = `\n\nSKILL PROMPT — ${formatSkill.name}:\n${formatSkill.prompt}`;
        }
      } catch { /* ignore */ }
    }

    // Load style guide
    const styleGuide = brandCtx.styleGuide
      ? `\n\nSTYLE GUIDE:\n${brandCtx.styleGuide}`
      : "";

    // Load hooks library for reference
    const topHooks = await prisma.hook.findMany({
      where: { isFavorite: true },
      take: 5,
      select: { text: true, type: true, performanceScore: true },
    });
    const hooksRef = topHooks.length > 0
      ? `\n\nTOP HOOKS (Referenz):\n${topHooks.map((h) => `- "${h.text}" (${h.type}, ${h.performanceScore || "?"}%)`).join("\n")}`
      : "";

    // Build the specialized system prompt
    const systemPrompt = `${brandPrompt}
${styleGuide}
${skillPrompt}
${hooksRef}

AKTUELLER POST — Alle Details:
- Titel: "${post.title}"
- Hook: "${post.hook || "(noch leer)"}"
- Ziel & Idee: "${post.thumbnailIdea || "(nicht definiert)"}"
- Gewünschte Video-Dauer: ${videoDuration ? `${videoDuration} Sekunden` : "nicht angegeben"}
- Säule: ${post.pillar}
- Format: ${post.format}
- Plattformen: ${post.platforms}
- Status: ${post.status}
- Geplant für: ${post.scheduledDate ? new Date(post.scheduledDate).toLocaleDateString("de-DE") : "nicht geplant"}
- Script: ${post.script || "(noch leer)"}
- Caption: ${post.caption || "(noch leer)"}
- Hashtags: ${post.hashtags || "(noch leer)"}
- CTA: ${post.ctaText || "(noch leer)"}
- Platform-Content: ${post.platformContent || "(leer)"}

DEINE AUFGABE:
Du bist der Content-Assistent für diesen spezifischen Post. Du hast Zugriff auf:
- Den kompletten Brand-Kontext (Positionierung, Tone, Zielgruppe)
- Den Style Guide (Sprache, Hook-Patterns, CTA-Varianten, Anti-Patterns)
- Den Skill Prompt für das Format "${post.format}"
- Die Top-Hooks aus der Hook-Bibliothek
- Alle Details dieses Posts

Wenn du ein SCRIPT erstellst:
- Nutze den Skill Prompt als Vorlage für die Struktur
- WICHTIG: Gib das Script als JSON-Array zurück im folgenden Format:
\`\`\`json
[
  { "time": "0-3s", "speech": "Sprechtext hier...", "visual": "Talking Head, direkt in Kamera" },
  { "time": "3-8s", "speech": "Nächster Abschnitt...", "visual": "B-Roll: Screencast von Tool" },
  ...
]
\`\`\`
- Jede Zeile hat: time (Zeitfenster), speech (was gesagt wird), visual (was man sieht)
- Die Zeitangaben müssen zur gewünschten Video-Dauer passen
- Der Sprechtext muss natürlich und im Style Guide Ton sein
- Die visuellen Anweisungen müssen konkret und umsetzbar sein (Talking Head, Screencast, Text-Overlay, B-Roll etc.)

Wenn du eine CAPTION erstellst:
- Passe an die Plattform an (Instagram ≠ LinkedIn ≠ TikTok)
- Nutze den richtigen CTA für die Plattform

Wenn du HASHTAGS erstellst:
- 5-10 relevante Hashtags
- Mix aus großen und Nischen-Hashtags

Antworte immer auf Deutsch, direkt und umsetzbar.`;

    // Build messages with history
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: message });

    const response = await chat(systemPrompt, messages);

    return NextResponse.json({ message: response });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
