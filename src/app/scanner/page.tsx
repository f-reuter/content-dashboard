"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PLATFORM_CHANNELS, PILLARS, type PlatformChannelKey, type PillarKey } from "@/lib/brand-config";
import { PlatformIcon } from "@/components/shared/platform-icon";
import {
  Plus,
  Radar,
  Play,
  Loader2,
  ExternalLink,
  Lightbulb,
  TrendingUp,
  Users,
  Flame,
  Eye,
  Heart,
  MessageCircle,
  Trash2,
} from "lucide-react";

// --- Types ---

interface Competitor {
  id: string;
  name: string;
  platform: string;
  handle: string;
  profileUrl: string | null;
  notes: string | null;
  isActive: boolean;
  _count: { scannedContent: number };
  scannedContent: Array<{ scannedAt: string }>;
}

interface ScannedContentItem {
  id: string;
  platform: string;
  title: string | null;
  caption: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  viralScore: number | null;
  contentType: string | null;
  aiAnalysis: string | null;
  savedAsIdea: boolean;
  scannedAt: string;
  competitor: { name: string; handle: string } | null;
}

interface TrendItem {
  id: string;
  name: string;
  description: string | null;
  platform: string | null;
  urgency: number;
  pillar: string | null;
  hookIdea: string | null;
  source: string | null;
  scannedAt: string;
}

interface ScanResult {
  success: boolean;
  duration: string;
  scanned: number;
  saved: number;
  newTrends: number;
  analyzed: number;
  details: { errors: string[] };
}

// --- Platform config ---

const PLATFORM_OPTIONS = [
  { key: "YOUTUBE", label: "YouTube", color: "bg-red-500" },
  { key: "INSTAGRAM", label: "Instagram", color: "bg-pink-500" },
  { key: "TIKTOK", label: "TikTok", color: "bg-gray-900" },
  { key: "LINKEDIN", label: "LinkedIn", color: "bg-blue-600" },
];

// --- Component ---

