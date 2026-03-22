import { prisma } from "@/lib/prisma";
import { expandPlatformsToChannels } from "@/lib/brand-config";
import type Anthropic from "@anthropic-ai/sdk";

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "create_post",
    description:
      "Erstellt einen neuen Social-Media-Post im Content-Kalender. Nutze dieses Tool wenn der User einen Post erstellen, planen oder anlegen möchte.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titel des Posts" },
        hook: { type: "string", description: "Hook-Text (erste 1-2 Sekunden)" },
        pillar: {
          type: "string",
          enum: ["AI", "EFFICIENCY", "FITNESS", "REALTALK"],
          description: "Content-Säule",
        },
        format: {
          type: "string",
          enum: ["REEL", "CAROUSEL", "YOUTUBE_LONG", "YOUTUBE_SHORT", "LINKEDIN", "STORY"],
          description: "Content-Format",
        },
        platforms: {
          type: "array",
          items: { type: "string", enum: ["INSTAGRAM", "TIKTOK", "YOUTUBE", "LINKEDIN"] },
          description: "Ziel-Plattformen",
        },
        status: {
          type: "string",
          enum: ["IDEA", "SCRIPTED", "SCHEDULED"],
          description: "Post-Status",
        },
        scheduledDate: { type: "string", description: "Geplantes Datum (ISO 8601)" },
        caption: { type: "string", description: "Caption-Text" },
        hashtags: { type: "string", description: "Hashtags, komma-separiert" },
        script: { type: "string", description: "Video-Script" },
      },
      required: ["title", "pillar", "format", "platforms"],
    },
  },
  {
    name: "create_idea",
    description:
      "Fügt eine Content-Idee zum Ideen-Pool hinzu. Nutze dieses Tool wenn der User Ideen sammeln oder speichern möchte.",
    input_schema: {
      type: "object" as const,
      properties: {
        hook: { type: "string", description: "Hook / Headline der Idee" },
        description: { type: "string", description: "Beschreibung der Idee" },
        pillar: {
          type: "string",
          enum: ["AI", "EFFICIENCY", "FITNESS", "REALTALK"],
          description: "Content-Säule",
        },
        format: {
          type: "string",
          enum: ["REEL", "CAROUSEL", "YOUTUBE_LONG", "YOUTUBE_SHORT", "LINKEDIN", "STORY"],
        },
      },
      required: ["hook", "pillar"],
    },
  },
  {
    name: "get_calendar",
    description:
      "Ruft die geplanten Posts für einen Zeitraum ab. Nutze dieses Tool um zu sehen was bereits geplant ist.",
    input_schema: {
      type: "object" as const,
      properties: {
        startDate: { type: "string", description: "Start-Datum (ISO 8601)" },
        endDate: { type: "string", description: "End-Datum (ISO 8601)" },
      },
    },
  },
  {
    name: "get_trends",
    description: "Ruft die aktuellen Trend-Snapshots ab.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Anzahl der Trends (default 5)" },
      },
    },
  },
  {
    name: "get_ideas",
    description: "Ruft bestehende Ideen aus dem Ideen-Pool ab.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Anzahl der Ideen (default 10)" },
      },
    },
  },
];

// Tool labels for UI
export const TOOL_META: Record<string, { label: string; icon: string; confirmRequired: boolean }> = {
  create_post: { label: "Post erstellen", icon: "calendar", confirmRequired: true },
  create_idea: { label: "Idee speichern", icon: "lightbulb", confirmRequired: true },
  get_calendar: { label: "Kalender abrufen", icon: "calendar", confirmRequired: false },
  get_trends: { label: "Trends abrufen", icon: "trending-up", confirmRequired: false },
  get_ideas: { label: "Ideen abrufen", icon: "lightbulb", confirmRequired: false },
};

export interface ToolResult {
  success: boolean;
  data: unknown;
  message: string;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case "create_post": {
      const platformsStr = Array.isArray(input.platforms)
        ? (input.platforms as string[]).join(",")
        : String(input.platforms || "INSTAGRAM");

      const post = await prisma.post.create({
        data: {
          title: String(input.title),
          hook: input.hook ? String(input.hook) : null,
          pillar: String(input.pillar),
          format: String(input.format),
          platforms: platformsStr,
          status: String(input.status || "IDEA"),
          scheduledDate: input.scheduledDate ? new Date(String(input.scheduledDate)) : null,
          caption: input.caption ? String(input.caption) : null,
          hashtags: input.hashtags ? String(input.hashtags) : null,
          script: input.script ? String(input.script) : null,
        },
      });

      // Create platform statuses
      const channels = expandPlatformsToChannels(platformsStr, String(input.format || ""));
      if (channels.length > 0) {
        await prisma.postPlatformStatus.createMany({
          data: channels.map((platform) => ({ postId: post.id, platform })),
        });
      }

      return {
        success: true,
        data: post,
        message: `Post "${post.title}" erstellt${post.scheduledDate ? ` und für ${new Date(post.scheduledDate).toLocaleDateString("de-DE")} geplant` : ""}.`,
      };
    }

    case "create_idea": {
      const idea = await prisma.idea.create({
        data: {
          hook: String(input.hook),
          description: input.description ? String(input.description) : null,
          pillar: String(input.pillar),
          format: input.format ? String(input.format) : null,
        },
      });
      return {
        success: true,
        data: idea,
        message: `Idee "${idea.hook}" zum Ideen-Pool hinzugefügt.`,
      };
    }

    case "get_calendar": {
      const where: Record<string, unknown> = {};
      if (input.startDate || input.endDate) {
        where.scheduledDate = {};
        if (input.startDate) (where.scheduledDate as Record<string, unknown>).gte = new Date(String(input.startDate));
        if (input.endDate) (where.scheduledDate as Record<string, unknown>).lte = new Date(String(input.endDate));
      }
      const posts = await prisma.post.findMany({
        where,
        orderBy: { scheduledDate: "asc" },
        take: 20,
        select: { id: true, title: true, pillar: true, format: true, platforms: true, status: true, scheduledDate: true },
      });
      return {
        success: true,
        data: posts,
        message: `${posts.length} Posts gefunden.`,
      };
    }

    case "get_trends": {
      const trends = await prisma.trendSnapshot.findMany({
        orderBy: { scannedAt: "desc" },
        take: Number(input.limit) || 5,
      });
      return {
        success: true,
        data: trends,
        message: `${trends.length} Trends geladen.`,
      };
    }

    case "get_ideas": {
      const ideas = await prisma.idea.findMany({
        where: { convertedToPostId: null },
        orderBy: { rating: "desc" },
        take: Number(input.limit) || 10,
      });
      return {
        success: true,
        data: ideas,
        message: `${ideas.length} Ideen geladen.`,
      };
    }

    default:
      return { success: false, data: null, message: `Unbekanntes Tool: ${name}` };
  }
}
