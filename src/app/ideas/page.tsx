"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PILLARS, PLATFORMS, FORMATS, type PillarKey } from "@/lib/brand-config";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2, Rocket, Sparkles, FileText, Wrench, Check, Plus, Loader2, Wand2, Pencil, Save } from "lucide-react";

interface Idea {
  id: string;
  hook: string;
  description: string | null;
  pillar: string;
  format: string | null;
  rating: number;
  status: string;
  sourceVideoUrls: string | null;
  convertedToPostId: string | null;
  createdAt: string;
}

const IDEA_STATUSES: Record<string, { label: string; icon: typeof Sparkles; color: string }> = {
  NEW: { label: "Neu", icon: Sparkles, color: "bg-blue-100 text-blue-700" },
  REVIEWED: { label: "Bewertet", icon: FileText, color: "bg-yellow-100 text-yellow-700" },
  PREPARING: { label: "In Vorbereitung", icon: Wrench, color: "bg-orange-100 text-orange-700" },
  CONVERTED: { label: "Umgesetzt", icon: Check, color: "bg-green-100 text-green-700" },
};

export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filter, setFilter] = useState("alle");
  const [convertDialog, setConvertDialog] = useState<Idea | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["INSTAGRAM"]);
  const [selectedFormat, setSelectedFormat] = useState("REEL");
  const [scheduledDate, setScheduledDate] = useState("");
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [newIdeaOpen, setNewIdeaOpen] = useState(false);
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiCount, setAiCount] = useState(3);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ hook: string; description: string; pillar: string; format: string; platforms: string[] }>>([]);

  const fetchIdeas = useCallback(async () => {
    const res = await fetch("/api/ideas");
    if (res.ok) setIdeas(await res.json());
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  async function updateRating(id: string, rating: number) {
    await fetch("/api/ideas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rating, status: rating >= 3 ? "REVIEWED" : undefined }),
    });
    fetchIdeas();
  }

  async function deleteIdea(id: string) {
    await fetch(`/api/ideas?id=${id}`, { method: "DELETE" });
    fetchIdeas();
  }

  function openConvertDialog(idea: Idea) {
    setConvertDialog(idea);
    setSelectedFormat(idea.format || "REEL");
    setSelectedPlatforms(["INSTAGRAM"]);
    setScheduledDate("");
  }

  async function convertToPost() {
    if (!convertDialog) return;

    // Update idea status
    await fetch("/api/ideas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: convertDialog.id, status: "PREPARING" }),
    });

    // Create post
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: convertDialog.hook,
        hook: convertDialog.hook,
        pillar: convertDialog.pillar,
        format: selectedFormat,
        platforms: selectedPlatforms,
        status: "IDEA",
        scheduledDate: scheduledDate || null,
      }),
    });
    const post = await res.json();

    // Mark idea as converted
    await fetch("/api/ideas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: convertDialog.id, convertedToPostId: post.id, status: "CONVERTED" }),
    });

    setConvertDialog(null);
    router.push(`/posts/${post.id}`);
  }

  async function saveEditedIdea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingIdea) return;
    const fd = new FormData(e.currentTarget);
    const pillars = fd.getAll("pillars") as string[];
    const formats = fd.getAll("formats") as string[];
    await fetch("/api/ideas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingIdea.id,
        hook: fd.get("hook"),
        description: fd.get("description") || null,
        pillar: pillars.join(","),
        format: formats.join(","),
        sourceVideoUrls: fd.get("sourceVideoUrls") || null,
      }),
    });
    setEditingIdea(null);
    fetchIdeas();
  }

  async function addManualIdea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pillars = fd.getAll("pillars") as string[];
    const platforms = fd.getAll("platforms") as string[];
    const formats = fd.getAll("formats") as string[];
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook: fd.get("hook"),
        description: [
          fd.get("description") || "",
          platforms.length > 0 ? `Plattformen: ${platforms.join(", ")}` : "",
        ].filter(Boolean).join("\n"),
        pillar: pillars.join(","),
        format: formats.join(","),
        sourceVideoUrls: fd.get("sourceVideoUrls") || null,
      }),
    });
    setNewIdeaOpen(false);
    fetchIdeas();
  }

  async function generateAiIdeas() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiSuggestions([]);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: aiPrompt, count: aiCount }),
      });
      const data = await res.json();
      if (data.ideas) {
        setAiSuggestions(data.ideas);
      }
    } catch {
      // ignore
    }
    setAiGenerating(false);
  }

  async function saveAiIdea(suggestion: { hook: string; description: string; pillar: string; format: string; platforms: string[] }) {
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook: suggestion.hook,
        description: suggestion.description,
        pillar: suggestion.pillar,
        format: suggestion.format,
      }),
    });
    setAiSuggestions((prev) => prev.filter((s) => s.hook !== suggestion.hook));
    fetchIdeas();
  }

  const filtered = filter === "alle" ? ideas : ideas.filter((i) => i.pillar.split(",").map((p) => p.trim()).includes(filter));
  const unconverted = filtered.filter((i) => !i.convertedToPostId);
  const converted = filtered.filter((i) => i.convertedToPostId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ideen-Pool</h1>
          <p className="text-muted-foreground">{unconverted.length} offene Ideen, {converted.length} umgesetzt</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNewIdeaOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />Neue Idee
          </Button>
          <Button onClick={() => setAiGenerateOpen(true)}>
            <Wand2 className="mr-1 h-4 w-4" />AI Ideen generieren
          </Button>
        </div>
      </div>

      {/* AI Idea Generator */}
      {aiGenerateOpen && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">AI Ideen generieren</p>
              <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => { setAiGenerateOpen(false); setAiSuggestions([]); }}>Schließen</Button>
            </div>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Beschreibe was du willst, z.B.: 'Eine gezielte Idee über KI-Automatisierung für Einsteiger' oder 'Trending Topics diese Woche' oder 'Content wie bei RPN aber auf Deutsch'..."
              rows={3}
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Anzahl:</Label>
                <div className="flex gap-1">
                  {[1, 3, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAiCount(n)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        aiCount === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {n === 1 ? "1 (gezielt)" : n}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={generateAiIdeas} disabled={aiGenerating || !aiPrompt.trim()}>
                {aiGenerating ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Generiere...</> : <><Sparkles className="mr-1 h-4 w-4" />{aiCount === 1 ? "Idee generieren" : `${aiCount} Ideen generieren`}</>}
              </Button>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-muted-foreground font-medium">Vorschläge — klicke um sie zum Pool hinzuzufügen:</p>
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="rounded-lg border p-3 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => saveAiIdea(s)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">&ldquo;{s.hook}&rdquo;</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={PILLARS[s.pillar as PillarKey]?.color + " text-white text-[10px]"}>{PILLARS[s.pillar as PillarKey]?.label || s.pillar}</Badge>
                          {s.format && <Badge variant="outline" className="text-[10px]">{s.format}</Badge>}
                          {s.platforms?.map((p) => <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>)}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost"><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant={filter === "alle" ? "default" : "outline"} size="sm" onClick={() => setFilter("alle")}>Alle</Button>
        {(Object.entries(PILLARS) as [PillarKey, (typeof PILLARS)[PillarKey]][]).map(([k, v]) => (
          <Button key={k} variant={filter === k ? "default" : "outline"} size="sm" onClick={() => setFilter(k)}>{v.label}</Button>
        ))}
      </div>

      <div className="space-y-3">
        {unconverted.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Keine offenen Ideen. Generiere welche im AI Studio oder Chat!
            </CardContent>
          </Card>
        )}
        {unconverted.sort((a, b) => b.rating - a.rating).map((idea) => {
          const statusInfo = IDEA_STATUSES[idea.status] || IDEA_STATUSES.NEW;
          return (
            <Card key={idea.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={statusInfo.color + " text-xs"}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="font-semibold">&ldquo;{idea.hook}&rdquo;</p>
                    {idea.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{idea.description}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {idea.pillar.split(",").map((p) => p.trim()).map((p) => (
                        <Badge key={p} className={PILLARS[p as PillarKey]?.color + " text-white text-[10px]"}>
                          {PILLARS[p as PillarKey]?.label || p}
                        </Badge>
                      ))}
                      {idea.format && idea.format.split(",").map((f) => f.trim()).map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px]">{FORMATS[f as keyof typeof FORMATS] || f}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => updateRating(idea.id, s)} className="p-0.5">
                          <Star className={`h-4 w-4 ${s <= idea.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditingIdea(idea)}>
                        <Pencil className="mr-1 h-3 w-3" />Bearbeiten
                      </Button>
                      <Button size="sm" onClick={() => openConvertDialog(idea)}>
                        <Rocket className="mr-1 h-3 w-3" />Umsetzen
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteIdea(idea.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {converted.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-muted-foreground mt-8">Umgesetzte Ideen</h2>
          <div className="space-y-2">
            {converted.map((idea) => (
              <Card key={idea.id} className="opacity-60">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{idea.hook}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/posts/${idea.convertedToPostId}`)}>
                      Zum Post →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Edit Idea Dialog */}
      <Dialog open={!!editingIdea} onOpenChange={(open) => !open && setEditingIdea(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Idee bearbeiten</DialogTitle></DialogHeader>
          {editingIdea && (
            <form onSubmit={saveEditedIdea} className="space-y-4">
              <div>
                <Label>Hook / Headline</Label>
                <Input name="hook" required defaultValue={editingIdea.hook} className="h-11" />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea name="description" rows={4} defaultValue={editingIdea.description || ""} className="p-3" />
              </div>
              <div>
                <Label>Säulen</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {Object.entries(PILLARS).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name="pillars" value={k} defaultChecked={editingIdea.pillar.split(",").map((p) => p.trim()).includes(k)} />
                      {v.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Formate</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {Object.entries(FORMATS).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name="formats" value={k} defaultChecked={editingIdea.format?.split(",").map((f) => f.trim()).includes(k)} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Referenz-Link / Bild-URL</Label>
                <Input name="sourceVideoUrls" defaultValue={editingIdea.sourceVideoUrls || ""} className="h-11" placeholder="https://..." />
              </div>
              <Button type="submit"><Save className="mr-1 h-4 w-4" />Speichern</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* New Idea Dialog */}
      <Dialog open={newIdeaOpen} onOpenChange={setNewIdeaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neue Idee</DialogTitle></DialogHeader>
          <form onSubmit={addManualIdea} className="space-y-5">
            <div>
              <Label className="mb-1.5 block">Hook / Headline</Label>
              <Input name="hook" required placeholder="Die Idee in einem Satz..." className="h-11" />
            </div>
            <div>
              <Label className="mb-1.5 block">Beschreibung (optional)</Label>
              <Textarea name="description" rows={4} placeholder="Was genau soll das Video zeigen? Welchen Mehrwert hat es?" className="p-3" />
            </div>
            <div>
              <Label className="mb-1.5 block">Säulen</Label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(PILLARS).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="pillars" value={k} defaultChecked={k === "AI"} className="h-4 w-4" />
                    {v.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Plattformen</Label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(PLATFORMS).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="platforms" value={k} defaultChecked={k === "INSTAGRAM"} className="h-4 w-4" />
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
                    <input type="checkbox" name="formats" value={k} defaultChecked={k === "REEL"} className="h-4 w-4" />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Referenz-Bild / Link (optional)</Label>
              <Input name="sourceVideoUrls" placeholder="https://... (Screenshot, Inspiration, Referenz)" className="h-11" />
            </div>
            <Button type="submit" className="h-11"><Plus className="mr-1 h-4 w-4" />Idee hinzufügen</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={!!convertDialog} onOpenChange={(open) => !open && setConvertDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Idee umsetzen</DialogTitle>
          </DialogHeader>
          {convertDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-accent p-3">
                <p className="font-medium text-sm">&ldquo;{convertDialog.hook}&rdquo;</p>
              </div>
              <div>
                <Label>Format</Label>
                <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                  {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <Label>Plattformen</Label>
                <div className="flex gap-3 mt-1">
                  {Object.entries(PLATFORMS).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(k)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPlatforms([...selectedPlatforms, k]);
                          else setSelectedPlatforms(selectedPlatforms.filter((p) => p !== k));
                        }}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label>Geplantes Datum (optional)</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
              <Button onClick={convertToPost} disabled={selectedPlatforms.length === 0}>
                <Rocket className="mr-2 h-4 w-4" />Post erstellen & bearbeiten
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
