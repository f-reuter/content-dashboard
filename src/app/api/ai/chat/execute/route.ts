import { prisma } from "@/lib/prisma";
import { executeTool } from "@/lib/chat-tools";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, actionId, tool, input, approved } = await req.json();

    if (!conversationId || !tool) {
      return NextResponse.json({ error: "conversationId and tool required" }, { status: 400 });
    }

    if (!approved) {
      // User rejected the action
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: JSON.stringify({
            type: "action_result",
            actionId,
            tool,
            success: false,
            message: "Aktion abgebrochen.",
          }),
        },
      });
      return NextResponse.json({ success: true, cancelled: true });
    }

    // Execute the tool
    const result = await executeTool(tool, input);

    // Save result as message
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: JSON.stringify({
          type: "action_result",
          actionId,
          tool,
          success: result.success,
          message: result.message,
          data: result.data,
        }),
      },
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
