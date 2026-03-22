export const PILLARS = {
  AI: { label: "AI im Alltag", color: "bg-blue-500", textColor: "text-blue-700", target: 40 },
  EFFICIENCY: { label: "Effizienz-Systeme", color: "bg-green-500", textColor: "text-green-700", target: 25 },
  FITNESS: { label: "Fitness & Energie", color: "bg-orange-500", textColor: "text-orange-700", target: 20 },
  REALTALK: { label: "Real Talk / BTS", color: "bg-purple-500", textColor: "text-purple-700", target: 15 },
} as const;

export type PillarKey = keyof typeof PILLARS;

export const FORMATS = {
  REEL: "Reel / TikTok",
  CAROUSEL: "Carousel",
  YOUTUBE_LONG: "YouTube Longform",
  YOUTUBE_SHORT: "YouTube Short",
  LINKEDIN: "LinkedIn Post",
  STORY: "Story",
} as const;

export type FormatKey = keyof typeof FORMATS;

export const PLATFORMS = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  LINKEDIN: "LinkedIn",
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

export const PLATFORM_CHANNELS = {
  INSTAGRAM: { label: "Instagram", color: "bg-pink-500", textColor: "text-pink-700" },
  TIKTOK: { label: "TikTok", color: "bg-gray-900", textColor: "text-gray-900" },
  YOUTUBE_LONG: { label: "YouTube Long", color: "bg-red-500", textColor: "text-red-700" },
  YOUTUBE_SHORT: { label: "YouTube Shorts", color: "bg-red-400", textColor: "text-red-600" },
  LINKEDIN: { label: "LinkedIn", color: "bg-blue-600", textColor: "text-blue-700" },
} as const;

export type PlatformChannelKey = keyof typeof PLATFORM_CHANNELS;

export function expandPlatformsToChannels(
  platforms: string,
  format?: string
): PlatformChannelKey[] {
  const list = platforms.split(",").map((p) => p.trim()).filter(Boolean);
  const channels: PlatformChannelKey[] = [];
  for (const p of list) {
    if (p === "YOUTUBE") {
      if (format === "YOUTUBE_LONG") {
        channels.push("YOUTUBE_LONG");
      } else if (format === "YOUTUBE_SHORT") {
        channels.push("YOUTUBE_SHORT");
      } else {
        channels.push("YOUTUBE_LONG", "YOUTUBE_SHORT");
      }
    } else if (p in PLATFORM_CHANNELS) {
      channels.push(p as PlatformChannelKey);
    }
  }
  return channels;
}

export const STATUSES = {
  IDEA: { label: "Idee", order: 0 },
  SCRIPTED: { label: "Script", order: 1 },
  FILMED: { label: "Gedreht", order: 2 },
  EDITED: { label: "Geschnitten", order: 3 },
  SCHEDULED: { label: "Geplant", order: 4 },
  PUBLISHED: { label: "Veröffentlicht", order: 5 },
} as const;

export type StatusKey = keyof typeof STATUSES;

export const HOOK_TYPES = {
  QUESTION: "Frage",
  CONTROVERSIAL: "Kontrovers",
  RESULT: "Ergebnis",
  SHOCK: "Schock",
  STORY: "Story",
} as const;

export const BRAND = {
  name: "Felix Reuter",
  handle: "@felix_reuter",
  positioning: "Ich zeige dir, wie du mit KI und kleinen Veränderungen doppelt so effizient wirst — ohne dein Leben umzukrempeln.",
  tone: "Authentisch, direkt, kein Geschwafel. Wie ein kluger Freund der dir einen Tipp gibt — nicht wie ein Guru. Du-Ansprache. Deutsch.",
  antiPatterns: [
    "Kein Hustle-Culture-Bullshit",
    "Keine 5-Uhr-Routinen",
    "Kein Fake-Lifestyle",
    "Keine übertriebenen Versprechen",
  ],
};

