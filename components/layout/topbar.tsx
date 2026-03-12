"use client";

import * as React from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Command } from "cmdk";
import { Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buildBreadcrumbs, NAV_GROUPS } from "@/lib/navigation";
import { CommandPalette } from "@/components/ui/command-palette";
import { Notifications } from "./notifications";
import { UserMenu } from "./user-menu";
import { useAuth } from "@/lib/auth-context";

/* ─── Search items ─── */

interface SearchItem {
  id: string;
  label: string;
  group: string;
  href: string;
  icon?: React.ElementType;
  keywords?: string[];
}

function buildSearchItems(userRole: string | undefined): SearchItem[] {
  const items: SearchItem[] = [];
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.roles && userRole && !item.roles.includes(userRole)) continue;
      items.push({
        id: item.href,
        label: item.label,
        group: group.label,
        href: item.href,
        icon: item.icon,
        keywords: [item.label.toLowerCase()],
      });
    }
  }
  return items;
}

const REPORT_TABS: SearchItem[] = [
  { id: "report-waste-trends", label: "Waste Trends", group: "Reports", href: "/reports?tab=waste-trends", keywords: ["waste", "trends", "volume"] },
  { id: "report-cost-analysis", label: "Cost Analysis", group: "Reports", href: "/reports?tab=cost-analysis", keywords: ["cost", "revenue", "margin"] },
  { id: "report-light-load", label: "Light Load", group: "Reports", href: "/reports?tab=light-load", keywords: ["light", "load", "underweight"] },
  { id: "report-regulatory", label: "Regulatory", group: "Reports", href: "/reports?tab=regulatory", keywords: ["regulatory", "compliance", "rcra"] },
  { id: "report-operations", label: "Operations", group: "Reports", href: "/reports?tab=operations", keywords: ["operations", "vendors", "sites"] },
  { id: "report-data-quality", label: "Data Quality", group: "Reports", href: "/reports?tab=data-quality", keywords: ["data", "quality", "errors"] },
  { id: "report-vendor-intel", label: "Vendor Intel", group: "Reports", href: "/reports?tab=vendor-intel", keywords: ["vendor", "intel", "performance"] },
  { id: "report-logistics", label: "Logistics", group: "Reports", href: "/reports?tab=logistics", keywords: ["logistics", "transport", "miles"] },
  { id: "report-emissions", label: "Emissions", group: "Reports", href: "/reports?tab=emissions", keywords: ["emissions", "ghg", "sustainability"] },
];

/* ─── Mobile Topbar ─── */

const TRANSITION_MS = 280;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"; // iOS-like spring feel

