"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Drawer } from "vaul";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";

/* ─── Searchable items ─── */

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

/* ─── Report tab items ─── */

const REPORT_TABS: SearchItem[] = [
  { id: "report-waste-trends", label: "Waste Trends", group: "Reports", href: "/reports?tab=waste-trends", keywords: ["waste", "trends", "volume"] },
  { id: "report-cost-analysis", label: "Cost Analysis", group: "Reports", href: "/reports?tab=cost-analysis", keywords: ["cost", "revenue", "margin", "financial"] },
  { id: "report-light-load", label: "Light Load", group: "Reports", href: "/reports?tab=light-load", keywords: ["light", "load", "underweight"] },
  { id: "report-regulatory", label: "Regulatory", group: "Reports", href: "/reports?tab=regulatory", keywords: ["regulatory", "compliance", "rcra"] },
  { id: "report-operations", label: "Operations", group: "Reports", href: "/reports?tab=operations", keywords: ["operations", "vendors", "sites"] },
  { id: "report-data-quality", label: "Data Quality", group: "Reports", href: "/reports?tab=data-quality", keywords: ["data", "quality", "errors"] },
  { id: "report-vendor-intel", label: "Vendor Intel", group: "Reports", href: "/reports?tab=vendor-intel", keywords: ["vendor", "intel", "performance"] },
  { id: "report-logistics", label: "Logistics", group: "Reports", href: "/reports?tab=logistics", keywords: ["logistics", "transport", "miles"] },
  { id: "report-emissions", label: "Emissions", group: "Reports", href: "/reports?tab=emissions", keywords: ["emissions", "ghg", "sustainability", "carbon"] },
];

/* ─── Component ─── */

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const navItems = React.useMemo(
    () => buildSearchItems(user?.role),
    [user?.role]
  );

  const allItems = React.useMemo(
    () => [...navItems, ...REPORT_TABS],
    [navItems]
  );

  const isMac = React.useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent),
    []
  );

  // Keyboard shortcut: Ctrl/Cmd + K
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  // Group items
  const grouped = React.useMemo(() => {
    const groups = new Map<string, SearchItem[]>();
    for (const item of allItems) {
      const existing = groups.get(item.group) ?? [];
      existing.push(item);
      groups.set(item.group, existing);
    }
    return groups;
  }, [allItems]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-xs text-text-muted transition-colors duration-150 ease-out hover:border-border-hover hover:text-text-secondary cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border-default bg-bg-card px-1.5 font-mono text-[10px] font-medium text-text-muted">
          {isMac ? "⌘" : "Ctrl+"}K
        </kbd>
      </button>

      {/* Command palette as bottom sheet */}
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
          <Drawer.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col",
              "w-full",
              "rounded-t-[var(--radius-lg)] border border-b-0 border-border-default bg-bg-card shadow-xl",
              "focus:outline-none"
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-text-muted/30" />
            </div>

            <Drawer.Title className="sr-only">Search</Drawer.Title>

            <Command className="flex flex-1 flex-col overflow-hidden" loop>
              <div className="flex items-center gap-2 border-b border-border-default px-4">
                <Search className="h-4 w-4 shrink-0 text-text-muted" />
                <Command.Input
                  placeholder="Search pages, reports..."
                  className="flex-1 bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </div>
              <Command.List className="flex-1 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-text-muted">
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
                          className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-secondary transition-colors data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-500"
                        >
                          {Icon && <Icon className="h-4 w-4 shrink-0 text-text-muted" />}
                          <span>{item.label}</span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
