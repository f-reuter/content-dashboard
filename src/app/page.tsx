import { prisma } from "@/lib/prisma";
import { PILLARS, PLATFORM_CHANNELS, type PillarKey, type PlatformChannelKey } from "@/lib/brand-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Calendar, Sparkles, Plus, Check } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [posts, allPosts, recentKpis, ideas, allPlatformStatuses] = await Promise.all([
    prisma.post.findMany({
      where: { scheduledDate: { gte: weekStart, lte: weekEnd } },
      orderBy: { scheduledDate: "asc" },
      include: { platformStatuses: true },
    }),
    prisma.post.findMany({ where: { status: "PUBLISHED" } }),
    prisma.kPI.findMany({ orderBy: { recordedAt: "desc" }, take: 10 }),
    prisma.idea.findMany({
      where: { convertedToPostId: null },
      orderBy: { rating: "desc" },
      take: 5,
    }),
    prisma.postPlatformStatus.findMany(),
  ]);

  const pillarCounts: Record<string, number> = {};
  for (const post of allPosts) {
    pillarCounts[post.pillar] = (pillarCounts[post.pillar] || 0) + 1;
  }

  // Platform channel stats
  const channelStats: Record<string, { total: number; published: number }> = {};
  for (const key of Object.keys(PLATFORM_CHANNELS)) {
    channelStats[key] = { total: 0, published: 0 };
  }
  for (const ps of allPlatformStatuses) {
    if (channelStats[ps.platform]) {
      channelStats[ps.platform].total++;
      if (ps.published) channelStats[ps.platform].published++;
    }
  }

  const totalViews = recentKpis.reduce((sum, k) => sum + k.views, 0);
  const totalLikes = recentKpis.reduce((sum, k) => sum + k.likes, 0);
  const totalSaves = recentKpis.reduce((sum, k) => sum + k.saves, 0);
  const avgEngagement =
    recentKpis.length > 0
      ? recentKpis.reduce((sum, k) => sum + (k.engagementRate || 0), 0) / recentKpis.length
      : 0;

  return { posts, pillarCounts, totalViews, totalLikes, totalSaves, avgEngagement, ideas, allPostsCount: allPosts.length, channelStats };
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

      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Plattform-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            {(Object.entries(PLATFORM_CHANNELS) as [PlatformChannelKey, (typeof PLATFORM_CHANNELS)[PlatformChannelKey]][]).map(
              ([key, channel]) => {
                const stats = data.channelStats[key];
                return (
                  <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className={`h-3 w-3 rounded-full ${channel.color}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{channel.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.published}/{stats.total} gepostet
                      </p>
                    </div>
                    {stats.total > 0 && stats.published === stats.total && (
                      <Check className="ml-auto h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

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
                      <div key={post.id} className="mb-1">
                        <div
                          className={`rounded px-1.5 py-0.5 text-xs text-white ${PILLARS[post.pillar as PillarKey]?.color || "bg-gray-500"}`}
                        >
                          {post.title.length > 20 ? post.title.slice(0, 20) + "…" : post.title}
                        </div>
                        {post.platformStatuses?.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {post.platformStatuses.map((ps) => {
                              const ch = PLATFORM_CHANNELS[ps.platform as PlatformChannelKey];
                              return ch ? (
                                <span
                                  key={ps.platform}
                                  className={`h-1.5 w-1.5 rounded-full ${ps.published ? ch.color : "bg-gray-300"}`}
                                  title={`${ch.label}: ${ps.published ? "Gepostet" : "Offen"}`}
                                />
                              ) : null;
                            })}
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
