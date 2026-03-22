"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  TrendingUp,
  Lightbulb,
  Check,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
}

interface PendingAction {
  id: string;
  tool: string;
  label: string;
  input: Record<string, unknown>;
  confirmRequired: boolean;
  status?: "pending" | "confirmed" | "cancelled";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  pendingActions?: PendingAction[];
}

const QUICK_ACTIONS = [
  { label: "Was soll ich heute posten?", icon: Calendar },
  { label: "Generiere 3 Content-Ideen für diese Woche", icon: Sparkles },
  { label: "Was sind gerade die heißesten Trends?", icon: TrendingUp },
];

const TOOL_ICONS: Record<string, typeof Calendar> = {
  create_post: Calendar,
  create_idea: Lightbulb,
  get_calendar: Calendar,
  get_trends: TrendingUp,
  get_ideas: Lightbulb,
};

function ActionCard({
  action,
  conversationId,
  onExecuted,
}: {
  action: PendingAction;
  conversationId: string;
  onExecuted: () => void;
}) {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const Icon = TOOL_ICONS[action.tool] || Sparkles;

  async function execute(approved: boolean) {
    setExecuting(true);
    try {
      const res = await fetch("/api/ai/chat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          actionId: action.id,
          tool: action.tool,
          input: action.input,
          approved,
        }),
      });
      const data = await res.json();
      setResult({
        success: approved ? data.success : false,
        message: approved ? data.message || "Erledigt!" : "Abgebrochen.",
      });
      action.status = approved ? "confirmed" : "cancelled";
    } catch {
      setResult({ success: false, message: "Fehler bei Ausführung." });
    }
    setExecuting(false);
    onExecuted();
  }

  // Format input data for display
  const displayFields = Object.entries(action.input)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => ({
      key: k,
      value: Array.isArray(v) ? (v as string[]).join(", ") : String(v),
    }));

  if (result) {
    return (
      <div
        className={`rounded-xl border p-3 ${
          result.success ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2 text-sm">
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-400" />
          )}
          <span className={result.success ? "text-green-700" : "text-gray-500"}>
            {result.message}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">{action.label}</span>
      </div>

      <div className="grid gap-1">
        {displayFields.slice(0, 6).map(({ key, value }) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="text-blue-600 font-medium min-w-20">{key}:</span>
            <span className="text-blue-800 truncate">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => execute(true)}
          disabled={executing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {executing ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Check className="mr-1 h-3 w-3" />
          )}
          Bestätigen
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => execute(false)}
          disabled={executing}
        >
          <X className="mr-1 h-3 w-3" />
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

function parseMessageContent(content: string): {
  text: string;
  actions: PendingAction[];
  actionResult: { type: string; success: boolean; message: string } | null;
} {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "action_result") {
      return { text: "", actions: [], actionResult: parsed };
    }
    if (parsed.text !== undefined && parsed.actions) {
      return { text: parsed.text, actions: parsed.actions, actionResult: null };
    }
  } catch {
    // plain text
  }
  return { text: content, actions: [], actionResult: null };
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    const res = await fetch("/api/ai/chat");
    if (res.ok) setConversations(await res.json());
  }, []);

  const loadConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId);
    setPendingActions([]);
    const res = await fetch(`/api/ai/chat?conversationId=${convId}`);
    if (res.ok) setMessages(await res.json());
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingActions]);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || sending) return;

    setSending(true);
    setInput("");
    setPendingActions([]);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvId, message: msg }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, role: "assistant", content: `Fehler: ${data.error}`, createdAt: new Date().toISOString() },
        ]);
      } else {
        if (!activeConvId) setActiveConvId(data.conversationId);

        setMessages((prev) => [
          ...prev,
          { id: `resp-${Date.now()}`, role: "assistant", content: data.message, createdAt: new Date().toISOString() },
        ]);

        if (data.pendingActions?.length > 0) {
          setPendingActions(data.pendingActions);
        }

        fetchConversations();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "Verbindungsfehler.", createdAt: new Date().toISOString() },
      ]);
    }
    setSending(false);
  }

  function startNewChat() {
    setActiveConvId(null);
    setMessages([]);
    setPendingActions([]);
    setInput("");
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/ai/chat?id=${id}`, { method: "DELETE" });
    if (activeConvId === id) startNewChat();
    fetchConversations();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Conversation Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col">
        <Button onClick={startNewChat} className="mb-3">
          <Plus className="mr-2 h-4 w-4" />Neuer Chat
        </Button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                activeConvId === conv.id ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
              }`}
              onClick={() => loadConversation(conv.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate flex-1">{conv.title || "Neuer Chat"}</span>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">AI Content-Assistent</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Ich kenne deine Brand, deine Zielgruppe und deine Strategie. Ich kann Posts erstellen, Ideen speichern und deinen Kalender verwalten!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.map((action) => (
                  <Button key={action.label} variant="outline" size="sm" onClick={() => sendMessage(action.label)}>
                    <action.icon className="mr-1.5 h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm bg-primary text-primary-foreground">
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              );
            }

            // Assistant message — parse for actions/results
            const { text, actions, actionResult } = parseMessageContent(msg.content);

            if (actionResult) {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className={`rounded-xl border p-3 text-sm ${
                    actionResult.success ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                  }`}>
                    <div className="flex items-center gap-2">
                      {actionResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span>{actionResult.message}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[75%] space-y-3">
                  {text && (
                    <div className="rounded-2xl px-4 py-3 text-sm bg-accent">
                      <div className="whitespace-pre-wrap">{text}</div>
                    </div>
                  )}
                  {actions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      conversationId={activeConvId || ""}
                      onExecuted={fetchConversations}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Pending actions from latest response (not in message history yet) */}
          {pendingActions.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[75%] space-y-3">
                {pendingActions.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    conversationId={activeConvId || ""}
                    onExecuted={() => {
                      fetchConversations();
                      if (activeConvId) loadConversation(activeConvId);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-accent rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <Card className="flex-shrink-0">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Schreib eine Nachricht... (Enter zum Senden)"
                rows={1}
                className="min-h-10 max-h-32 resize-none"
              />
              <Button onClick={() => sendMessage()} disabled={!input.trim() || sending} size="icon" className="h-10 w-10 flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
