import { PLATFORM_CHANNELS, type PlatformChannelKey } from "@/lib/brand-config";
import { Check } from "lucide-react";

interface PlatformBadgeProps {
  platform: PlatformChannelKey;
  published?: boolean;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function PlatformBadge({
  platform,
  published,
  size = "sm",
  showLabel = false,
}: PlatformBadgeProps) {
  const channel = PLATFORM_CHANNELS[platform];
  if (!channel) return null;

  const sizeClasses = size === "sm" ? "h-5 text-[10px] px-1.5" : "h-6 text-xs px-2";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium text-white ${channel.color} ${sizeClasses} ${
        published === false ? "opacity-40" : ""
      }`}
      title={`${channel.label}${published !== undefined ? (published ? " — Gepostet" : " — Offen") : ""}`}
    >
      {showLabel && channel.label}
      {published && <Check className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
    </span>
  );
}

interface PlatformStatusDotsProps {
  platformStatuses: Array<{
    platform: string;
    published: boolean;
  }>;
}

export function PlatformStatusDots({ platformStatuses }: PlatformStatusDotsProps) {
  if (!platformStatuses?.length) return null;

  return (
    <div className="flex items-center gap-1">
      {platformStatuses.map((ps) => (
        <PlatformBadge
          key={ps.platform}
          platform={ps.platform as PlatformChannelKey}
          published={ps.published}
          size="sm"
        />
      ))}
    </div>
  );
}
