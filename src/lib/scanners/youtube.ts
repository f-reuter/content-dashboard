import { prisma } from "@/lib/prisma";

interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
}

export async function scanYouTubeCompetitors(
  competitors: Array<{ id: string; handle: string; name: string }>
): Promise<{ scanned: number; saved: number }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY nicht gesetzt");

  let totalScanned = 0;
  let totalSaved = 0;

  for (const competitor of competitors) {
    try {
      // Step 1: Get channel's uploads playlist
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${competitor.handle}&key=${apiKey}`
      );
      const channelData = await channelRes.json();
      const channel = channelData.items?.[0];
      if (!channel) continue;

      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) continue;

      // Channel average views for viral detection
      const totalViews = parseInt(channel.statistics?.viewCount || "0");
      const videoCount = parseInt(channel.statistics?.videoCount || "1");
      const avgViews = Math.floor(totalViews / videoCount);

      // Step 2: Get latest videos from playlist
      const playlistRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${apiKey}`
      );
      const playlistData = await playlistRes.json();
      const videoIds = playlistData.items
        ?.map((item: Record<string, unknown>) => {
          const snippet = item.snippet as Record<string, unknown>;
          const resourceId = snippet.resourceId as Record<string, string>;
          return resourceId.videoId;
        })
        .filter(Boolean)
        .join(",");

      if (!videoIds) continue;

      // Step 3: Get video statistics
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKey}`
      );
      const statsData = await statsRes.json();

      for (const video of statsData.items || []) {
        const views = parseInt(video.statistics?.viewCount || "0");
        const likes = parseInt(video.statistics?.likeCount || "0");
        const commentCount = parseInt(video.statistics?.commentCount || "0");

        // Calculate viral score
        const viralScore =
          views > 0
            ? ((likes + commentCount * 2) / views) * 1000
            : 0;

        // Determine content type from duration
        const duration = video.contentDetails?.duration || "";
        const isShort = parseDurationSeconds(duration) <= 60;

        await prisma.scannedContent.upsert({
          where: {
            platform_externalId: {
              platform: "YOUTUBE",
              externalId: video.id,
            },
          },
          update: {
            views,
            likes,
            comments: commentCount,
            viralScore,
            scannedAt: new Date(),
          },
          create: {
            competitorId: competitor.id,
            platform: "YOUTUBE",
            externalId: video.id,
            title: video.snippet?.title || null,
            caption: video.snippet?.description?.slice(0, 500) || null,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            thumbnailUrl: video.snippet?.thumbnails?.medium?.url || null,
            views,
            likes,
            comments: commentCount,
            publishedAt: video.snippet?.publishedAt
              ? new Date(video.snippet.publishedAt)
              : null,
            viralScore,
            hashtags: extractHashtags(video.snippet?.description || ""),
            contentType: isShort ? "SHORT" : "LONG",
          },
        });
        totalSaved++;
      }
      totalScanned += statsData.items?.length || 0;
    } catch (error) {
      console.error(`YouTube scan failed for ${competitor.name}:`, error);
    }
  }

  return { scanned: totalScanned, saved: totalSaved };
}

function parseDurationSeconds(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    (parseInt(match[1] || "0") * 3600) +
    (parseInt(match[2] || "0") * 60) +
    parseInt(match[3] || "0")
  );
}

function extractHashtags(text: string): string | null {
  const tags = text.match(/#\w+/g);
  return tags ? tags.join(",") : null;
}
