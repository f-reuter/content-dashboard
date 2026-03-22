"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HOOK_TYPES, PILLARS, PLATFORMS, FORMATS, type PillarKey } from "@/lib/brand-config";
import { PlatformIcon } from "@/components/shared/platform-icon";
import {
  Plus,
  Trash2,
  Star,
  Heart,
  Pencil,
  Copy,
  TrendingUp,
  Wand2,
  Loader2,
  Save,
} from "lucide-react";

interface Hook {
  id: string;
  text: string;
  type: string;
  platforms: string | null;
  pillar: string | null;
  formats: string | null;
  postId: string | null;
  performanceScore: number | null;
  usageCount: number;
  isFavorite: boolean;
  notes: string | null;
  post: { id: string; title: string; status: string } | null;
}

const TYPE_COLORS: Record<string, string> = {
  QUESTION: "bg-blue-100 text-blue-700",
  CONTROVERSIAL: "bg-red-100 text-red-700",
  RESULT: "bg-green-100 text-green-700",
  SHOCK: "bg-orange-100 text-orange-700",
  STORY: "bg-purple-100 text-purple-700",
};

export default function HooksPage() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHook, setEditingHook] = useState<Hook | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const fetchHooks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterPlatform) params.set("platform", filterPlatform);
    const res = await fetch(`/api/hooks?${params}`);
    if (res.ok) setHooks(await res.json());
  }, [filterType, filterPlatform]);

  useEffect(() => { fetchHooks(); }, [fetchHooks]);

  async function saveHook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      id: editingHook?.id,
      text: fd.get("text"),
      type: fd.get("type"),
      platforms: fd.getAll("platforms"),
      formats: fd.getAll("formats"),
      pillar: fd.getAll("pillar"),
      notes: fd.get("notes") || null,
      performanceScore: fd.get("performanceScore") ? Number(fd.get("performanceScore")) : null,
    };
    await fetch("/api/hooks", {
      method: editingHook?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setDialogOpen(false);
    setEditingHook(null);
    fetchHooks();
  }

  async function deleteHook(id: string) {
    await fetch(`/api/hooks?id=${id}`, { method: "DELETE" });
    fetchHooks();
  }

  async function toggleFavorite(hook: Hook) {
    await fetch("/api/hooks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: hook.id, isFavorite: !hook.isFavorite }),
    });
    fetchHooks();
  }

  function copyHook(text: string) {
    navigator.clipboard.writeText(text);
  }

  async function generateHooks() {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "Generiere 5 starke Hooks für Social Media Content. Mix aus verschiedenen Hook-Typen (Frage, Kontrovers, Ergebnis, Schock, Story). Jeder Hook soll Pattern-Interrupt sein.",
          count: 5,
        }),
      });
      const data = await res.json();
      if (data.ideas) {
        for (const idea of data.ideas) {
          await fetch("/api/hooks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: idea.hook,
              type: "CONTROVERSIAL",
              platforms: idea.platforms || ["INSTAGRAM", "TIKTOK"],
              pillar: idea.pillar || "AI",
            }),
          });
        }
        fetchHooks();
      }
    } catch { /* ignore */ }
    setAiGenerating(false);
  }

  function openEdit(hook: Hook) {
    setEditingHook(hook);
    setDialogOpen(true);
  }

  function openNew() {
    setEditingHook(null);
    setDialogOpen(true);
  }

  const favorites = hooks.filter((h) => h.isFavorite);
  const regular = hooks.filter((h) => !h.isFavorite);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hook-Bibliothek</h1>
          <p className="text-muted-foreground">{hooks.length} Hooks{favorites.length > 0 ? `, ${favorites.length} Favoriten` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateHooks} disabled={aiGenerating}>
            {aiGenerating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
            AI Hooks generieren
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" />Neuer Hook
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1">
          <Button variant={!filterType ? "default" : "outline"} size="sm" onClick={() => setFilterType("")}>Alle Typen</Button>
          {Object.entries(HOOK_TYPES).map(([k, v]) => (
            <Button key={k} variant={filterType === k ? "default" : "outline"} size="sm" onClick={() => setFilterType(k)}>{v}</Button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button variant={!filterPlatform ? "default" : "outline"} size="sm" onClick={() => setFilterPlatform("")}>Alle Plattformen</Button>
          {Object.entries(PLATFORMS).map(([k, v]) => (
            <Button key={k} variant={filterPlatform === k ? "default" : "outline"} size="sm" onClick={() => setFilterPlatform(k)}>
              <PlatformIcon platform={k} className="h-3.5 w-3.5 mr-1" />{v}
            </Button>
          ))}
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />Favoriten</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {favorites.map((hook) => <HookCard key={hook.id} hook={hook} onEdit={openEdit} onDelete={deleteHook} onToggleFav={toggleFavorite} onCopy={copyHook} />)}
          </div>
        </div>
      )}

      {/* All Hooks */}
      <div className="grid gap-3 md:grid-cols-2">
        {regular.length === 0 && favorites.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Noch keine Hooks. Generiere welche mit AI oder füge manuell hinzu!
            </CardContent>
          </Card>
        )}
        {regular.map((hook) => <HookCard key={hook.id} hook={hook} onEdit={openEdit} onDelete={deleteHook} onToggleFav={toggleFavorite} onCopy={copyHook} />)}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHook?.id ? "Hook bearbeiten" : "Neuer Hook"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveHook} className="space-y-5">
            <div>
              <Label className="mb-1.5 block">Hook-Text</Label>
              <Textarea name="text" rows={6} required defaultValue={editingHook?.text || ""} placeholder="Die ersten 1-2 Sekunden — muss den Scroll stoppen..." className="p-4 text-lg leading-relaxed" />
            </div>
            <div>
              <Label className="mb-1.5 block">Typ</Label>
              <select name="type" defaultValue={editingHook?.type || "QUESTION"} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">
                {Object.entries(HOOK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Plattformen</Label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(PLATFORMS).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="platforms" value={k} defaultChecked={editingHook?.platforms?.includes(k) ?? true} className="h-4 w-4" />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Formate</Label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(FORMATS).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="formats" value={k} className="h-4 w-4" />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Säulen</Label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(PILLARS).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="pillar" value={k} defaultChecked={editingHook?.pillar?.includes(k)} className="h-4 w-4" />
                    {v.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Performance Score (0-100)</Label>
                <Input name="performanceScore" type="number" min={0} max={100} defaultValue={editingHook?.performanceScore || ""} className="h-10" placeholder="z.B. 85" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Notizen (warum funktioniert das?)</Label>
              <Textarea name="notes" rows={2} defaultValue={editingHook?.notes || ""} className="p-3" placeholder="Pattern-Interrupt, spricht Schmerzpunkt an..." />
            </div>
            <Button type="submit" className="h-10">
              <Save className="mr-1 h-4 w-4" />{editingHook?.id ? "Speichern" : "Hinzufügen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HookCard({
  hook,
  onEdit,
  onDelete,
  onToggleFav,
  onCopy,
}: {
  hook: Hook;
  onEdit: (h: Hook) => void;
  onDelete: (id: string) => void;
  onToggleFav: (h: Hook) => void;
  onCopy: (text: string) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base leading-relaxed">&ldquo;{hook.text}&rdquo;</p>
            {hook.notes && <p className="text-xs text-muted-foreground mt-1">{hook.notes}</p>}
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge className={TYPE_COLORS[hook.type] + " text-[10px]"}>
                {HOOK_TYPES[hook.type as keyof typeof HOOK_TYPES] || hook.type}
              </Badge>
              {hook.pillar && hook.pillar.split(",").map((p) => p.trim()).map((p) => (
                <Badge key={p} className={PILLARS[p as PillarKey]?.color + " text-white text-[10px]"}>
                  {PILLARS[p as PillarKey]?.label || p}
                </Badge>
              ))}
              {hook.platforms && hook.platforms.split(",").map((p) => p.trim()).map((p) => (
                <span key={p} title={p}><PlatformIcon platform={p} className="h-3.5 w-3.5" /></span>
              ))}
              {hook.formats && hook.formats.split(",").map((f) => f.trim()).map((f) => (
                <Badge key={f} variant="outline" className="text-[10px]">{FORMATS[f as keyof typeof FORMATS] || f}</Badge>
              ))}
              {hook.performanceScore != null && (
                <Badge variant="outline" className="text-[10px] flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />{hook.performanceScore}%
                </Badge>
              )}
            </div>
            {hook.post && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Verwendet in: {hook.post.title}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={() => onToggleFav(hook)} className="p-1 hover:bg-accent rounded">
              <Heart className={`h-3.5 w-3.5 ${hook.isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
            <button onClick={() => onCopy(hook.text)} className="p-1 hover:bg-accent rounded" title="Kopieren">
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => onEdit(hook)} className="p-1 hover:bg-accent rounded">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => onDelete(hook.id)} className="p-1 hover:bg-accent rounded">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
