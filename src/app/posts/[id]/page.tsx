"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PILLARS, FORMATS, STATUSES, PLATFORM_CHANNELS,
  type PillarKey, type PlatformChannelKey,
} from "@/lib/brand-config";
import {
  Save, Check, ArrowLeft, Send, Loader2, Sparkles,
  Calendar, FileText, Film, Scissors, Clock, CheckCircle,
} from "lucide-react";

interface PlatformStatus {
  id: string;
  platform: string;
  published: boolean;
}

interface Post {
  id: string;
  title: string;
  hook: string | null;
  script: string | null;
  caption: string | null;
  hashtags: string | null;
  pillar: string;
  format: string;
  platforms: string;
  status: string;
  scheduledDate: string | null;
  ctaText: string | null;
  thumbnailIdea: string | null;
  platformContent: string | null;
  platformStatuses: PlatformStatus[];
}

interface PlatformContent {
  script?: string;
  caption?: string;
  hashtags?: string;
  cta?: string;
  thumbnailIdea?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STATUS_STEPS = [
  { key: "IDEA", label: "Idee", icon: Sparkles },
  { key: "SCRIPTED", label: "Script", icon: FileText },
  { key: "FILMED", label: "Gefilmt", icon: Film },
  { key: "EDITED", label: "Geschnitten", icon: Scissors },
  { key: "SCHEDULED", label: "Geplant", icon: Clock },
  { key: "PUBLISHED", label: "Live", icon: CheckCircle },
];

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [platformContent, setPlatformContent] = useState<Record<string, PlatformContent>>({});
  const [activePlatform, setActivePlatform] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncPlatforms, setSyncPlatforms] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatConvId, setChatConvId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/posts?id=${postId}`);
    if (!res.ok) return;
    const posts = await res.json();
    const p = Array.isArray(posts) ? posts.find((x: Post) => x.id === postId) : posts;
    if (!p) return;
    setPost(p);

    // Parse platformContent
    const pc: Record<string, PlatformContent> = p.platformContent
      ? JSON.parse(p.platformContent)
      : {};

    // Initialize platforms from post.platforms
    const platforms = p.platforms.split(",").map((s: string) => s.trim());
    for (const pl of platforms) {
      if (!pc[pl]) {
        pc[pl] = {
          script: p.script || "",
          caption: p.caption || "",
          hashtags: p.hashtags || "",
          cta: p.ctaText || "",
          thumbnailIdea: p.thumbnailIdea || "",
        };
      }
    }
    setPlatformContent(pc);
    if (!activePlatform && platforms.length > 0) {
      setActivePlatform(platforms[0]);
    }
  }, [postId, activePlatform]);

  useEffect(() => { fetchPost(); }, [fetchPost]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  async function savePost() {
    if (!post) return;
    setSaving(true);

    // Use the active platform's content as the "main" content
    const mainContent = platformContent[activePlatform] || {};

    await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: post.id,
        title: post.title,
        hook: post.hook,
        pillar: post.pillar,
        format: post.format,
        status: post.status,
        scheduledDate: post.scheduledDate,
        script: mainContent.script || post.script,
        caption: mainContent.caption || post.caption,
        hashtags: mainContent.hashtags || post.hashtags,
        ctaText: mainContent.cta || post.ctaText,
        thumbnailIdea: mainContent.thumbnailIdea || post.thumbnailIdea,
        platformContent: JSON.stringify(platformContent),
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function updateStatus(newStatus: string) {
    if (!post) return;
    setPost({ ...post, status: newStatus });
    await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, status: newStatus }),
    });
  }

  function updatePlatformField(platform: string, field: keyof PlatformContent, value: string) {
    setPlatformContent((prev) => {
      const updated = { ...prev, [platform]: { ...prev[platform], [field]: value } };
      // Sync across all platforms if enabled
      if (syncPlatforms) {
        const allPlatforms = post?.platforms.split(",").map((s) => s.trim()) || [];
        for (const pl of allPlatforms) {
          updated[pl] = { ...updated[pl], [field]: value };
        }
      }
      return updated;
    });
  }

  // Chat functions
  async function sendChat(text?: string) {
    const msg = text || chatInput.trim();
    if (!msg || chatSending) return;
    setChatSending(true);
    setChatInput("");

    // Load skill prompt for current format
    let skillPromptText = "";
    try {
      const brandRes = await fetch("/api/brand-config");
      if (brandRes.ok) {
        const brandData = await brandRes.json();
        if (brandData.skillPrompts) {
          const skills = JSON.parse(brandData.skillPrompts);
          const formatSkill = skills[post?.format || ""] || skills["REEL"];
          if (formatSkill) skillPromptText = `\n\nSKILL PROMPT für ${formatSkill.name}:\n${formatSkill.prompt}`;
        }
      }
    } catch { /* ignore */ }

    const postContext = post
      ? `\n\nKONTEXT — Du arbeitest an diesem Post:\nTitel: "${post.title}"\nHook: "${post.hook || ""}"\nSäule: ${post.pillar}\nFormat: ${post.format}\nPlattformen: ${post.platforms}\nAktuelle Plattform: ${activePlatform}\nStatus: ${post.status}\nScript: ${platformContent[activePlatform]?.script || post.script || "(noch leer)"}${skillPromptText}\n\nWenn du Content generierst, nutze den Skill Prompt als Vorlage und passe an die aktuelle Plattform (${activePlatform}) an.`
      : "";

    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: msg }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: chatConvId,
          message: msg + postContext,
        }),
      });
      const data = await res.json();
      if (!chatConvId && data.conversationId) setChatConvId(data.conversationId);

      setChatMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: data.message || data.error || "Fehler" },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Verbindungsfehler." },
      ]);
    }
    setChatSending(false);
  }

  function applyToField(content: string, field: keyof PlatformContent) {
    if (!activePlatform) return;
    updatePlatformField(activePlatform, field, content);
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const platforms = post.platforms.split(",").map((s) => s.trim());
  const currentContent = platformContent[activePlatform] || {};
  const currentStatusIndex = STATUS_STEPS.findIndex((s) => s.key === post.status);

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      {/* LEFT: Content Editor */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-8 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={post.title}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
            className="text-xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
            placeholder="Post-Titel..."
          />
          <Button onClick={savePost} disabled={saving}>
            {saved ? <><Check className="mr-1 h-4 w-4" />Gespeichert</> : saving ? "..." : <><Save className="mr-1 h-4 w-4" />Speichern</>}
          </Button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-1">
          {STATUS_STEPS.map((step, i) => {
            const isActive = i <= currentStatusIndex;
            const isCurrent = step.key === post.status;
            return (
              <button
                key={step.key}
                onClick={() => updateStatus(step.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <step.icon className="h-3 w-3" />
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Meta */}
        <div className="grid gap-3 grid-cols-3">
          <div>
            <Label className="text-xs">Hook</Label>
            <Input value={post.hook || ""} onChange={(e) => setPost({ ...post, hook: e.target.value })} placeholder="Die ersten 1-2 Sekunden..." />
          </div>
          <div>
            <Label className="text-xs">Säule</Label>
            <select value={post.pillar} onChange={(e) => setPost({ ...post, pillar: e.target.value })} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
              {Object.entries(PILLARS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Datum</Label>
            <Input type="date" value={post.scheduledDate?.split("T")[0] || ""} onChange={(e) => setPost({ ...post, scheduledDate: e.target.value })} />
          </div>
        </div>

        {/* Formate & Plattformen */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Label className="text-xs font-semibold">Formate & Plattformen</Label>
            <p className="text-xs text-muted-foreground">Wähle welche Formate du aus dieser Idee erstellen willst. Plattformen mit gleichem Format teilen sich den Content.</p>
            <div className="space-y-2">
              {Object.entries(FORMATS).map(([fk, fv]) => {
                const isActive = platforms.some((pl) => {
                  const key = `${pl}_${fk}`;
                  return platformContent[key] !== undefined;
                }) || post.format === fk;
                return (
                  <label key={fk} className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${isActive ? "border-primary bg-primary/5" : "hover:bg-accent/50"}`}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => {
                        if (e.target.checked && post.format !== fk) {
                          // Add this format — create a content entry for it
                          const key = `ALL_${fk}`;
                          setPlatformContent((prev) => ({
                            ...prev,
                            [key]: { script: "", caption: "", hashtags: "", cta: "", thumbnailIdea: "" },
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{fv}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Platform Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {platforms.map((pl) => {
            const ch = PLATFORM_CHANNELS[pl as PlatformChannelKey] || { label: pl, color: "bg-gray-400" };
            const status = post.platformStatuses?.find((ps) => ps.platform === pl || ps.platform.startsWith(pl));
            return (
              <button
                key={pl}
                onClick={() => setActivePlatform(pl)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activePlatform === pl ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${ch.color}`} />
                {ch.label}
                {status?.published && <Check className="h-3 w-3 text-green-500" />}
              </button>
            );
          })}
        </div>

        {/* Linked platforms hint */}
        {platforms.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              id="syncPlatforms"
              checked={syncPlatforms}
              onChange={(e) => setSyncPlatforms(e.target.checked)}
            />
            <label htmlFor="syncPlatforms">Content für alle Plattformen gleich halten (z.B. IG Reel = TikTok)</label>
          </div>
        )}

        {/* Platform Content Editor */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div>
              <Label>Script</Label>
              <Textarea
                rows={10}
                value={currentContent.script || ""}
                onChange={(e) => updatePlatformField(activePlatform, "script", e.target.value)}
                placeholder="Video-Script..."
                className="font-mono text-sm"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Caption</Label>
                <Textarea
                  rows={5}
                  value={currentContent.caption || ""}
                  onChange={(e) => updatePlatformField(activePlatform, "caption", e.target.value)}
                  placeholder={`Caption für ${PLATFORM_CHANNELS[activePlatform as PlatformChannelKey]?.label || activePlatform}...`}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Hashtags</Label>
                  <Input
                    value={currentContent.hashtags || ""}
                    onChange={(e) => updatePlatformField(activePlatform, "hashtags", e.target.value)}
                    placeholder="#KI #AI #Produktivität"
                  />
                </div>
                <div>
                  <Label>CTA</Label>
                  <Input
                    value={currentContent.cta || ""}
                    onChange={(e) => updatePlatformField(activePlatform, "cta", e.target.value)}
                    placeholder="Call to Action..."
                  />
                </div>
                <div>
                  <Label>Thumbnail-Idee</Label>
                  <Input
                    value={currentContent.thumbnailIdea || ""}
                    onChange={(e) => updatePlatformField(activePlatform, "thumbnailIdea", e.target.value)}
                    placeholder="Thumbnail / Cover Beschreibung..."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: AI Chat */}
      <div className="w-96 flex-shrink-0 flex flex-col border-l pl-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4" />
          <h3 className="font-semibold text-sm">AI Assistent</h3>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1 mb-3">
          {[
            { label: "Script schreiben", prompt: `Schreib mir ein komplettes Script für diesen Post. Format: ${post.format}, Plattform: ${activePlatform}.` },
            { label: "Caption", prompt: `Schreib mir eine perfekte Caption für ${activePlatform}.` },
            { label: "Hashtags", prompt: `Schlage mir 10 relevante Hashtags vor für ${activePlatform}.` },
            { label: "Hook verbessern", prompt: "Verbessere meinen Hook. Mach ihn provokanter und attention-grabbing." },
          ].map((action) => (
            <Button key={action.label} variant="outline" size="sm" className="text-xs h-7" onClick={() => sendChat(action.prompt)}>
              {action.label}
            </Button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {chatMessages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-8">
              Frag mich was du brauchst — ich kenne deinen Post und deinen Style Guide.
            </p>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`${msg.role === "user" ? "ml-8" : "mr-4"}`}>
              <div className={`rounded-xl px-3 py-2 text-xs ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent"
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === "assistant" && (
                <div className="flex gap-1 mt-1">
                  <button onClick={() => applyToField(msg.content, "script")} className="text-[10px] text-blue-500 hover:underline">→ Script</button>
                  <button onClick={() => applyToField(msg.content, "caption")} className="text-[10px] text-blue-500 hover:underline">→ Caption</button>
                </div>
              )}
            </div>
          ))}
          {chatSending && (
            <div className="mr-4">
              <div className="bg-accent rounded-xl px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
            placeholder="Frag die AI..."
            rows={1}
            className="min-h-9 max-h-20 resize-none text-sm"
          />
          <Button size="icon" onClick={() => sendChat()} disabled={!chatInput.trim() || chatSending} className="h-9 w-9">
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
