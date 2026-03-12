"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  TrendingUp,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Tabs ─── */

interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
  matchPrefixes: string[];
}

const TABS: TabItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, matchPrefixes: ["/dashboard"] },
  { label: "Shipments", href: "/shipments", icon: Truck, matchPrefixes: ["/shipments"] },
  { label: "Reports", href: "/reports", icon: TrendingUp, matchPrefixes: ["/reports"] },
  { label: "More", href: "/more", icon: MoreHorizontal, matchPrefixes: ["/more", "/admin", "/reports/builder"] },
];

/* ─── Component ─── */

export function MobileTabBar() {
  const pathname = usePathname();
  const barRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<Map<number, HTMLElement>>(new Map());
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null);
  const hasMounted = React.useRef(false);

  function isActive(tab: TabItem): boolean {
    // Reports tab should not highlight for /reports/builder (that's under More)
    if (tab.href === "/reports" && pathname.startsWith("/reports/builder")) return false;
    return tab.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
  }

  const activeIndex = React.useMemo(() => {
    // Check More first since it has overlapping prefixes
    const moreTab = TABS[TABS.length - 1];
    if (moreTab.matchPrefixes.some((p) => pathname.startsWith(p)) && !pathname.startsWith("/reports/builder") === false) {
      // Check if it's specifically a "more" route
    }
    // Reverse check: More tab's prefixes minus reports
    for (let i = TABS.length - 1; i >= 0; i--) {
      if (isActive(TABS[i])) return i;
    }
    return -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const measureIndicator = React.useCallback(() => {
    if (activeIndex < 0 || !barRef.current) { setIndicator(null); return; }
    const el = tabRefs.current.get(activeIndex);
    if (!el) { setIndicator(null); return; }
    const barRect = barRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({ left: elRect.left - barRect.left + (elRect.width - 32) / 2, width: 32 });
  }, [activeIndex]);

  React.useEffect(() => {
    measureIndicator();
    requestAnimationFrame(() => { hasMounted.current = true; });
    window.addEventListener("resize", measureIndicator);
    return () => window.removeEventListener("resize", measureIndicator);
  }, [measureIndicator]);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border-default bg-bg-card/95 backdrop-blur-md pb-safe">
      <div ref={barRef} className="relative flex items-stretch">
        {indicator && (
          <div
            className="absolute top-0 h-0.5 rounded-full bg-primary-400"
            style={{
              left: indicator.left,
              width: indicator.width,
              transition: hasMounted.current ? "left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />
        )}

        {TABS.map((tab, i) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={(el) => { if (el) tabRefs.current.set(i, el); }}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                active ? "text-primary-400" : "text-text-muted active:text-text-primary"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className={cn("text-[10px] leading-tight", active ? "font-bold" : "font-medium")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
