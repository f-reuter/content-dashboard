import { prisma } from "@/lib/prisma";
import { scanYouTubeCompetitors } from "@/lib/scanners/youtube";
import { scanInstagramCompetitors, scanTikTokCompetitors } from "@/lib/scanners/apify";
import { analyzeViralContent, scanTrends } from "@/lib/scanners/claude-trends";
import { NextResponse } from "next/server";

export const maxDuration = 120; // Allow up to 2 minutes

export async function POST() {
  const startTime = Date.now();
  const results = {
    youtube: { scanned: 0, saved: 0 },
    instagram: { scanned: 0, saved: 0 },
    tiktok: { scanned: 0, saved: 0 },
    trends: 0,
    analyzed: 0,
    errors: [] as string[],
  };

  try {
    // Load all active competitors grouped by platform
    const competitors = await prisma.competitor.findMany({
      where: { isActive: true },
    });

    const byPlatform = {
      YOUTUBE: competitors.filter((c) => c.platform === "YOUTUBE"),
      INSTAGRAM: competitors.filter((c) => c.platform === "INSTAGRAM"),
      TIKTOK: competitors.filter((c) => c.platform === "TIKTOK"),
    };

    // Run scans in parallel
    const scanPromises: Promise<void>[] = [];

    if (byPlatform.YOUTUBE.length > 0) {
      scanPromises.push(
        scanYouTubeCompetitors(byPlatform.YOUTUBE)
          .then((r) => { results.youtube = r; })
          .catch((e) => { results.errors.push(`YouTube: ${e.message}`); })
      );
    }

    if (byPlatform.INSTAGRAM.length > 0) {
      scanPromises.push(
        scanInstagramCompetitors(byPlatform.INSTAGRAM)
          .then((r) => { results.instagram = r; })
          .catch((e) => { results.errors.push(`Instagram: ${e.message}`); })
      );
    }

    if (byPlatform.TIKTOK.length > 0) {
      scanPromises.push(
        scanTikTokCompetitors(byPlatform.TIKTOK)
          .then((r) => { results.tiktok = r; })
          .catch((e) => { results.errors.push(`TikTok: ${e.message}`); })
      );
    }

    // Always scan trends via Claude AI
    scanPromises.push(
      scanTrends()
        .then((count) => { results.trends = count; })
        .catch((e) => { results.errors.push(`Trends: ${e.message}`); })
    );

    await Promise.all(scanPromises);

    // Analyze top viral content with Claude
    const topContent = await prisma.scannedContent.findMany({
      where: {
        aiAnalysis: null,
        viralScore: { gt: 10 },
      },
      orderBy: { viralScore: "desc" },
      take: 10,
    });

    if (topContent.length > 0) {
      try {
        results.analyzed = await analyzeViralContent(topContent);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown";
        results.errors.push(`Analysis: ${msg}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`General: ${msg}`);
  }

  const totalScanned =
    results.youtube.scanned + results.instagram.scanned + results.tiktok.scanned;
  const totalSaved =
    results.youtube.saved + results.instagram.saved + results.tiktok.saved;

  return NextResponse.json({
    success: results.errors.length === 0,
    duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    scanned: totalScanned,
    saved: totalSaved,
    newTrends: results.trends,
    analyzed: results.analyzed,
    details: results,
  });
}
