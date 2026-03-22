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
  PILLARS, FORMATS, PLATFORMS, STATUSES, PLATFORM_CHANNELS, HOOK_TYPES,
  type PillarKey, type PlatformChannelKey,
} from "@/lib/brand-config";
import {
  Save, Check, ArrowLeft, Send, Loader2, Sparkles,
  Calendar, FileText, Film, Scissors, Clock, CheckCircle, Monitor, Play, Pause, X,
} from "lucide-react";
import { PlatformIcon } from "@/components/shared/platform-icon";

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

interface ScriptRow {
  id: string;
  time?: string;
  speech: string;
  visual: string;
}

interface PlatformContent {
  script?: string;
  scriptRows?: ScriptRow[];
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
  const [scriptView, setScriptView] = useState<"split" | "text">("split");
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [videoDuration, setVideoDuration] = useState(45);
  const [teleprompterOpen, setTeleprompterOpen] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(3);
  const [teleprompterRunning, setTeleprompterRunning] = useState(false);
  const teleprompterRef = useRef<HTMLDivElement>(null);
  const teleprompterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hookTemplatesOpen, setHookTemplatesOpen] = useState(false);
  const [hookTemplates, setHookTemplates] = useState<Array<{ id: string; text: string; type: string; performanceScore: number | null }>>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatConvId, setChatConvId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const initializedRef = useRef(false);

  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/posts?id=${postId}`);
    if (!res.ok) return;
    const posts = await res.json();
    const p = Array.isArray(posts) ? posts.find((x: Post) => x.id === postId) : posts;
    if (!p) return;
    setPost(p);

    // Only initialize platform content on first load
    if (initializedRef.current) return;
    initializedRef.current = true;

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
    if (platforms.length > 0) {
      setActivePlatform(platforms[0]);
    }
    // Initialize active formats from post format + any additional from platformContent
    const formats = new Set<string>([p.format]);
    for (const key of Object.keys(pc)) {
      if (key.startsWith("ALL_")) formats.add(key.replace("ALL_", ""));
    }
    setActiveFormats(formats);
  }, [postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  async function loadHookTemplates() {
    if (hookTemplates.length > 0) { setHookTemplatesOpen(!hookTemplatesOpen); return; }
    const res = await fetch("/api/hooks");
    if (res.ok) {
      const hooks = await res.json();
      setHookTemplates(hooks);
      setHookTemplatesOpen(true);
    }
  }

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

  function updateScriptRow(index: number, field: keyof ScriptRow, value: string) {
    setPlatformContent((prev) => {
      const pc = { ...prev[activePlatform] };
      const rows = [...(pc.scriptRows || [{ id: "1", time: "", speech: "", visual: "" }])];
      rows[index] = { ...rows[index], [field]: value };
      // Also sync the plain text script from speech column
      pc.scriptRows = rows;
      pc.script = rows.map((r) => `${r.time ? `[${r.time}] ` : ""}${r.speech}`).filter(Boolean).join("\n");
      return { ...prev, [activePlatform]: pc };
    });
  }

  function addScriptRow() {
    setPlatformContent((prev) => {
      const pc = { ...prev[activePlatform] };
      const rows = [...(pc.scriptRows || [])];
      rows.push({ id: String(Date.now()), time: "", speech: "", visual: "" });
      pc.scriptRows = rows;
      return { ...prev, [activePlatform]: pc };
    });
  }

  function removeScriptRow(index: number) {
    setPlatformContent((prev) => {
      const pc = { ...prev[activePlatform] };
      const rows = [...(pc.scriptRows || [])].filter((_, i) => i !== index);
      pc.scriptRows = rows.length > 0 ? rows : [{ id: "1", time: "", speech: "", visual: "" }];
      pc.script = rows.map((r) => `${r.time ? `[${r.time}] ` : ""}${r.speech}`).filter(Boolean).join("\n");
      return { ...prev, [activePlatform]: pc };
    });
  }

  // Chat functions — uses dedicated post-assist endpoint
  async function sendChat(text?: string) {
    const msg = text || chatInput.trim();
    if (!msg || chatSending) return;
    setChatSending(true);
    setChatInput("");

    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: msg }]);

    try {
      const res = await fetch("/api/ai/post-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post?.id,
          message: msg,
          videoDuration,
          conversationHistory: chatMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

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

    // If applying to script, try to parse JSON script rows
    if (field === "script") {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const rows = JSON.parse(jsonMatch[0]) as Array<{ time?: string; speech: string; visual: string }>;
          if (rows.length > 0 && rows[0].speech !== undefined) {
            const scriptRows: ScriptRow[] = rows.map((r, i) => ({
              id: String(Date.now() + i),
              time: r.time || "",
              speech: r.speech || "",
              visual: r.visual || "",
            }));
            setPlatformContent((prev) => ({
              ...prev,
              [activePlatform]: {
                ...prev[activePlatform],
                scriptRows,
                script: rows.map((r) => `${r.time ? `[${r.time}] ` : ""}${r.speech}`).join("\n"),
              },
            }));
            setScriptView("split");
            return;
          }
        } catch { /* not JSON, use as plain text */ }
      }
    }

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
      <div className="flex-1 overflow-y-auto space-y-4 pb-8 min-w-0 pr-2">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground">Titel</Label>
            <Input
              value={post.title}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="text-xl font-bold h-auto py-1 px-2"
              placeholder="Post-Titel..."
            />
          </div>
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

        {/* Hook */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs">Hook</Label>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={loadHookTemplates}>
              {hookTemplatesOpen ? "Schließen" : "Vorlagen"}
            </Button>
          </div>
          <Textarea
            value={post.hook || ""}
            onChange={(e) => setPost({ ...post, hook: e.target.value })}
            placeholder="Die ersten 1-2 Sekunden — muss den Scroll stoppen..."
            rows={2}
            className="text-base p-3"
          />
          {hookTemplatesOpen && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border bg-accent/30 p-2 space-y-1">
              {hookTemplates
                .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
                .map((h) => (
                <button
                  key={h.id}
                  onClick={() => { setPost({ ...post, hook: h.text }); setHookTemplatesOpen(false); }}
                  className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-background transition-colors flex items-center justify-between gap-2"
                >
                  <span className="truncate">&ldquo;{h.text}&rdquo;</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge className="text-[9px]" variant="outline">{HOOK_TYPES[h.type as keyof typeof HOOK_TYPES] || h.type}</Badge>
                    {h.performanceScore && <span className="text-[10px] text-muted-foreground">{h.performanceScore}%</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label className="text-xs">Ziel & Idee des Posts</Label>
          <Textarea
            value={post.thumbnailIdea || ""}
            onChange={(e) => setPost({ ...post, thumbnailIdea: e.target.value })}
            placeholder="Was ist das Ziel dieses Posts? Welche Botschaft, welcher CTA, welches Ergebnis soll erreicht werden..."
            rows={2}
            className="p-3 text-sm"
          />
        </div>
        <div className="grid gap-3 grid-cols-3">
          <div>
            <Label className="text-xs">Säule</Label>
            <select value={post.pillar} onChange={(e) => setPost({ ...post, pillar: e.target.value })} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
              {Object.entries(PILLARS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Video-Dauer (Sekunden)</Label>
            <Input
              type="number"
              min={0}
              value={videoDuration}
              onChange={(e) => setVideoDuration(Number(e.target.value) || 0)}
              placeholder="z.B. 45"
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs">Datum</Label>
            <Input type="date" value={post.scheduledDate?.split("T")[0] || ""} onChange={(e) => setPost({ ...post, scheduledDate: e.target.value })} className="h-10" />
          </div>
        </div>

        {/* Plattformen & Format — EINE Sektion */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Plattformen</Label>
              {platforms.length > 1 && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={syncPlatforms} onChange={(e) => setSyncPlatforms(e.target.checked)} className="h-3.5 w-3.5" />
                  Content synchronisieren
                </label>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PLATFORMS).map(([k, v]) => {
                const isSelected = post.platforms.split(",").map((s) => s.trim()).includes(k);
                return (
                  <label
                    key={k}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-colors text-center ${
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const current = post.platforms.split(",").map((s) => s.trim()).filter(Boolean);
                        const updated = e.target.checked
                          ? [...new Set([...current, k])]
                          : current.filter((p) => p !== k);
                        if (updated.length > 0) setPost({ ...post, platforms: updated.join(",") });
                      }}
                      className="sr-only"
                    />
                    <PlatformIcon platform={k} className="h-5 w-5" />
                    <span className="text-xs font-medium">{v}</span>
                  </label>
                );
              })}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Format</Label>
              <select
                value={post.format}
                onChange={(e) => setPost({ ...post, format: e.target.value })}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
              >
                {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Platform Tabs — nur wenn mehrere ausgewählt */}
        {platforms.length > 1 && (
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
                  <PlatformIcon platform={pl} className="h-3.5 w-3.5" />
                  {ch.label}
                  {status?.published && <Check className="h-3 w-3 text-green-500" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Platform Content Editor */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* Script Split Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Script</Label>
                <div className="flex gap-1">
                  <Button
                    variant={scriptView === "split" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setScriptView("split")}
                  >
                    Split-View
                  </Button>
                  <Button
                    variant={scriptView === "text" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setScriptView("text")}
                  >
                    Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 ml-2"
                    onClick={() => setTeleprompterOpen(true)}
                  >
                    <Monitor className="mr-1 h-3 w-3" />
                    Teleprompter
                  </Button>
                </div>
              </div>

              {scriptView === "split" ? (
                <div className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-[60px_1fr_1fr] bg-muted text-xs font-medium">
                    <div className="p-2 text-center border-r">Zeit</div>
                    <div className="p-2 border-r">Sprechtext</div>
                    <div className="p-2">Visuell (B-Roll, Cuts, Text-Overlays)</div>
                  </div>
                  {/* Rows */}
                  {(currentContent.scriptRows || [{ id: "1", time: "0-3s", speech: "", visual: "" }]).map((row, i) => (
                    <div key={row.id} className="grid grid-cols-[60px_1fr_1fr] border-t group">
                      <div className="p-1 border-r flex items-start">
                        <Input
                          value={row.time || ""}
                          onChange={(e) => updateScriptRow(i, "time", e.target.value)}
                          className="h-7 text-xs text-center border-none shadow-none px-1"
                          placeholder="0-3s"
                        />
                      </div>
                      <div className="p-1 border-r">
                        <Textarea
                          value={row.speech}
                          onChange={(e) => updateScriptRow(i, "speech", e.target.value)}
                          className="text-sm border-none shadow-none resize-none p-1 min-h-16"
                          placeholder="Was sagst du..."
                          rows={2}
                        />
                      </div>
                      <div className="p-1 relative">
                        <Textarea
                          value={row.visual}
                          onChange={(e) => updateScriptRow(i, "visual", e.target.value)}
                          className="text-sm border-none shadow-none resize-none p-1 min-h-16 text-muted-foreground"
                          placeholder="Talking Head, Screencast, Text-Overlay..."
                          rows={2}
                        />
                        <button
                          onClick={() => removeScriptRow(i)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-destructive text-xs p-0.5 hover:bg-destructive/10 rounded"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addScriptRow}
                    className="w-full p-2 text-xs text-muted-foreground hover:bg-accent transition-colors border-t"
                  >
                    + Zeile hinzufügen
                  </button>
                </div>
              ) : (
                <Textarea
                  rows={10}
                  value={currentContent.script || ""}
                  onChange={(e) => updatePlatformField(activePlatform, "script", e.target.value)}
                  placeholder="Video-Script..."
                  className="font-mono text-sm"
                />
              )}
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
            { label: "Script", prompt: `Erstelle ein komplettes Script für diesen Post. Nutze den Skill Prompt für ${post.format}. Plattform: ${activePlatform}. Video-Dauer: ${videoDuration}s. Gib das Script als JSON-Array zurück mit time, speech und visual pro Zeile.` },
            { label: "Caption", prompt: `Schreib mir die perfekte Caption für ${activePlatform}. Beachte den Style Guide und die plattform-spezifischen Regeln.` },
            { label: "Hashtags", prompt: `Gib mir 10 relevante Hashtags für ${activePlatform}. Mix aus großen und Nischen-Hashtags. Nur die Hashtags, nichts anderes.` },
            { label: "Hook", prompt: "Verbessere meinen Hook oder schlage 3 alternative Hooks vor. Sie müssen Pattern-Interrupt sein und den Scroll stoppen." },
            { label: "CTA", prompt: `Schlage mir den besten CTA für ${activePlatform} vor. Kurz, direkt, passend zur Plattform.` },
            { label: "Thumbnail", prompt: "Beschreibe eine Thumbnail-/Cover-Idee die Klicks generiert. Welcher Text, welches Bild, welche Emotion?" },
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
              Ich kenne deinen Post, den Style Guide, die Skill Prompts und die Hook-Bibliothek. Frag mich was du brauchst!
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
                <div className="flex flex-wrap gap-1 mt-1">
                  <button onClick={() => applyToField(msg.content, "script")} className="text-[10px] text-blue-500 hover:underline px-1.5 py-0.5 rounded bg-blue-50">→ Script</button>
                  <button onClick={() => applyToField(msg.content, "caption")} className="text-[10px] text-blue-500 hover:underline px-1.5 py-0.5 rounded bg-blue-50">→ Caption</button>
                  <button onClick={() => applyToField(msg.content, "hashtags")} className="text-[10px] text-blue-500 hover:underline px-1.5 py-0.5 rounded bg-blue-50">→ Hashtags</button>
                  <button onClick={() => applyToField(msg.content, "cta")} className="text-[10px] text-blue-500 hover:underline px-1.5 py-0.5 rounded bg-blue-50">→ CTA</button>
                  <button onClick={() => { if (post) setPost({ ...post, hook: msg.content.split("\n")[0] }); }} className="text-[10px] text-blue-500 hover:underline px-1.5 py-0.5 rounded bg-blue-50">→ Hook</button>
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

      {/* Teleprompter Modal */}
      {teleprompterOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Controls */}
          <div className="flex items-center justify-between px-6 py-3 bg-black/80 border-b border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (teleprompterRunning) {
                    if (teleprompterIntervalRef.current) clearInterval(teleprompterIntervalRef.current);
                    setTeleprompterRunning(false);
                  } else {
                    teleprompterIntervalRef.current = setInterval(() => {
                      teleprompterRef.current?.scrollBy({ top: teleprompterSpeed, behavior: "auto" });
                    }, 50);
                    setTeleprompterRunning(true);
                  }
                }}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20 transition-colors"
              >
                {teleprompterRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {teleprompterRunning ? "Pause" : "Start"}
              </button>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <span>Geschwindigkeit:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setTeleprompterSpeed(s);
                      if (teleprompterRunning && teleprompterIntervalRef.current) {
                        clearInterval(teleprompterIntervalRef.current);
                        teleprompterIntervalRef.current = setInterval(() => {
                          teleprompterRef.current?.scrollBy({ top: s, behavior: "auto" });
                        }, 50);
                      }
                    }}
                    className={`w-8 h-8 rounded-full text-sm ${teleprompterSpeed === s ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (teleprompterIntervalRef.current) clearInterval(teleprompterIntervalRef.current);
                setTeleprompterRunning(false);
                setTeleprompterOpen(false);
              }}
              className="text-white/70 hover:text-white p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Script Content */}
          <div
            ref={teleprompterRef}
            className="flex-1 overflow-y-auto px-12 pt-[40vh] pb-[60vh]"
          >
            <div className="max-w-3xl mx-auto">
              {(currentContent.scriptRows && currentContent.scriptRows.length > 0)
                ? currentContent.scriptRows.map((row, i) => (
                    <div key={row.id || i} className="mb-12">
                      {row.time && (
                        <div className="text-yellow-400 text-lg font-mono mb-2">{row.time}</div>
                      )}
                      <p className="text-white text-4xl leading-relaxed font-medium">
                        {row.speech}
                      </p>
                      {row.visual && (
                        <p className="text-white/40 text-lg mt-3 italic">{row.visual}</p>
                      )}
                    </div>
                  ))
                : (currentContent.script || post.script || "Kein Script vorhanden").split("\n").map((line, i) => (
                    <p key={i} className="text-white text-4xl leading-relaxed font-medium mb-8">
                      {line}
                    </p>
                  ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
