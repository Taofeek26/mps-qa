"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  TrendingUp,
  MoreHorizontal,
  FileBarChart,
  Briefcase,
  Building2,
  FileText,
  Factory,
  Users,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

/* ─── Primary tabs (always visible) ─── */

interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
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
];

/* ─── "More" menu items ─── */

interface MoreItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
  roles?: string[];
}

const MORE_ITEMS: MoreItem[] = [
  { label: "Report Builder", href: "/reports/builder", icon: FileBarChart, group: "Primary" },
  { label: "Clients & Sites", href: "/admin/clients", icon: Briefcase, group: "Administration", roles: ["system_admin"] },
  { label: "Vendors", href: "/admin/vendors", icon: Building2, group: "Administration", roles: ["system_admin"] },
  { label: "Reference Data", href: "/admin/reference-data", icon: FileText, group: "Administration", roles: ["system_admin"] },
  { label: "Facilities & Transport", href: "/admin/facilities", icon: Factory, group: "Administration", roles: ["system_admin"] },
  { label: "Users", href: "/admin/users", icon: Users, group: "Administration", roles: ["system_admin"] },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText, group: "Administration", roles: ["admin", "system_admin"] },
];

/* ─── More sheet prefixes (to highlight the More tab when on these routes) ─── */

const MORE_PREFIXES = ["/admin", "/reports/builder"];

/* ─── Component ─── */

// Total number of tab slots (3 tabs + 1 more button)
const TAB_COUNT = TABS.length + 1;

export function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const barRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<Map<number, HTMLElement>>(new Map());
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null);
  const hasMounted = React.useRef(false);

  function isActive(tab: TabItem): boolean {
    if (tab.href === "/reports" && pathname.startsWith("/reports/builder")) return false;
    return tab.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
  }

  const moreActive = MORE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Find the active tab index
  const activeIndex = React.useMemo(() => {
    if (moreActive) return TABS.length; // More tab is last
    for (let i = 0; i < TABS.length; i++) {
      if (isActive(TABS[i])) return i;
    }
    return -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, moreActive]);

  // Measure and position the indicator
  const measureIndicator = React.useCallback(() => {
    if (activeIndex < 0 || !barRef.current) {
      setIndicator(null);
      return;
    }
    const el = tabRefs.current.get(activeIndex);
    if (!el) { setIndicator(null); return; }
    const barRect = barRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      left: elRect.left - barRect.left + (elRect.width - 32) / 2,
      width: 32,
    });
  }, [activeIndex]);

  React.useEffect(() => {
    measureIndicator();
    // Enable transitions after first paint
    requestAnimationFrame(() => { hasMounted.current = true; });
    window.addEventListener("resize", measureIndicator);
    return () => window.removeEventListener("resize", measureIndicator);
  }, [measureIndicator]);

  const filteredMoreItems = MORE_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  // Group items
  const grouped = React.useMemo(() => {
    const groups = new Map<string, MoreItem[]>();
    for (const item of filteredMoreItems) {
      const existing = groups.get(item.group) ?? [];
      existing.push(item);
      groups.set(item.group, existing);
    }
    return groups;
  }, [filteredMoreItems]);

  function handleMoreNav(href: string) {
    setMoreOpen(false);
    router.push(href);
  }

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border-default bg-bg-card/95 backdrop-blur-md pb-safe"
      >
        <div ref={barRef} className="relative flex items-stretch">
          {/* Sliding indicator */}
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
              </Link>
            );
          })}

          {/* More tab */}
          <button
            ref={(el) => { if (el) tabRefs.current.set(TABS.length, el); }}
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors cursor-pointer",
              moreActive
                ? "text-primary-400"
                : "text-text-muted active:text-text-primary"
            )}
          >
            <MoreHorizontal className={cn("h-5 w-5", moreActive && "stroke-[2.5]")} />
            <span
              className={cn(
                "text-[10px] leading-tight",
                moreActive ? "font-bold" : "font-medium"
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More bottom sheet */}
      <Drawer.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
          <Drawer.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex flex-col",
              "rounded-t-[var(--radius-lg)] border border-b-0 border-border-default bg-bg-card shadow-xl",
              "focus:outline-none"
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-text-muted/30" />
            </div>

            <Drawer.Title className="px-5 pt-2 pb-3 text-base font-semibold text-text-primary">
              More
            </Drawer.Title>

            <div className="overflow-y-auto px-3 pb-6 space-y-4">
              {Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group}>
                  <p className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname.startsWith(item.href);
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleMoreNav(item.href)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors cursor-pointer",
                            active
                              ? "bg-primary-50 text-primary-500 font-semibold"
                              : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                          )}
                        >
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
