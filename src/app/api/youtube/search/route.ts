import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "YOUTUBE_API_KEY nicht gesetzt" }, { status: 500 });
    }

    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "10",
      relevanceLanguage: "de",
      key: apiKey,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "YouTube API error" }, { status: res.status });
    }

    const videos = data.items?.map((item: Record<string, unknown>) => {
      const snippet = item.snippet as Record<string, unknown>;
      const id = item.id as Record<string, string>;
      const thumbnails = snippet.thumbnails as Record<string, Record<string, unknown>>;
      return {
        videoId: id.videoId,
        title: snippet.title,
        description: snippet.description,
        thumbnail: (thumbnails.medium as Record<string, unknown>)?.url,
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${id.videoId}`,
      };
    }) || [];

    return NextResponse.json({ videos });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
