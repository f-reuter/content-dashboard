import { prisma } from "@/lib/prisma";
import { generateContent } from "@/lib/claude";

export async function analyzeViralContent(
  topContent: Array<{ id: string; title: string | null; caption: string | null; platform: string; views: number; likes: number; viralScore: number | null }>
): Promise<number> {
  if (topContent.length === 0) return 0;

  const contentSummary = topContent
    .map((c, i) => `${i + 1}. [${c.platform}] "${c.title || c.caption?.slice(0, 80) || "Ohne Titel"}" — ${c.views} Views, ${c.likes} Likes, Score: ${c.viralScore?.toFixed(1)}`)
    .join("\n");

  const systemPrompt = `Du bist ein Content-Analyst für den deutschen Social-Media-Markt.
Analysiere virale Inhalte und erkläre WARUM sie viral gingen.
Antworte auf Deutsch. Für jeden Inhalt gib eine kurze Analyse (2-3 Sätze):
- Warum funktioniert das?
- Welches Pattern steckt dahinter?
- Wie könnte man das für einen KI/Effizienz-Creator adaptieren?

Antworte im JSON-Format:
[{ "index": 1, "analysis": "..." }, ...]`;

  try {
    const response = await generateContent(systemPrompt, `Analysiere diese Top-Performer:\n\n${contentSummary}`);
    const analyses = JSON.parse(response.replace(/```json\n?|\n?```/g, ""));

    let updated = 0;
    for (const entry of analyses) {
      const content = topContent[entry.index - 1];
      if (content && entry.analysis) {
        await prisma.scannedContent.update({
          where: { id: content.id },
          data: { aiAnalysis: entry.analysis },
        });
        updated++;
      }
    }
    return updated;
  } catch (error) {
    console.error("Claude viral analysis failed:", error);
    return 0;
  }
}

export async function scanTrends(): Promise<number> {
  const systemPrompt = `Du bist ein AI/Tech-Trend-Analyst für den deutschen Content-Markt.
Analysiere die aktuellsten Trends und bewerte ihr Content-Potenzial für einen KI-Unternehmer.

Für jeden Trend liefere JSON:
[{
  "name": "Trend-Name",
  "description": "Warum relevant, was passiert",
  "platform": "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "LINKEDIN" | null,
  "urgency": 1-5,
  "pillar": "AI" | "EFFICIENCY" | "FITNESS" | "REALTALK",
  "hookIdea": "Konkreter Hook für ein Video/Post dazu"
}]

Liefere 5-8 aktuelle Trends. Fokus auf: KI-Tools, Produktivitäts-Hacks, Creator-Economy, Tech-News.`;

  try {
    const response = await generateContent(
      systemPrompt,
      "Scanne die aktuellen Social-Media- und Tech-Trends für den deutschen Markt. Was geht gerade viral? Welche Themen haben Content-Potenzial?"
    );
    const trends = JSON.parse(response.replace(/```json\n?|\n?```/g, ""));

    for (const trend of trends) {
      await prisma.trendSnapshot.create({
        data: {
          name: trend.name,
          description: trend.description || null,
          platform: trend.platform || null,
          urgency: trend.urgency || 3,
          pillar: trend.pillar || null,
          hookIdea: trend.hookIdea || null,
          source: "claude_analysis",
        },
      });
    }
    return trends.length;
  } catch (error) {
    console.error("Claude trend scan failed:", error);
    return 0;
  }
}
