"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { PILLARS, FORMATS, PLATFORMS, STATUSES, type PillarKey, type FormatKey, type StatusKey } from "@/lib/brand-config";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

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
}

export default function CalendarPage() {
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
      method: editingPost ? "PUT" : "POST",
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

  function openEdit(post: Post) {
    setEditingPost(post);
    setDialogOpen(true);
  }

  function openNew(date?: Date) {
    setEditingPost(date ? { id: "", title: "", hook: null, pillar: "AI", format: "REEL", platforms: "INSTAGRAM", status: "IDEA", scheduledDate: format(date, "yyyy-MM-dd"), script: null, caption: null, hashtags: null } : null);
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
                      className={`mb-0.5 rounded px-1.5 py-0.5 text-xs text-white cursor-pointer ${PILLARS[post.pillar as PillarKey]?.color || "bg-gray-500"}`}
                      onClick={(e) => { e.stopPropagation(); openEdit(post); }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{post.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status Legend */}
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
