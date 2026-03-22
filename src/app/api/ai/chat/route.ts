import { prisma } from "@/lib/prisma";
import { chatWithTools } from "@/lib/claude";
import { loadBrandContext, buildSystemPromptFromContext } from "@/lib/brand-context";
import { CHAT_TOOLS, TOOL_META, executeTool } from "@/lib/chat-tools";
import { NextRequest, NextResponse } from "next/server";

async function buildSystemPrompt(): Promise<string> {
  const brandCtx = await loadBrandContext();
  const basePrompt = buildSystemPromptFromContext(brandCtx);

  const [postCount, publishedCount, scheduledPosts, recentTrends, competitorCount] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.findMany({
        where: { scheduledDate: { gte: new Date() } },
        orderBy: { scheduledDate: "asc" },
        take: 5,
        select: { title: true, scheduledDate: true, platforms: true },
      }),
      prisma.trendSnapshot.findMany({
        orderBy: { scannedAt: "desc" },
        take: 5,
        select: { name: true, urgency: true, pillar: true },
      }),
      prisma.competitor.count({ where: { isActive: true } }),
    ]);

  const statsSection = `
AKTUELLE STATISTIKEN:
- ${postCount} Posts gesamt, ${publishedCount} veröffentlicht
- ${scheduledPosts.length} geplante Posts: ${scheduledPosts.map((p) => `"${p.title}" (${p.scheduledDate?.toLocaleDateString("de-DE")})`).join(", ") || "keine"}
- ${recentTrends.length} aktuelle Trends: ${recentTrends.map((t) => `${t.name} (Urgency: ${t.urgency})`).join(", ") || "keine"}
- ${competitorCount} Competitors werden getrackt

WICHTIG: Du hast Tools zur Verfügung um direkt auf der Plattform zu arbeiten. Nutze sie aktiv:
- create_post: Post erstellen und optional einplanen
- create_idea: Idee zum Pool hinzufügen
- get_calendar: Geplante Posts abrufen
- get_trends: Aktuelle Trends laden
- get_ideas: Ideen aus dem Pool laden
Wenn der User etwas erstellen oder planen möchte, nutze die Tools direkt. Frage vorher kurz ob die Details stimmen.
Heute ist ${new Date().toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

  return basePrompt + "\n" + statsSection;
}

export async function POST(req: NextRequest) {
  try {
    const { conversationId, message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const systemPrompt = await buildSystemPrompt();

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.chatConversation.create({
        data: { title: message.slice(0, 80) },
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { conversationId: convId, role: "user", content: message },
    });

    // Load conversation history
    const history = await prisma.chatMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    // Call Claude with tools
    const result = await chatWithTools(
      systemPrompt,
      history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      CHAT_TOOLS
    );

    // Process tool uses
    const pendingActions: Array<{
      id: string;
      tool: string;
      label: string;
      input: Record<string, unknown>;
      confirmRequired: boolean;
    }> = [];

    // For read-only tools (get_*), execute immediately and feed back to Claude
    if (result.toolUses.length > 0) {
      const readOnlyResults: Array<{ id: string; result: string }> = [];

      for (const toolUse of result.toolUses) {
        const meta = TOOL_META[toolUse.name];
        if (meta && !meta.confirmRequired) {
          // Execute read-only tools immediately
          const toolResult = await executeTool(toolUse.name, toolUse.input);
          readOnlyResults.push({
            id: toolUse.id,
            result: JSON.stringify(toolResult.data),
          });
        } else {
          // Collect write tools as pending actions
          pendingActions.push({
            id: toolUse.id,
            tool: toolUse.name,
            label: meta?.label || toolUse.name,
            input: toolUse.input,
            confirmRequired: true,
          });
        }
      }

      // If there were read-only tools, continue the conversation with results
      if (readOnlyResults.length > 0 && pendingActions.length === 0) {
        const toolResultMessages = readOnlyResults.map((r) => ({
          type: "tool_result" as const,
          tool_use_id: r.id,
          content: r.result,
        }));

        // Build extended history with tool use + results
        const extendedHistory = [
          ...history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "assistant" as const, content: result.toolUses.map((tu) => ({ type: "tool_use" as const, id: tu.id, name: tu.name, input: tu.input })) },
          { role: "user" as const, content: toolResultMessages },
        ];

        const followUp = await chatWithTools(systemPrompt, extendedHistory, CHAT_TOOLS);
        const finalText = followUp.text || result.text;

        await prisma.chatMessage.create({
          data: { conversationId: convId, role: "assistant", content: finalText },
        });

        return NextResponse.json({
          conversationId: convId,
          message: finalText,
          pendingActions: [],
        });
      }
    }

    // Save assistant text response (with action metadata if present)
    const contentToSave = pendingActions.length > 0
      ? JSON.stringify({ text: result.text, actions: pendingActions })
      : result.text;

    await prisma.chatMessage.create({
      data: { conversationId: convId, role: "assistant", content: contentToSave },
    });

    if (!conversationId) {
      await prisma.chatConversation.update({
        where: { id: convId },
        data: { title: message.slice(0, 80) },
      });
    }

    return NextResponse.json({
      conversationId: convId,
      message: result.text,
      pendingActions,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: List conversations or load messages
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");

  if (conversationId) {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  }

  const conversations = await prisma.chatConversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: { _count: { select: { messages: true } } },
  });
  return NextResponse.json(conversations);
}

// DELETE: Delete a conversation
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.chatConversation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