export default function ScannerPage() {
  const [tab, setTab] = useState<"competitors" | "viral" | "trends" | "status">("competitors");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [viralContent, setViralContent] = useState<ScannedContentItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>("");

  const fetchCompetitors = useCallback(async () => {
    const res = await fetch("/api/competitors");
    if (res.ok) setCompetitors(await res.json());
  }, []);

  const fetchViralContent = useCallback(async () => {
    const params = new URLSearchParams({ limit: "50" });
    if (platformFilter) params.set("platform", platformFilter);
    const res = await fetch(`/api/scanned-content?${params}`);
    if (res.ok) setViralContent(await res.json());
  }, [platformFilter]);

  const fetchTrends = useCallback(async () => {
    const res = await fetch("/api/trends?limit=50");
    if (res.ok) setTrends(await res.json());
  }, []);

  useEffect(() => {
    fetchCompetitors();
    fetchViralContent();
    fetchTrends();
  }, [fetchCompetitors, fetchViralContent, fetchTrends]);

  async function addCompetitor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        platform: fd.get("platform"),
        handle: fd.get("handle"),
        profileUrl: fd.get("profileUrl") || null,
        notes: fd.get("notes") || null,
      }),
    });
    setDialogOpen(false);
    fetchCompetitors();
  }

  async function deleteCompetitor(id: string) {
    await fetch(`/api/competitors?id=${id}`, { method: "DELETE" });
    fetchCompetitors();
  }

  async function toggleCompetitor(comp: Competitor) {
    await fetch("/api/competitors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: comp.id, isActive: !comp.isActive }),
    });
    fetchCompetitors();
  }

  async function runScan() {
    setScanning(true);
    setTab("status");
    try {
      const res = await fetch("/api/scan/run", { method: "POST" });
      const result = await res.json();
      setLastScan(result);
      fetchViralContent();
      fetchTrends();
    } catch {
      setLastScan({ success: false, duration: "0s", scanned: 0, saved: 0, newTrends: 0, analyzed: 0, details: { errors: ["Scan fehlgeschlagen"] } });
    }
    setScanning(false);
  }

  async function saveAsIdea(contentId: string) {
    await fetch("/api/scanned-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scannedContentId: contentId }),
    });
    fetchViralContent();
  }

  const tabs = [
    { key: "competitors" as const, label: "Competitors", icon: Users },
    { key: "viral" as const, label: "Virale Inhalte", icon: Flame },
    { key: "trends" as const, label: "Trends", icon: TrendingUp },
    { key: "status" as const, label: "Scan-Status", icon: Radar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scanner</h1>
          <p className="text-muted-foreground">Competitor-Tracking & Viral-Trend-Erkennung</p>
        </div>
        <Button onClick={runScan} disabled={scanning}>
          {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          {scanning ? "Scannt..." : "Jetzt scannen"}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* === TAB: COMPETITORS === */}
      {tab === "competitors" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger>
                <Button><Plus className="mr-2 h-4 w-4" />Competitor hinzufügen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Neuer Competitor</DialogTitle></DialogHeader>
                <form onSubmit={addCompetitor} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required placeholder="z.B. Ali Abdaal" />
                  </div>
                  <div>
                    <Label htmlFor="platform">Plattform</Label>
                    <select id="platform" name="platform" required className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                      {PLATFORM_OPTIONS.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="handle">Handle / Channel-ID</Label>
                    <Input id="handle" name="handle" required placeholder="z.B. UCJ24N4O0bP7LGN_qieAbRVg" />
                  </div>
                  <div>
                    <Label htmlFor="profileUrl">Profil-URL (optional)</Label>
                    <Input id="profileUrl" name="profileUrl" placeholder="https://..." />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notizen (optional)</Label>
                    <Input id="notes" name="notes" placeholder="Warum tracken wir diesen Account?" />
                  </div>
                  <Button type="submit">Hinzufügen</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {PLATFORM_OPTIONS.map((platform) => {
            const platformComps = competitors.filter((c) => c.platform === platform.key);
            if (platformComps.length === 0) return null;
            return (
              <div key={platform.key}>
                <div className="flex items-center gap-2 mb-3">
                  <PlatformIcon platform={platform.key} className="h-4 w-4" />
                  <h3 className="font-semibold">{platform.label}</h3>
                  <Badge variant="outline">{platformComps.length}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {platformComps.map((comp) => (
                    <Card key={comp.id} className={!comp.isActive ? "opacity-50" : ""}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{comp.name}</p>
                            <p className="text-xs text-muted-foreground">@{comp.handle}</p>
                          </div>
                          <div className="flex gap-1">
                            {comp.profileUrl && (
                              <a href={comp.profileUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleCompetitor(comp)}>
                              <span className={`h-2 w-2 rounded-full ${comp.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCompetitor(comp.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {comp.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{comp.notes}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{comp._count.scannedContent} Inhalte</span>
                          {comp.scannedContent[0] && (
                            <span>Letzter Scan: {new Date(comp.scannedContent[0].scannedAt).toLocaleDateString("de-DE")}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {competitors.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Noch keine Competitors. Füge deinen ersten Competitor hinzu!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* === TAB: VIRALE INHALTE === */}
      {tab === "viral" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={!platformFilter ? "default" : "outline"} size="sm" onClick={() => setPlatformFilter("")}>Alle</Button>
            {PLATFORM_OPTIONS.map((p) => (
              <Button key={p.key} variant={platformFilter === p.key ? "default" : "outline"} size="sm" onClick={() => setPlatformFilter(p.key)}>
                <PlatformIcon platform={p.key} className="h-3.5 w-3.5 mr-1" />{p.label}
              </Button>
            ))}
          </div>

          {viralContent.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Flame className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Noch keine gescannten Inhalte. Starte einen Scan!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {viralContent.map((item) => {
                const platformInfo = PLATFORM_OPTIONS.find((p) => p.key === item.platform);
                return (
                  <Card key={item.id}>
                    <CardContent className="pt-4">
                      <div className="flex gap-4">
                        {item.thumbnailUrl && (
                          <img src={item.thumbnailUrl} alt="" className="h-20 w-32 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{item.title || item.caption?.slice(0, 80) || "Ohne Titel"}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <PlatformIcon platform={item.platform} className="h-3 w-3" />
                                <span className="text-xs text-muted-foreground">{item.competitor?.name || platformInfo?.label}</span>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground">{new Date(item.scannedAt).toLocaleDateString("de-DE")}</span>
                              </div>
                            </div>
                            {item.viralScore != null && (
                              <Badge variant={item.viralScore > 50 ? "default" : "outline"} className="flex-shrink-0">
                                Score: {item.viralScore.toFixed(1)}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.views.toLocaleString("de-DE")}</span>
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.likes.toLocaleString("de-DE")}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{item.comments.toLocaleString("de-DE")}</span>
                            {item.contentType && <Badge variant="outline" className="text-[10px]">{item.contentType}</Badge>}
                          </div>

                          {item.aiAnalysis && (
                            <p className="mt-2 text-xs text-muted-foreground bg-accent/50 rounded p-2">{item.aiAnalysis}</p>
                          )}

                          <div className="flex gap-2 mt-2">
                            {item.url && (
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="h-7 text-xs">
                                  <ExternalLink className="mr-1 h-3 w-3" />Öffnen
                                </Button>
                              </a>
                            )}
                            {!item.savedAsIdea && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => saveAsIdea(item.id)}>
                                <Lightbulb className="mr-1 h-3 w-3" />Als Idee speichern
                              </Button>
                            )}
                            {item.savedAsIdea && (
                              <span className="text-xs text-green-600 flex items-center gap-1">✓ Gespeichert</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === TAB: TRENDS === */}
      {tab === "trends" && (
        <div className="space-y-3">
          {trends.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Noch keine Trends erkannt. Starte einen Scan!</p>
              </CardContent>
            </Card>
          ) : (
            trends.map((trend) => {
              const pillar = PILLARS[trend.pillar as PillarKey];
              return (
                <Card key={trend.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{trend.name}</p>
                          {trend.urgency >= 4 && <Badge variant="destructive" className="text-[10px]">Dringend</Badge>}
                        </div>
                        {trend.description && (
                          <p className="text-sm text-muted-foreground mt-1">{trend.description}</p>
                        )}
                        {trend.hookIdea && (
                          <p className="text-sm mt-2 bg-accent/50 rounded p-2">
                            <span className="font-medium">Hook-Idee:</span> {trend.hookIdea}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {pillar && <Badge variant="outline" className="text-[10px]">{pillar.label}</Badge>}
                          {trend.platform && (
                            <Badge variant="outline" className="text-[10px]">{trend.platform}</Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(trend.scannedAt).toLocaleDateString("de-DE")}
                          </span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < trend.urgency ? "bg-orange-500" : "bg-gray-200"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* === TAB: SCAN STATUS === */}
      {tab === "status" && (
        <div className="space-y-4">
          {scanning && (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-3" />
                <p className="font-medium">Scan läuft...</p>
                <p className="text-sm text-muted-foreground">YouTube, Instagram, TikTok + Claude AI Trend-Analyse</p>
              </CardContent>
            </Card>
          )}

          {lastScan && !scanning && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {lastScan.success ? (
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                  ) : (
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                  )}
                  Letzter Scan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{lastScan.scanned}</p>
                    <p className="text-xs text-muted-foreground">Gescannt</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{lastScan.saved}</p>
                    <p className="text-xs text-muted-foreground">Gespeichert</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{lastScan.newTrends}</p>
                    <p className="text-xs text-muted-foreground">Neue Trends</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{lastScan.analyzed}</p>
                    <p className="text-xs text-muted-foreground">AI-Analysiert</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Dauer: {lastScan.duration}</p>
                {lastScan.details.errors.length > 0 && (
                  <div className="mt-3 rounded bg-destructive/10 p-3">
                    <p className="text-xs font-medium text-destructive mb-1">Fehler:</p>
                    {lastScan.details.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">{err}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Scan-Konfiguration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Aktive Competitors</p>
                  <p className="text-xs text-muted-foreground">{competitors.filter((c) => c.isActive).length} von {competitors.length}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">YouTube API</p>
                  <p className="text-xs text-muted-foreground">YOUTUBE_API_KEY</p>
                </div>
                <Badge variant="outline">Konfiguriert</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Apify (Instagram/TikTok)</p>
                  <p className="text-xs text-muted-foreground">APIFY_TOKEN</p>
                </div>
                <Badge variant="outline">Optional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Claude AI Trends</p>
                  <p className="text-xs text-muted-foreground">ANTHROPIC_API_KEY</p>
                </div>
                <Badge variant="outline">Konfiguriert</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
