"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Drawer } from "vaul";
import { Dialog as RadixDialog } from "radix-ui";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Truck,
  Briefcase,
  Building2,
  Package,
  Users,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { buildAllSearchItems, COLOR_CLASSES, type SearchItem, type SearchItemColor } from "@/lib/search-items";
import { NAV_GROUPS } from "@/lib/navigation";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

/* ─── Category config for sidebar ─── */

const DATA_CATEGORIES: { group: string; icon: LucideIcon; color: SearchItemColor }[] = [
  { group: "Shipments", icon: Truck, color: "primary" },
  { group: "Clients", icon: Briefcase, color: "success" },
  { group: "Sites", icon: Briefcase, color: "success" },
  { group: "Vendors", icon: Building2, color: "warning" },
  { group: "Waste Types", icon: Package, color: "info" },
  { group: "Users", icon: Users, color: "primary" },
];

/* ─── Item renderers ─── */

function PageItem({ item, onSelect }: { item: SearchItem; onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <Command.Item
      value={`${item.label} ${item.description ?? ""} ${item.keywords?.join(" ") ?? ""}`}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-secondary transition-colors data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-500"
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-text-muted" />}
      <span className="truncate">{item.label}</span>
      {item.description && (
        <span className="ml-auto truncate text-xs text-text-muted">{item.description}</span>
      )}
    </Command.Item>
  );
}

function DataItem({ item, onSelect }: { item: SearchItem; onSelect: () => void }) {
  const Icon = item.icon;
  const colors = item.color ? COLOR_CLASSES[item.color] : COLOR_CLASSES.primary;

  return (
    <Command.Item
      value={`${item.label} ${item.description ?? ""} ${item.keywords?.join(" ") ?? ""}`}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-border-default px-3 py-2.5 transition-colors data-[selected=true]:border-primary-200 data-[selected=true]:bg-primary-50"
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border", colors.bg, colors.border, colors.text)}>
        {Icon && <Icon className="h-4 w-4" />}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate text-sm font-medium text-text-primary">{item.label}</span>
        {item.description && (
          <span className="truncate text-xs text-text-muted">{item.description}</span>
        )}
      </div>
    </Command.Item>
  );
}

/* ─── Group heading ─── */

const GROUP_HEADING_CLASS = "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-muted";