// Default brand config keys and values for DB seeding
export const BRAND_DEFAULTS: Record<string, string> = {
  name: BRAND.name,
  handle: BRAND.handle,
  positioning: BRAND.positioning,
  tone: BRAND.tone,
  antiPatterns: JSON.stringify(BRAND.antiPatterns),
  audience: "25-40 jährige deutschsprachige Unternehmer, Selbstständige und ambitionierte Angestellte die produktiver werden wollen. Tech-affin, aber keine Entwickler. Wollen mit KI effizienter arbeiten, nicht programmieren.",
  pillars: JSON.stringify([
    { key: "AI", label: "AI im Alltag", description: "Tools, Hacks, Trends, greifbar erklärt", target: 40 },
    { key: "EFFICIENCY", label: "Effizienz-Systeme", description: "Routinen, Workflows, Automatisierungen", target: 25 },
    { key: "FITNESS", label: "Fitness & Energie", description: "Training, Ernährung, Leistungsfähigkeit", target: 20 },
    { key: "REALTALK", label: "Real Talk / BTS", description: "Unternehmerleben, ehrliche Einblicke", target: 15 },
  ]),
  platformStrategy: JSON.stringify({
    INSTAGRAM: { focus: "Reels + Carousel", frequency: "5x/Woche", tone: "Locker, visual, Hook-fokussiert" },
    TIKTOK: { focus: "Kurzvideos", frequency: "5x/Woche", tone: "Schnell, direkt, Trend-basiert" },
    YOUTUBE: { focus: "Longform + Shorts", frequency: "2x/Woche", tone: "Tiefgehend, Tutorial-Style" },
    LINKEDIN: { focus: "Text-Posts + Carousel", frequency: "3x/Woche", tone: "Professionell aber persönlich" },
  }),
  styleGuide: `Felix Reuter — Content Style Guide

SPRACHE & TON:
- Du-Ansprache, immer. Nie Sie.
- Deutsch, kein Denglisch außer bei etablierten Tech-Begriffen (App, Tool, Workflow, Prompt)
- Kurze Sätze. Max 15 Wörter pro Satz.
- Aktiv statt passiv. "Ich nutze..." statt "Es wird genutzt..."
- Direkt, ohne Umschweife. Kein "Heute möchte ich euch zeigen..." → Direkt rein: "Das Tool spart dir 2 Stunden am Tag."
- Kein Clickbait der nicht hält was er verspricht. Provokant ja, aber ehrlich.

HOOK-PATTERNS:
1. Kontroverse Aussage: "Warum 99% der Leute KI falsch nutzen"
2. Neugier-Lücke: "Dieses Tool kennt fast niemand — dabei ist es kostenlos"
3. Ergebnis-First: "Ich habe 30 Tage nur mit KI gearbeitet — das ist passiert"
4. POV/Relatable: "POV: Du nutzt ChatGPT wie ein Anfänger"
5. Direkte Ansprache: "Wenn du noch E-Mails manuell beantwortest, musst du das sehen"

CTA-VARIANTEN:
- Instagram: "Speichern für später" / "Folg mir für mehr KI-Tipps"
- TikTok: "Folgen für Teil 2" / "Kommentier welches Tool du testen willst"
- YouTube: "Abonnieren + Glocke für wöchentliche KI-Updates"
- LinkedIn: "Was nutzt ihr? Schreibt's in die Kommentare"

PLATTFORM-ANPASSUNGEN:
- Instagram Reels: Visuell, Emoji in Captions, 5-10 Hashtags, Speichern-CTA
- TikTok: Schnell, Trend-Sounds, Hashtags in Caption, unter 60s ideal
- YouTube Shorts: Clean, kein Trend-Sound nötig, Subscribe-CTA
- YouTube Long: Tutorial-Style, Kapitelmarken, 10-20 Min, Thumbnail-Text
- LinkedIn: Professionell aber persönlich, keine Emojis übertreiben, Story-Format

ANTI-PATTERNS IM CONTENT:
- Nie: "Hey Leute, willkommen zurück auf meinem Kanal"
- Nie: "Bevor wir anfangen, liked und abonniert"
- Nie: Hustle-Culture, 5-Uhr-Routinen, Fake-Lifestyle
- Nie: Übertriebene Versprechen ("10x dein Einkommen")
- Nie: Roboter-Sprache oder KI-typische Floskeln
- Nie: Lange Intros oder unnötige Wiederholungen`,
  skillPrompts: JSON.stringify({
    REEL: {
      name: "Reel / TikTok Script",
      prompt: `Erstelle ein Reel/TikTok-Script (30-60 Sekunden).

STRUKTUR:
HOOK (0-3s): Pattern-Interrupt. Kontroverse Aussage, Frage oder überraschendes Ergebnis.
PROBLEM (3-8s): Warum das den Zuschauer betrifft.
LÖSUNG (8-45s): Konkreter Tipp — zeigen, nicht nur erzählen. Schnelle Cuts.
CTA (letzte 5s): Folgen, Speichern, Kommentieren.

REGELN:
- Kurze Sätze, max 10 Wörter
- Kein "Hey Leute" oder "Willkommen zurück"
- Direkt zum Punkt
- Regie-Hinweise in [eckigen Klammern]
- Zeitangaben in Sekunden`,
    },
    YOUTUBE_LONG: {
      name: "YouTube Longform Script",
      prompt: `Erstelle ein YouTube-Video-Script (10-20 Minuten).

STRUKTUR:
HOOK (0-30s): Starker Einstieg, keine Intro-Sequenz. Direkt Mehrwert zeigen.
KAPITEL 1-4: Jeweils mit Überleitung. Pro Kapitel 3-5 Minuten.
ZUSAMMENFASSUNG: Kernpunkte wiederholen.
CTA: Abonnieren + nächstes Video anteasern.

REGELN:
- Kapitelmarken angeben [00:00]
- Retentions-Hooks alle 2-3 Minuten ("Aber das Beste kommt noch...")
- B-Roll Hinweise für Screencast/Footage
- Natürlicher Sprechstil, kein Ablesen`,
    },
    YOUTUBE_SHORT: {
      name: "YouTube Short Script",
      prompt: `Erstelle ein YouTube Short Script (unter 60 Sekunden).

Wie Reel, aber:
- Kein Trend-Sound nötig
- Subscribe-CTA statt Folgen
- Cleaner Look, weniger Text-Overlays
- Direkt umsetzbar, ein klarer Takeaway`,
    },
    CAROUSEL: {
      name: "Instagram Carousel",
      prompt: `Erstelle ein Instagram Carousel (5-10 Slides).

STRUKTUR:
Slide 1: Hook-Slide (muss stoppen beim Swipen). Bold Statement oder Frage.
Slides 2-8: Je ein Punkt/Tipp. Kurz, max 3 Zeilen pro Slide.
Vorletzte Slide: Zusammenfassung / Key Takeaway.
Letzte Slide: CTA (Speichern, Teilen, Folgen).

REGELN:
- Jede Slide muss für sich stehen
- Nummerierung nutzen (1/8, 2/8...)
- Text groß und lesbar
- Einheitliches Design-Schema`,
    },
    LINKEDIN: {
      name: "LinkedIn Post",
      prompt: `Erstelle einen LinkedIn Post (Text-Format).

STRUKTUR:
Zeile 1: Hook (max 10 Wörter). Muss zum Klicken auf "mehr" animieren.
Absatz 1: Persönliche Story oder kontroverses Statement.
Absatz 2-3: Konkrete Learnings/Tipps. Nummeriert oder mit Emojis.
Letzter Absatz: CTA (Frage an die Community).

REGELN:
- Professionell aber persönlich
- Absätze mit Leerzeile trennen
- Keine übertriebenen Emojis (max 3-5 im ganzen Post)
- Hashtags am Ende (3-5 relevante)
- Story-Format funktioniert am besten`,
    },
    STORY: {
      name: "Instagram/TikTok Story",
      prompt: `Erstelle eine Story-Sequenz (3-7 Frames).

STRUKTUR:
Frame 1: Hook / Teaser ("Ich zeig euch mal...")
Frames 2-5: Content (Behind-the-Scenes, Quick-Tip, Poll)
Letzter Frame: CTA (Link, Swipe-Up, Antwort-Sticker)

REGELN:
- Casual, authentisch, unpoliert
- Sticker/Polls/Fragen einbauen
- Jeder Frame max 5 Sekunden lesbar`,
    },
  }),
};

