"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match any path that starts with these prefixes */
  matchPrefixes: string[];
}

const TABS: TabItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchPrefixes: ["/dashboard"],
  },
  {
    label: "Shipments",
    href: "/shipments",
    icon: Truck,
    matchPrefixes: ["/shipments"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: TrendingUp,
    matchPrefixes: ["/reports"],
  },
  {
    label: "Admin",
    href: "/admin/clients",
    icon: Settings,
    matchPrefixes: ["/admin"],
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  function isActive(tab: TabItem): boolean {
    return tab.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border-default bg-bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                active
                  ? "text-primary-400"
                  : "text-text-muted active:text-text-primary"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  active ? "font-bold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