/* ─── Component ─── */

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const allItems = React.useMemo(
    () => buildAllSearchItems(user?.role),
    [user?.role]
  );

  // Quick links: main nav pages only (not admin, not reports tabs)
  const quickLinks = React.useMemo(() => {
    const mainGroup = NAV_GROUPS[0];
    if (!mainGroup) return [];
    return mainGroup.items.slice(0, 4).map((item) => ({
      label: item.label,
      href: item.href,
      icon: item.icon,
    }));
  }, []);

  // Category counts
  const categoryCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of allItems) {
      if (item.type === "data") {
        counts.set(item.group, (counts.get(item.group) ?? 0) + 1);
      }
    }
    return counts;
  }, [allItems]);

  const isMac = React.useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent),
    []
  );

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

  // Reset category filter when closing
  React.useEffect(() => {
    if (!open) setActiveCategory(null);
  }, [open]);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  // Filter items by active category
  const filteredItems = React.useMemo(() => {
    if (!activeCategory) return allItems;
    return allItems.filter((item) => item.group === activeCategory);
  }, [allItems, activeCategory]);

  // Group filtered items
  const grouped = React.useMemo(() => {
    const groups = new Map<string, SearchItem[]>();
    for (const item of filteredItems) {
      const existing = groups.get(item.group) ?? [];
      existing.push(item);
      groups.set(item.group, existing);
    }
    return groups;
  }, [filteredItems]);

  const isMobile = useIsMobile();

  /* ─── Desktop content: two-panel ─── */
  const desktopContent = (
    <Command className="flex flex-1 flex-col overflow-hidden" loop>
      {/* Search input */}
      <div className="flex items-center gap-2 border-b border-border-default px-4">
        <Search className="h-4 w-4 shrink-0 text-text-muted" />
        <Command.Input
          placeholder="Search shipments, vendors, pages..."
          className="flex-1 bg-transparent py-3.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
          onValueChange={() => {
            // Clear category filter when user starts typing
            if (activeCategory) setActiveCategory(null);
          }}
        />
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border-default bg-bg-surface px-1.5 font-mono text-[10px] font-medium text-text-muted">
          esc
        </kbd>
      </div>

      {/* Two-panel body */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <div className="w-48 shrink-0 border-r border-border-default overflow-y-auto p-2 space-y-4">
          {/* Quick links */}
          <div>
            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">Quick Links</p>
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.href}
                  onClick={() => handleSelect(link.href)}
                  className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary cursor-pointer"
                >
                  {Icon && <Icon className="h-3.5 w-3.5 text-text-muted" />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* Data categories */}
          <div>
            <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">Categories</p>
            {DATA_CATEGORIES.filter((cat) => categoryCounts.has(cat.group)).map((cat) => {
              const Icon = cat.icon;
              const count = categoryCounts.get(cat.group) ?? 0;
              const isActive = activeCategory === cat.group;
              const colors = COLOR_CLASSES[cat.color];
              return (
                <button
                  key={cat.group}
                  onClick={() => setActiveCategory(isActive ? null : cat.group)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm transition-colors cursor-pointer",
                    isActive ? "bg-primary-50 text-primary-500 font-medium" : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                  )}
                >
                  <div className={cn("flex h-5 w-5 items-center justify-center rounded", colors.bg, colors.text)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="flex-1 text-left">{cat.group}</span>
                  <span className="text-xs text-text-muted">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right results panel */}
        <Command.List className="flex-1 overflow-y-auto p-3">
          <Command.Empty className="py-12 text-center text-sm text-text-muted">
            No results found.
          </Command.Empty>
          {Array.from(grouped.entries()).map(([group, items]) => (
            <Command.Group key={group} heading={group} className={GROUP_HEADING_CLASS}>
              <div className={items[0]?.type === "data" ? "grid grid-cols-2 gap-1.5" : "space-y-0.5"}>
                {items.map((item) =>
                  item.type === "data" ? (
                    <DataItem key={item.id} item={item} onSelect={() => handleSelect(item.href)} />
                  ) : (
                    <PageItem key={item.id} item={item} onSelect={() => handleSelect(item.href)} />
                  )
                )}
              </div>
            </Command.Group>
          ))}
        </Command.List>
      </div>
    </Command>
  );

  /* ─── Mobile content: single column with cards ─── */
  const mobileContent = (
    <Command className="flex flex-1 flex-col overflow-hidden" loop>
      <div className="flex items-center gap-2 border-b border-border-default px-4">
        <Search className="h-4 w-4 shrink-0 text-text-muted" />
        <Command.Input
          placeholder="Search..."
          className="flex-1 bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
      </div>
      <Command.List className="flex-1 overflow-y-auto p-2">
        <Command.Empty className="py-8 text-center text-sm text-text-muted">
          No results found.
        </Command.Empty>
        {Array.from(grouped.entries()).map(([group, items]) => (
          <Command.Group key={group} heading={group} className={GROUP_HEADING_CLASS}>
            <div className="space-y-1">
              {items.map((item) =>
                item.type === "data" ? (
                  <DataItem key={item.id} item={item} onSelect={() => handleSelect(item.href)} />
                ) : (
                  <PageItem key={item.id} item={item} onSelect={() => handleSelect(item.href)} />
                )
              )}
            </div>
          </Command.Group>
        ))}
      </Command.List>
    </Command>
  );

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
          {isMac ? "\u2318" : "Ctrl+"}K
        </kbd>
      </button>

      {isMobile ? (
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
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1.5 w-10 rounded-full bg-text-muted/30" />
              </div>
              <Drawer.Title className="sr-only">Search</Drawer.Title>
              {mobileContent}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <RadixDialog.Root open={open} onOpenChange={setOpen}>
          <AnimatePresence>
            {open && (
              <RadixDialog.Portal forceMount>
                <RadixDialog.Overlay asChild forceMount>
                  <motion.div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                </RadixDialog.Overlay>
                <RadixDialog.Content asChild forceMount>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8,
                    }}
                    className={cn(
                      "fixed left-1/2 top-[12%] z-50 -translate-x-1/2",
                      "flex max-h-[min(600px,80dvh)] w-[min(95vw,56rem)] flex-col",
                      "rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-xl",
                      "focus:outline-none"
                    )}
                  >
                    <RadixDialog.Title className="sr-only">Search</RadixDialog.Title>
                    {desktopContent}
                  </motion.div>
                </RadixDialog.Content>
              </RadixDialog.Portal>
            )}
          </AnimatePresence>
        </RadixDialog.Root>
      )}
    </>
  );
}
