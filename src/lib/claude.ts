import Anthropic from "@anthropic-ai/sdk";
import { getApiKey } from "@/lib/api-keys";

let client: Anthropic | null = null;
let clientKey: string | null = null;

async function getClient() {
  const apiKey = await getApiKey("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt. Bitte in Einstellungen hinterlegen.");

  // Recreate client if key changed
  if (!client || clientKey !== apiKey) {
    client = new Anthropic({ apiKey });
    clientKey = apiKey;
  }
  return client;
}

export async function generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
  const anthropic = await getClient();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = message.content[0];
  if (block.type === "text") return block.text;
  throw new Error("Unexpected response type");
}

export async function chat(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const anthropic = await getClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const block = response.content[0];
  if (block.type === "text") return block.text;
  throw new Error("Unexpected response type");
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ChatWithToolsResult {
  text: string;
  toolUses: ToolUseBlock[];
  stopReason: string;
}

export async function chatWithTools(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string | Anthropic.ContentBlockParam[] }>,
  tools: Anthropic.Tool[]
): Promise<ChatWithToolsResult> {
  const anthropic = await getClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[],
    tools,
  });

  let text = "";
  const toolUses: ToolUseBlock[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use") {
      toolUses.push({
        type: "tool_use",
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      });
    }
  }

  return { text, toolUses, stopReason: response.stop_reason || "end_turn" };
}
