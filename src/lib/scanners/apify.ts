import { prisma } from "@/lib/prisma";

interface ApifyRunResult {
  id: string;
  status: string;
  defaultDatasetId: string;
}

async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN nicht gesetzt");

  // Start actor run
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  const runData: { data: ApifyRunResult } = await runRes.json();
  const runId = runData.data?.id;
  if (!runId) throw new Error("Apify run failed to start");

  // Wait for completion (poll every 5s, max 2min)
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
    );
    const statusData: { data: ApifyRunResult } = await statusRes.json();

    if (statusData.data.status === "SUCCEEDED") {
      const datasetId = statusData.data.defaultDatasetId;
      const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=50`
      );
      return await itemsRes.json();
    }
    if (statusData.data.status === "FAILED" || statusData.data.status === "ABORTED") {
      throw new Error(`Apify run ${statusData.data.status}`);
    }
  }
  throw new Error("Apify run timed out");
}

export async function scanInstagramCompetitors(
  competitors: Array<{ id: string; handle: string; name: string }>
): Promise<{ scanned: number; saved: number }> {
  if (!process.env.APIFY_TOKEN) return { scanned: 0, saved: 0 };

  let totalScanned = 0;
  let totalSaved = 0;

  for (const competitor of competitors) {
    try {
      const items = await runApifyActor("apify~instagram-post-scraper", {
        directUrls: [`https://www.instagram.com/${competitor.handle}/`],
        resultsLimit: 20,
        resultsType: "posts",
      });

      for (const item of items) {
        const views = Number(item.videoViewCount || item.videoPlayCount || 0);
        const likes = Number(item.likesCount || 0);
        const commentCount = Number(item.commentsCount || 0);
        const viralScore = views > 0
          ? ((likes + commentCount * 2) / views) * 1000
          : likes > 0 ? likes : 0;

        const externalId = String(item.id || item.shortCode || `ig_${Date.now()}_${totalSaved}`);

        await prisma.scannedContent.upsert({
          where: { platform_externalId: { platform: "INSTAGRAM", externalId } },
          update: { views, likes, comments: commentCount, viralScore, scannedAt: new Date() },
          create: {
            competitorId: competitor.id,
            platform: "INSTAGRAM",
            externalId,
            title: null,
            caption: String(item.caption || "").slice(0, 500) || null,
            url: item.url ? String(item.url) : null,
            thumbnailUrl: item.displayUrl ? String(item.displayUrl) : null,
            views,
            likes,
            comments: commentCount,
            publishedAt: item.timestamp ? new Date(String(item.timestamp)) : null,
            viralScore,
            hashtags: Array.isArray(item.hashtags) ? (item.hashtags as string[]).join(",") : null,
            contentType: item.type === "Video" ? "REEL" : item.type === "Sidecar" ? "CAROUSEL" : "POST",
          },
        });
        totalSaved++;
      }
      totalScanned += items.length;
    } catch (error) {
      console.error(`Instagram scan failed for ${competitor.name}:`, error);
    }
  }

  return { scanned: totalScanned, saved: totalSaved };
}

export async function scanTikTokCompetitors(
  competitors: Array<{ id: string; handle: string; name: string }>
): Promise<{ scanned: number; saved: number }> {
  if (!process.env.APIFY_TOKEN) return { scanned: 0, saved: 0 };

  let totalScanned = 0;
  let totalSaved = 0;

  for (const competitor of competitors) {
    try {
      const items = await runApifyActor("clockworks~tiktok-scraper", {
        profiles: [`https://www.tiktok.com/@${competitor.handle}`],
        resultsPerPage: 20,
        shouldDownloadVideos: false,
      });

      for (const item of items) {
        const views = Number(item.playCount || item.videoMeta?.viewCount || 0);
        const likes = Number(item.diggCount || item.likes || 0);
        const commentCount = Number(item.commentCount || item.comments || 0);
        const shares = Number(item.shareCount || item.shares || 0);
        const viralScore = views > 0
          ? ((likes + commentCount * 2 + shares * 3) / views) * 1000
          : 0;

        const externalId = String(item.id || `tt_${Date.now()}_${totalSaved}`);

        await prisma.scannedContent.upsert({
          where: { platform_externalId: { platform: "TIKTOK", externalId } },
          update: { views, likes, comments: commentCount, shares, viralScore, scannedAt: new Date() },
          create: {
            competitorId: competitor.id,
            platform: "TIKTOK",
            externalId,
            title: null,
            caption: String(item.text || item.desc || "").slice(0, 500) || null,
            url: item.webVideoUrl ? String(item.webVideoUrl) : null,
            thumbnailUrl: item.covers?.default ? String(item.covers.default) : null,
            views,
            likes,
            comments: commentCount,
            shares,
            publishedAt: item.createTime ? new Date(Number(item.createTime) * 1000) : null,
            viralScore,
            hashtags: Array.isArray(item.hashtags)
              ? (item.hashtags as Array<Record<string, string>>).map((h) => h.name).join(",")
              : null,
            contentType: "REEL",
          },
        });
        totalSaved++;
      }
      totalScanned += items.length;
    } catch (error) {
      console.error(`TikTok scan failed for ${competitor.name}:`, error);
    }
  }

  return { scanned: totalScanned, saved: totalSaved };
}