export function buildSystemPromptFromContext(ctx: Record<string, string>): string {
  const pillars = JSON.parse(ctx.pillars || "[]");
  const antiPatterns = JSON.parse(ctx.antiPatterns || "[]");
  const pillarText = pillars
    .map((p: { label: string; description: string; target: number }) => `- ${p.label} (${p.target}%) — ${p.description}`)
    .join("\n");
  const antiText = antiPatterns.join(", ");

  return `Du bist der persönliche Content-Strategie-Assistent für ${ctx.name} (${ctx.handle}).

POSITIONIERUNG:
${ctx.positioning}

TONALITÄT:
${ctx.tone}

ZIELGRUPPE:
${ctx.audience}

CONTENT-SÄULEN:
${pillarText}

ANTI-PATTERNS: ${antiText}

${ctx.styleGuide ? `STYLE GUIDE:\n${ctx.styleGuide}` : ""}

Du antwortest auf Deutsch, direkt und umsetzbar. Kein Geschwafel, keine Floskeln.
Du hilfst bei: Content-Ideen, Scripts, Posting-Strategie, Trend-Analyse, KPI-Bewertung.
Halte dich IMMER an den Style Guide wenn du Content erstellst.`;
}

export const AI_PROMPTS = {
  ideaGenerator: `Du bist ein Content-Stratege für Felix Reuter (@felix_reuter), einen 30-jährigen KI-Unternehmer im deutschen Markt.

Positionierung: "${BRAND.positioning}"
Ton: ${BRAND.tone}

Content-Säulen:
- AI im Alltag (40%) — Tools, Hacks, Trends, greifbar erklärt
- Effizienz-Systeme (25%) — Routinen, Workflows, Automatisierungen
- Fitness & Energie (20%) — Training, Ernährung, Leistungsfähigkeit
- Real Talk / BTS (15%) — Unternehmerleben, ehrliche Einblicke

Anti-Patterns: ${BRAND.antiPatterns.join(", ")}

Generiere Content-Ideen im folgenden JSON-Format:
[{
  "hook": "Die ersten 1-2 Sekunden / erste Zeile — muss stoppen",
  "description": "Worum geht es, was ist der Mehrwert",
  "pillar": "AI | EFFICIENCY | FITNESS | REALTALK",
  "format": "REEL | CAROUSEL | YOUTUBE_LONG | YOUTUBE_SHORT | LINKEDIN",
  "platforms": ["INSTAGRAM", "TIKTOK", "YOUTUBE", "LINKEDIN"],
  "cta": "Call to Action"
}]

Hooks müssen Pattern-Interrupt sein: Frage, kontroverse Aussage, oder überraschendes Ergebnis.
Jede Idee muss direkt umsetzbar sein — kein theoretisches Blabla.`,

  scriptWriter: `Du schreibst Video-Scripts für Felix Reuter (@felix_reuter).

Ton: ${BRAND.tone}

Stil-Regeln:
- Kurze Sätze. Pausen einbauen.
- Keine Filler-Wörter minimieren
- Direkt zum Punkt — kein "Hey Leute, willkommen zurück"
- Kontroverse oder überraschende Hooks
- Immer einen konkreten Takeaway / umsetzbare Aktion
- Endet mit starkem CTA

Script-Struktur:
HOOK (0-3s): [Pattern-Interrupt]
PROBLEM (3-10s): [Warum das den Zuschauer betrifft]
LÖSUNG (10-50s): [Konkreter Tipp — zeigen, nicht nur erzählen]
CTA (letzte 5-10s): [Folgen, kommentieren, speichern]

Liefere:
1. Das Script mit Zeitangaben
2. Caption für Instagram/TikTok
3. 5 relevante Hashtags
4. Thumbnail-/Cover-Idee (1 Satz)`,

  trendScanner: `Du bist ein AI/Tech-Trend-Analyst für den deutschen Content-Markt.
Analysiere aktuelle Trends und bewerte ihr Content-Potenzial für einen KI-Unternehmer der seine Audience im deutschen Markt aufbaut.

Für jeden Trend liefere:
- Trend-Name
- Warum es relevant ist
- Content-Idee dazu (Hook + Kernbotschaft)
- Dringlichkeit (1-5): Wie schnell muss Content dazu kommen?
- Säule: AI | EFFICIENCY | FITNESS | REALTALK`,
};
