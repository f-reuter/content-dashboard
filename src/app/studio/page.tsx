"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PILLARS, type PillarKey } from "@/lib/brand-config";
import { Sparkles, FileText, TrendingUp, Youtube, Loader2, Save } from "lucide-react";

interface Idea {
  hook: string;
  description: string;
  pillar: string;
  format: string;
  platforms: string[];
  cta: string;
}

interface Trend {
  name: string;
  relevance: string;
  hookIdea: string;
  urgency: number;
  pillar: string;
}

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

export default function StudioPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [script, setScript] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [pillarFilter, setPillarFilter] = useState("alle");
  const [context, setContext] = useState("");
  const [scriptInput, setScriptInput] = useState({ hook: "", description: "", format: "REEL", pillar: "AI" });
  const [videoQuery, setVideoQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function generateIdeas() {
    setLoading("ideas");
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pillar: pillarFilter, count: 5, context }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdeas(data.ideas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
    setLoading(null);
  }

  async function generateScript() {
    setLoading("script");
    setError(null);
    try {
      const res = await fetch("/api/ai/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scriptInput),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScript(data.script);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
    setLoading(null);
  }

  async function scanTrends() {
    setLoading("trends");
    setError(null);
    try {
      const res = await fetch("/api/ai/trends", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrends(data.trends);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
    setLoading(null);
  }

  async function searchVideos() {
    setLoading("youtube");
    setError(null);
    try {
      const res = await fetch("/api/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: videoQuery }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideos(data.videos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    }
    setLoading(null);
  }

  async function saveIdea(idea: Idea) {
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(idea),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Content Studio</h1>
        <p className="text-muted-foreground">Generiere Ideen, Scripts und finde Inspiration.</p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="ideas">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ideas"><Sparkles className="mr-2 h-4 w-4" />Ideen</TabsTrigger>
          <TabsTrigger value="script"><FileText className="mr-2 h-4 w-4" />Script</TabsTrigger>
          <TabsTrigger value="trends"><TrendingUp className="mr-2 h-4 w-4" />Trends</TabsTrigger>
          <TabsTrigger value="youtube"><Youtube className="mr-2 h-4 w-4" />Video-Recherche</TabsTrigger>
        </TabsList>

        {/* Ideas Tab */}
        <TabsContent value="ideas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Ideen generieren</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Säule</Label>
                  <select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                    <option value="alle">Alle Säulen</option>
                    {Object.entries(PILLARS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Kontext / Trend (optional)</Label>
                  <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="z.B. Claude 4 Release, neues AI Tool..." />
                </div>
              </div>
              <Button onClick={generateIdeas} disabled={loading === "ideas"}>
                {loading === "ideas" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generiere...</> : <><Sparkles className="mr-2 h-4 w-4" />Ideen generieren</>}
              </Button>
            </CardContent>
          </Card>

          {ideas.length > 0 && (
            <div className="space-y-3">
              {ideas.map((idea, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-lg mb-1">&ldquo;{idea.hook}&rdquo;</p>
                        <p className="text-sm text-muted-foreground mb-2">{idea.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={PILLARS[idea.pillar as PillarKey]?.color + " text-white"}>{PILLARS[idea.pillar as PillarKey]?.label || idea.pillar}</Badge>
                          <Badge variant="outline">{idea.format}</Badge>
                          {idea.platforms?.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
                        </div>
                        {idea.cta && <p className="text-xs text-muted-foreground mt-2">CTA: {idea.cta}</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" onClick={() => saveIdea(idea)}>
                          <Save className="mr-1 h-3 w-3" />Speichern
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setScriptInput({ hook: idea.hook, description: idea.description, format: idea.format, pillar: idea.pillar }); }}>
                          <FileText className="mr-1 h-3 w-3" />Script
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Script Tab */}
        <TabsContent value="script" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Script schreiben</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hook</Label>
                <Input value={scriptInput.hook} onChange={(e) => setScriptInput(p => ({ ...p, hook: e.target.value }))} placeholder="Die ersten 1-2 Sekunden..." />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea value={scriptInput.description} onChange={(e) => setScriptInput(p => ({ ...p, description: e.target.value }))} placeholder="Worum geht es?" rows={2} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Format</Label>
                  <select value={scriptInput.format} onChange={(e) => setScriptInput(p => ({ ...p, format: e.target.value }))} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                    <option value="REEL">Reel (30-90s)</option>
                    <option value="YOUTUBE_SHORT">YouTube Short (&lt;60s)</option>
                    <option value="YOUTUBE_LONG">YouTube Longform (8-15min)</option>
                    <option value="LINKEDIN">LinkedIn Post</option>
                    <option value="CAROUSEL">Carousel</option>
                  </select>
                </div>
                <div>
                  <Label>Säule</Label>
                  <select value={scriptInput.pillar} onChange={(e) => setScriptInput(p => ({ ...p, pillar: e.target.value }))} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                    {Object.entries(PILLARS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <Button onClick={generateScript} disabled={loading === "script" || !scriptInput.hook}>
                {loading === "script" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Schreibe...</> : <><FileText className="mr-2 h-4 w-4" />Script generieren</>}
              </Button>
            </CardContent>
          </Card>
          {script && (
            <Card>
              <CardHeader><CardTitle>Generiertes Script</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">{script}</pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Trend-Scanner</CardTitle></CardHeader>
            <CardContent>
              <Button onClick={scanTrends} disabled={loading === "trends"}>
                {loading === "trends" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scanne...</> : <><TrendingUp className="mr-2 h-4 w-4" />Trends scannen</>}
              </Button>
            </CardContent>
          </Card>
          {trends.length > 0 && (
            <div className="space-y-3">
              {trends.map((trend, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{trend.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{trend.relevance}</p>
                        <p className="text-sm mt-2"><strong>Hook-Idee:</strong> {trend.hookIdea}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={PILLARS[trend.pillar as PillarKey]?.color + " text-white"}>
                          {PILLARS[trend.pillar as PillarKey]?.label || trend.pillar}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Dringlichkeit: {"🔥".repeat(trend.urgency)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* YouTube Tab */}
        <TabsContent value="youtube" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Video-Recherche</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={videoQuery} onChange={(e) => setVideoQuery(e.target.value)} placeholder="z.B. AI Produktivität deutsch..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && searchVideos()} />
                <Button onClick={searchVideos} disabled={loading === "youtube" || !videoQuery}>
                  {loading === "youtube" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
          {videos.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {videos.map((video) => (
                <Card key={video.videoId}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      {video.thumbnail && (
                        <img src={video.thumbnail} alt="" className="h-20 w-36 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline line-clamp-2">
                          {video.title}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
