import { prisma } from "@/lib/prisma";
import { PILLARS, type PillarKey } from "@/lib/brand-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Calendar, Sparkles, BarChart3, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [posts, allPosts, recentKpis, ideas] = await Promise.all([
    prisma.post.findMany({
      where: { scheduledDate: { gte: weekStart, lte: weekEnd } },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.post.findMany({ where: { status: "PUBLISHED" } }),
    prisma.kPI.findMany({ orderBy: { recordedAt: "desc" }, take: 10 }),
    prisma.idea.findMany({
      where: { convertedToPostId: null },
      orderBy: { rating: "desc" },
      take: 5,
    }),
  ]);

  const pillarCounts: Record<string, number> = {};
  for (const post of allPosts) {
    pillarCounts[post.pillar] = (pillarCounts[post.pillar] || 0) + 1;
  }

  const totalViews = recentKpis.reduce((sum, k) => sum + k.views, 0);
  const totalLikes = recentKpis.reduce((sum, k) => sum + k.likes, 0);
  const totalSaves = recentKpis.reduce((sum, k) => sum + k.saves, 0);
  const avgEngagement =
    recentKpis.length > 0
      ? recentKpis.reduce((sum, k) => sum + (k.engagementRate || 0), 0) / recentKpis.length
      : 0;

  return { posts, pillarCounts, totalViews, totalLikes, totalSaves, avgEngagement, ideas, allPostsCount: allPosts.length };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const now = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(now, { weekStartsOn: 1 }), i)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Willkommen zurück, Felix.</p>
      </div>

      {/* KPI Widgets */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Views (letzte 10)", value: data.totalViews.toLocaleString("de-DE") },
          { label: "Likes", value: data.totalLikes.toLocaleString("de-DE") },
          { label: "Saves", value: data.totalSaves.toLocaleString("de-DE") },
          { label: "Ø Engagement", value: `${data.avgEngagement.toFixed(1)}%` },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/studio">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-3 pt-6">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Neue Idee generieren</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/calendar">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-3 pt-6">
              <Calendar className="h-5 w-5 text-green-500" />
              <span className="font-medium">Post einplanen</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-3 pt-6">
              <Plus className="h-5 w-5 text-orange-500" />
              <span className="font-medium">KPIs eintragen</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Week Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Diese Woche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayPosts = data.posts.filter(
                  (p) =>
                    p.scheduledDate &&
                    format(p.scheduledDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                );
                const isToday = format(day, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
                return (
                  <div
                    key={day.toISOString()}
                    className={`rounded-lg border p-2 min-h-24 ${isToday ? "border-primary bg-primary/5" : ""}`}
                  >
                    <p className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {format(day, "EEE d.", { locale: de })}
                    </p>
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        className={`mb-1 rounded px-1.5 py-0.5 text-xs text-white ${PILLARS[post.pillar as PillarKey]?.color || "bg-gray-500"}`}
                      >
                        {post.title.length > 20 ? post.title.slice(0, 20) + "…" : post.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pillar Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Säulen-Verteilung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.entries(PILLARS) as [PillarKey, (typeof PILLARS)[PillarKey]][]).map(
              ([key, pillar]) => {
                const count = data.pillarCounts[key] || 0;
                const total = data.allPostsCount || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{pillar.label}</span>
                      <span className="text-muted-foreground">{pct}% (Ziel: {pillar.target}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${pillar.color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              }
            )}
            {data.allPostsCount === 0 && (
              <p className="text-sm text-muted-foreground">Noch keine Posts.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Ideas */}
      {data.ideas.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Ideen</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.ideas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{idea.hook}</p>
                    {idea.description && <p className="text-xs text-muted-foreground">{idea.description}</p>}
                  </div>
                  <Badge variant="outline">{PILLARS[idea.pillar as PillarKey]?.label || idea.pillar}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
