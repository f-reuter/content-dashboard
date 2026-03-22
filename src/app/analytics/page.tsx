"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PILLARS, type PillarKey } from "@/lib/brand-config";
import { Plus, BarChart3, TrendingUp, Eye, Heart, Bookmark } from "lucide-react";

interface Post {
  id: string;
  title: string;
  pillar: string;
  status: string;
  publishedDate: string | null;
}

interface KPI {
  id: string;
  postId: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  engagementRate: number | null;
  postingTime: string | null;
  notes: string | null;
  recordedAt: string;
  post: Post;
}

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const [kpiRes, postRes] = await Promise.all([
      fetch("/api/kpis"),
      fetch("/api/posts?status=PUBLISHED"),
    ]);
    setKpis(await kpiRes.json());
    const allPosts = await postRes.json();
    setPosts(allPosts);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalViews = kpis.reduce((s, k) => s + k.views, 0);
  const totalLikes = kpis.reduce((s, k) => s + k.likes, 0);
  const totalSaves = kpis.reduce((s, k) => s + k.saves, 0);
  const totalComments = kpis.reduce((s, k) => s + k.comments, 0);
  const avgEngagement = kpis.length > 0
    ? kpis.reduce((s, k) => s + (k.engagementRate || 0), 0) / kpis.length
    : 0;

  // Pillar performance
  const pillarStats: Record<string, { views: number; engagement: number; count: number }> = {};
  for (const kpi of kpis) {
    const p = kpi.post?.pillar || "UNKNOWN";
    if (!pillarStats[p]) pillarStats[p] = { views: 0, engagement: 0, count: 0 };
    pillarStats[p].views += kpi.views;
    pillarStats[p].engagement += kpi.engagementRate || 0;
    pillarStats[p].count += 1;
  }

  async function saveKPI(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/kpis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: fd.get("postId"),
        views: Number(fd.get("views")),
        likes: Number(fd.get("likes")),
        comments: Number(fd.get("comments")),
        saves: Number(fd.get("saves")),
        shares: Number(fd.get("shares")),
        postingTime: fd.get("postingTime"),
        notes: fd.get("notes"),
      }),
    });
    setDialogOpen(false);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">KPI-Tracking & Performance-Analyse</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button><Plus className="mr-2 h-4 w-4" />KPIs eintragen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>KPIs eintragen</DialogTitle></DialogHeader>
            <form onSubmit={saveKPI} className="space-y-4">
              <div>
                <Label htmlFor="postId">Post</Label>
                <select id="postId" name="postId" required className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                  <option value="">Post wählen...</option>
                  {posts.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Views</Label><Input name="views" type="number" defaultValue="0" /></div>
                <div><Label>Likes</Label><Input name="likes" type="number" defaultValue="0" /></div>
                <div><Label>Kommentare</Label><Input name="comments" type="number" defaultValue="0" /></div>
                <div><Label>Saves</Label><Input name="saves" type="number" defaultValue="0" /></div>
                <div><Label>Shares</Label><Input name="shares" type="number" defaultValue="0" /></div>
                <div><Label>Posting-Zeit</Label><Input name="postingTime" type="time" /></div>
              </div>
              <div><Label>Notizen</Label><Textarea name="notes" rows={2} /></div>
              <Button type="submit">Speichern</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Views", value: totalViews, icon: Eye },
          { label: "Likes", value: totalLikes, icon: Heart },
          { label: "Saves", value: totalSaves, icon: Bookmark },
          { label: "Kommentare", value: totalComments, icon: BarChart3 },
          { label: "Ø Engagement", value: `${avgEngagement.toFixed(1)}%`, icon: TrendingUp },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-1">{typeof item.value === "number" ? item.value.toLocaleString("de-DE") : item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pillar Performance */}
      <Card>
        <CardHeader><CardTitle>Performance nach Säule</CardTitle></CardHeader>
        <CardContent>
          {Object.keys(pillarStats).length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Daten. Trage KPIs ein!</p>
          ) : (
            <div className="space-y-4">
              {(Object.entries(pillarStats) as [string, { views: number; engagement: number; count: number }][])
                .sort((a, b) => b[1].views - a[1].views)
                .map(([pillar, stats]) => (
                  <div key={pillar} className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded ${PILLARS[pillar as PillarKey]?.color || "bg-gray-400"}`} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{PILLARS[pillar as PillarKey]?.label || pillar}</span>
                        <span className="text-muted-foreground">{stats.count} Posts</span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>{stats.views.toLocaleString("de-DE")} Views</span>
                        <span>Ø {(stats.engagement / stats.count).toFixed(1)}% Engagement</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent KPIs */}
      <Card>
        <CardHeader><CardTitle>Letzte Einträge</CardTitle></CardHeader>
        <CardContent>
          {kpis.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine KPIs eingetragen.</p>
          ) : (
            <div className="space-y-2">
              {kpis.slice(0, 20).map((kpi) => (
                <div key={kpi.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{kpi.post?.title || "–"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(kpi.recordedAt).toLocaleDateString("de-DE")}
                      {kpi.postingTime && ` · ${kpi.postingTime}`}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span>{kpi.views.toLocaleString("de-DE")} Views</span>
                    <span>{kpi.likes} Likes</span>
                    <span>{kpi.saves} Saves</span>
                    <span className="font-medium">{kpi.engagementRate?.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
