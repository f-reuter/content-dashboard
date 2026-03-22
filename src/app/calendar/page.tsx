"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PILLARS, FORMATS, PLATFORMS, STATUSES, PLATFORM_CHANNELS, type PillarKey, type PlatformChannelKey } from "@/lib/brand-config";
import { PlatformStatusDots } from "@/components/shared/platform-badge";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";

interface PostPlatformStatus {
  id: string;
  platform: string;
  published: boolean;
  publishedAt: string | null;
}

interface Post {
  id: string;
  title: string;
  hook: string | null;
  pillar: string;
  format: string;
  platforms: string;
  status: string;
  scheduledDate: string | null;
  script: string | null;
  caption: string | null;
  hashtags: string | null;
  platformStatuses: PostPlatformStatus[];
}

export default function CalendarPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const fetchPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  async function savePost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      id: editingPost?.id,
      title: fd.get("title") as string,
      hook: fd.get("hook") as string,
      pillar: fd.get("pillar") as string,
      format: fd.get("format") as string,
      platforms: fd.getAll("platforms") as string[],
      status: fd.get("status") as string,
      scheduledDate: fd.get("scheduledDate") as string || null,
      script: fd.get("script") as string,
      caption: fd.get("caption") as string,
      hashtags: fd.get("hashtags") as string,
    };

    await fetch("/api/posts", {
      method: editingPost?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setDialogOpen(false);
    setEditingPost(null);
    fetchPosts();
  }

  async function deletePost(id: string) {
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    fetchPosts();
  }

  async function togglePlatformStatus(postId: string, platform: string, published: boolean) {
    await fetch("/api/posts/platform-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, platform, published }),
    });
    fetchPosts();
  }

  function openEdit(post: Post) {
    setEditingPost(post);
    setDialogOpen(true);
  }

  function openNew(date?: Date) {
    setEditingPost(date ? {
      id: "", title: "", hook: null, pillar: "AI", format: "REEL",
      platforms: "INSTAGRAM", status: "IDEA",
      scheduledDate: format(date, "yyyy-MM-dd"),
      script: null, caption: null, hashtags: null, platformStatuses: [],
    } : null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content-Kalender</h1>
          <p className="text-muted-foreground">Plane und verwalte deine Posts.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button onClick={() => openNew()}>
              <Plus className="mr-2 h-4 w-4" /> Neuer Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost?.id ? "Post bearbeiten" : "Neuer Post"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={savePost} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input id="title" name="title" defaultValue={editingPost?.title || ""} required />
                </div>
                <div>
                  <Label htmlFor="scheduledDate">Datum</Label>
                  <Input id="scheduledDate" name="scheduledDate" type="date" defaultValue={editingPost?.scheduledDate?.split("T")[0] || ""} />
                </div>
              </div>
              <div>
                <Label htmlFor="hook">Hook</Label>
                <Input id="hook" name="hook" defaultValue={editingPost?.hook || ""} placeholder="Die ersten 1-2 Sekunden..." />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="pillar">Säule</Label>
                  <select id="pillar" name="pillar" defaultValue={editingPost?.pillar || "AI"} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                    {Object.entries(PILLARS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="format">Format</Label>
                  <select id="format" name="format" defaultValue={editingPost?.format || "REEL"} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                    {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select id="status" name="status" defaultValue={editingPost?.status || "IDEA"} className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm">
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Plattformen</Label>
                <div className="flex gap-3 mt-1">
                  {Object.entries(PLATFORMS).map(([k, v]) => (
                    <label key={k} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name="platforms" value={k} defaultChecked={editingPost?.platforms?.includes(k) ?? k === "INSTAGRAM"} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              {/* Platform Status Tracking */}
              {editingPost?.id && editingPost.platformStatuses?.length > 0 && (
                <div>
                  <Label>Posting-Status pro Plattform</Label>
                  <div className="mt-2 space-y-2">
                    {editingPost.platformStatuses.map((ps) => {
                      const channel = PLATFORM_CHANNELS[ps.platform as PlatformChannelKey];
                      if (!channel) return null;
                      return (
                        <label
                          key={ps.platform}
                          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                            ps.published ? "border-green-300 bg-green-50" : "hover:bg-accent"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            togglePlatformStatus(editingPost.id, ps.platform, !ps.published);
                          }}
                        >
                          <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                            ps.published ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                          }`}>
                            {ps.published && <Check className="h-3 w-3" />}
                          </div>
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${channel.color}`} />
                          <span className="text-sm font-medium">{channel.label}</span>
                          {ps.published && ps.publishedAt && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {new Date(ps.publishedAt).toLocaleDateString("de-DE")}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="script">Script</Label>
                <Textarea id="script" name="script" rows={4} defaultValue={editingPost?.script || ""} placeholder="Video-Script..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea id="caption" name="caption" rows={2} defaultValue={editingPost?.caption || ""} />
                </div>
                <div>
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Input id="hashtags" name="hashtags" defaultValue={editingPost?.hashtags || ""} placeholder="#ai #effizienz" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingPost?.id ? "Speichern" : "Erstellen"}</Button>
                {editingPost?.id && (
                  <Button type="button" variant="destructive" onClick={() => { deletePost(editingPost.id); setDialogOpen(false); }}>
                    Löschen
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold min-w-48 text-center">
          {format(currentDate, "MMMM yyyy", { locale: de })}
        </h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Heute</Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-px bg-border">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
              <div key={d} className="bg-card p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
            {days.map((d) => {
              const dayPosts = posts.filter(
                (p) => p.scheduledDate && isSameDay(new Date(p.scheduledDate), d)
              );
              const isCurrentMonth = isSameMonth(d, currentDate);
              const isToday = isSameDay(d, new Date());
              return (
                <div
                  key={d.toISOString()}
                  className={`bg-card min-h-28 p-1.5 cursor-pointer hover:bg-accent/50 transition-colors ${!isCurrentMonth ? "opacity-40" : ""}`}
                  onClick={() => openNew(d)}
                >
                  <p className={`text-xs mb-1 ${isToday ? "font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center" : "text-muted-foreground"}`}>
                    {format(d, "d")}
                  </p>
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`group mb-1 rounded px-1.5 py-1 text-xs text-white cursor-pointer ${PILLARS[post.pillar as PillarKey]?.color || "bg-gray-500"}`}
                      onClick={(e) => { e.stopPropagation(); router.push(`/posts/${post.id}`); }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{post.title}</span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-white/20 rounded p-0.5"
                          onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
                          title="Post löschen"
                        >
                          ×
                        </button>
                      </div>
                      {post.platformStatuses?.length > 0 && (
                        <div className="mt-0.5">
                          <PlatformStatusDots platformStatuses={post.platformStatuses} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ready to Schedule */}
      {(() => {
        const unscheduled = posts.filter((p) => !p.scheduledDate && p.status !== "PUBLISHED");
        if (unscheduled.length === 0) return null;
        return (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm">Bereit zum Einplanen</h3>
                <span className="text-xs text-muted-foreground">({unscheduled.length} Posts ohne Datum)</span>
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {unscheduled.map((post) => (
                  <div
                    key={post.id}
                    className="group flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => router.push(`/posts/${post.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`h-2 w-2 rounded-full ${PILLARS[post.pillar as PillarKey]?.color || "bg-gray-400"}`} />
                        <span className="text-xs text-muted-foreground">{post.format}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{post.status}</span>
                      </div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity p-1"
                      onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
                      title="Löschen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {(Object.entries(PILLARS) as [PillarKey, (typeof PILLARS)[PillarKey]][]).map(([key, p]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded ${p.color}`} />
            <span className="text-sm text-muted-foreground">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
