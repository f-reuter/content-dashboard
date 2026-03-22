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