function MobileTopbar() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchActive, setSearchActive] = React.useState(false);
  const [resultsVisible, setResultsVisible] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const navItems = React.useMemo(() => buildSearchItems(user?.role), [user?.role]);
  const allItems = React.useMemo(() => [...navItems, ...REPORT_TABS], [navItems]);

  const grouped = React.useMemo(() => {
    const groups = new Map<string, SearchItem[]>();
    for (const item of allItems) {
      const existing = groups.get(item.group) ?? [];
      existing.push(item);
      groups.set(item.group, existing);
    }
    return groups;
  }, [allItems]);

  function handleActivate() {
    setSearchActive(true);
    // Stagger: results fade in slightly after the bar animation starts
    requestAnimationFrame(() => {
      setResultsVisible(true);
      inputRef.current?.focus();
    });
  }

  function handleCancel() {
    setResultsVisible(false);
    // Let results fade out, then collapse the bar
    setTimeout(() => {
      setSearchActive(false);
    }, TRANSITION_MS / 2);
  }

  function handleSelect(href: string) {
    setResultsVisible(false);
    setTimeout(() => {
      setSearchActive(false);
      router.push(href);
    }, 120);
  }

  const transition = `all ${TRANSITION_MS}ms ${EASE}`;

  return (
    <Command loop className="sm:hidden">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border-default bg-bg-card/95 backdrop-blur-sm px-4">
        {/* Profile avatar — slides out left */}
        <div
          style={{
            transition,
            maxWidth: searchActive ? 0 : 40,
            opacity: searchActive ? 0 : 1,
            transform: searchActive ? "translateX(-12px) scale(0.8)" : "translateX(0) scale(1)",
            overflow: "hidden",
          }}
          className="shrink-0"
        >
          <UserMenu />
        </div>

        {/* Search box — always rendered, grows to fill */}
        <div
          className="flex flex-1 min-w-0 items-center gap-2 rounded-[var(--radius-sm)] border border-border-default bg-bg-surface px-3 py-1.5"
          style={{ transition: `border-color ${TRANSITION_MS}ms ${EASE}` }}
          onClick={!searchActive ? handleActivate : undefined}
          role={!searchActive ? "button" : undefined}
          tabIndex={!searchActive ? 0 : undefined}
        >
          <Search className="h-4 w-4 shrink-0 text-text-muted" />
          {searchActive ? (
            <Command.Input
              ref={inputRef}
              placeholder="Search pages, reports..."
              className="flex-1 min-w-0 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          ) : (
            <span className="text-sm text-text-muted select-none cursor-pointer">Search...</span>
          )}
        </div>

        {/* Right side: bell slides out, cancel fades in */}
        <div className="relative shrink-0 flex items-center">
          {/* Notifications bell — slides out right */}
          <div
            style={{
              transition,
              width: searchActive ? 0 : 32,
              opacity: searchActive ? 0 : 1,
              transform: searchActive ? "translateX(12px) scale(0.8)" : "translateX(0) scale(1)",
              pointerEvents: searchActive ? "none" : "auto",
            }}
            className="shrink-0"
          >
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
              tabIndex={searchActive ? -1 : 0}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                5
              </span>
            </Link>
          </div>

          {/* Cancel button — fades in from right */}
          <button
            onClick={handleCancel}
            className="text-sm font-medium text-primary-400 active:text-primary-600 whitespace-nowrap"
            style={{
              transition,
              maxWidth: searchActive ? 80 : 0,
              opacity: searchActive ? 1 : 0,
              transform: searchActive ? "translateX(0)" : "translateX(8px)",
              overflow: "hidden",
              pointerEvents: searchActive ? "auto" : "none",
            }}
            tabIndex={searchActive ? 0 : -1}
          >
            Cancel
          </button>
        </div>
      </header>

      {/* Results overlay — fades in + slides up */}
      <div
        className="fixed inset-x-0 top-14 bottom-0 z-30 bg-bg-app overflow-y-auto"
        style={{
          transition: `opacity ${TRANSITION_MS}ms ${EASE}, transform ${TRANSITION_MS}ms ${EASE}`,
          opacity: resultsVisible ? 1 : 0,
          transform: resultsVisible ? "translateY(0)" : "translateY(8px)",
          pointerEvents: resultsVisible ? "auto" : "none",
        }}
      >
        <Command.List className="p-2">
          <Command.Empty className="py-12 text-center text-sm text-text-muted">
            No results found.
          </Command.Empty>
          {Array.from(grouped.entries()).map(([group, items]) => (
            <Command.Group
              key={group}
              heading={group}
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-muted"
            >
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                    onSelect={() => handleSelect(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2.5 text-sm text-text-secondary transition-colors data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-500"
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0 text-text-muted" />}
                    <span>{item.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}
        </Command.List>
      </div>
    </Command>
  );
}

/* ─── Main Topbar ─── */

export function Topbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const crumbs = buildBreadcrumbs(pathname, tab);

  return (
    <>
      {/* Mobile topbar */}
      <MobileTopbar />

      {/* Desktop topbar */}
      <header className="sticky top-0 z-30 hidden sm:flex h-14 items-center justify-between border-b border-border-default bg-bg-card/95 backdrop-blur-sm px-4 lg:px-6 transition-colors duration-150 ease-out">
        {/* Left: breadcrumbs */}
        <div className="flex items-center gap-3">
          {crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        </div>

        {/* Right: search + notifications + user menu */}
        <div className="flex items-center gap-2">
          <CommandPalette />
          <Notifications />
          <div className="mx-1 h-5 w-px bg-border-default" />
          <UserMenu />
        </div>
      </header>
    </>
  );
}
