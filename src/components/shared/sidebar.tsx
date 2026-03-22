"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  BarChart3,
  Lightbulb,
  Anchor,
  Repeat,
  Film,
  Radar,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/studio", label: "AI Studio", icon: Sparkles },
  { href: "/ideas", label: "Ideen-Pool", icon: Lightbulb },
  { href: "/hooks", label: "Hook-Bibliothek", icon: Anchor },
  { href: "/scanner", label: "Scanner", icon: Radar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/series", label: "Serien", icon: Repeat },
  { href: "/batch", label: "Batch-Planer", icon: Film },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          FR
        </div>
        <div>
          <p className="text-sm font-semibold">Freuter Personal Brand</p>
          <p className="text-xs text-muted-foreground">Content Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Einstellungen
        </Link>
      </div>
    </aside>
  );
}
