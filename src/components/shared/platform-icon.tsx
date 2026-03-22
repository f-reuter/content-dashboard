import { Instagram, Youtube, Linkedin } from "lucide-react";

// TikTok icon (lucide doesn't have one)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.56a8.2 8.2 0 0 0 4.76 1.51V6.64a4.85 4.85 0 0 1-1-.05z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<string, { icon: React.FC<{ className?: string }>; color: string }> = {
  INSTAGRAM: { icon: Instagram, color: "text-pink-500" },
  TIKTOK: { icon: TikTokIcon, color: "text-gray-900" },
  YOUTUBE: { icon: Youtube, color: "text-red-500" },
  YOUTUBE_LONG: { icon: Youtube, color: "text-red-500" },
  YOUTUBE_SHORT: { icon: Youtube, color: "text-red-400" },
  LINKEDIN: { icon: Linkedin, color: "text-blue-600" },
};

export function PlatformIcon({
  platform,
  className = "h-4 w-4",
  showLabel = false,
}: {
  platform: string;
  className?: string;
  showLabel?: boolean;
}) {
  const config = PLATFORM_ICONS[platform];
  if (!config) return <span className="text-xs">{platform}</span>;

  const Icon = config.icon;
  const labels: Record<string, string> = {
    INSTAGRAM: "Instagram",
    TIKTOK: "TikTok",
    YOUTUBE: "YouTube",
    YOUTUBE_LONG: "YT Long",
    YOUTUBE_SHORT: "YT Shorts",
    LINKEDIN: "LinkedIn",
  };

  return (
    <span className="inline-flex items-center gap-1">
      <Icon className={`${className} ${config.color}`} />
      {showLabel && <span className="text-xs">{labels[platform] || platform}</span>}
    </span>
  );
}
