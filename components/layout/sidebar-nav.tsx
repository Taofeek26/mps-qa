"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, ChevronDown, LogOut, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, type NavItem } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface SidebarNavProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/** Filter items by user role */
function filterItems(items: NavItem[], userRole?: string): NavItem[] {
  return items.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );
}

export function SidebarNav({ collapsed, onToggleCollapse }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOutUser } = useAuth();
  const navRef = React.useRef<HTMLElement>(null);
  const itemRefs = React.useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = React.useState<{
    top: number;
    height: number;
  } | null>(null);
  const hasMounted = React.useRef(false);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  function toggleExpanded(href: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  const currentTab = searchParams.get("tab");

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    // Child items with query params (e.g. "/reports?tab=waste-trends")
    if (href.includes("?")) {
      const [path, query] = href.split("?");
      if (pathname !== path) return false;
      const params = new URLSearchParams(query);
      const tab = params.get("tab");
      return tab === currentTab;
    }
    if (href === "/reports")
      return (
        pathname === "/reports" ||
        (pathname.startsWith("/reports/") &&
          !pathname.startsWith("/reports/builder"))
      );
    return pathname.startsWith(href);
  }

  // Auto-expand/collapse parent items based on active child
  React.useEffect(() => {
    setExpandedItems((prev) => {
      const next = new Set<string>();
      for (const group of NAV_GROUPS) {
        for (const item of group.items) {
          if (item.children) {
            const isParentActive = isActive(item.href);
            const hasActiveChild = item.children.some((child) => isActive(child.href));
            if (isParentActive || hasActiveChild) {
              next.add(item.href);
            }
          }
        }
      }
      // Only update if changed
      if (next.size === prev.size && [...next].every((h) => prev.has(h))) return prev;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentTab]);

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: filterItems(group.items, user?.role),
  })).filter((group) => group.items.length > 0);

  // Find the active href
  const activeHref = React.useMemo(() => {
    for (const group of filteredGroups) {
      for (const item of group.items) {
        if (isActive(item.href)) return item.href;
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, filteredGroups]);

  // Measure the active item and position the indicator
  const measureIndicator = React.useCallback(() => {
    if (!activeHref || !navRef.current) {
      setIndicator(null);
      return;
    }
    const el = itemRefs.current.get(activeHref);
    if (!el) {
      setIndicator(null);
      return;
    }
    const navRect = navRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      top: elRect.top - navRect.top,
      height: elRect.height,
    });
  }, [activeHref]);

  // Measure on route change and collapse toggle
  React.useEffect(() => {
    // Small delay to let DOM settle after collapse animation
    const timeout = setTimeout(measureIndicator, 10);
    return () => clearTimeout(timeout);
  }, [measureIndicator, collapsed]);

  // Re-measure after expand/collapse animation finishes
  React.useEffect(() => {
    const timeout = setTimeout(measureIndicator, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedItems]);

  // After first measurement, enable transitions
  React.useEffect(() => {
    if (indicator !== null && !hasMounted.current) {
      // Allow one frame for the initial position to apply without animation
      requestAnimationFrame(() => {
        hasMounted.current = true;
      });
    }
  }, [indicator]);

  // Re-measure on resize (e.g. font size change)
  React.useEffect(() => {
    const observer = new ResizeObserver(measureIndicator);
    if (navRef.current) observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [measureIndicator]);

  const registerRef = React.useCallback(
    (href: string, el: HTMLAnchorElement | null) => {
      if (el) {
        itemRefs.current.set(href, el);
      } else {
        itemRefs.current.delete(href);
      }
    },
    []
  );

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col shrink-0 border-r border-border-default bg-nav-sidebar sticky top-0 h-screen transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center shrink-0 transition-[padding] duration-200 ease-out",
          collapsed ? "h-16 pl-3 pr-2" : "h-20 pl-5 pr-4"
        )}
      >
        {collapsed ? (
          <Image
            src="/logo.png"
            alt="MPS"
            width={44}
            height={44}
            className="object-contain"
            priority
          />
        ) : (
          <Image
            src="/logo.png"
            alt="MPS"
            width={130}
            height={46}
            className="object-contain"
            priority
          />
        )}
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="relative flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Animated active indicator — background + accent bar */}
        {indicator && (
          <span
            className="absolute left-3 right-3 rounded-md bg-primary-50 pointer-events-none"
            style={{
              top: indicator.top,
              height: indicator.height,
              transition: hasMounted.current
                ? "top 250ms cubic-bezier(0.4, 0, 0.2, 1), height 250ms cubic-bezier(0.4, 0, 0.2, 1)"
                : "none",
            }}
          >
            {/* Left accent bar */}
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary-400" />
          </span>
        )}

        {filteredGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-2 text-xs font-medium text-text-muted">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) =>
                item.children ? (
                  <NavParent
                    key={item.href}
                    item={item}
                    active={isActive(item.href) || item.children.some((c) => isActive(c.href))}
                    collapsed={collapsed}
                    expanded={expandedItems.has(item.href)}
                    onToggle={() => toggleExpanded(item.href)}
                    registerRef={registerRef}
                    isChildActive={isActive}
                  />
                ) : (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                    registerRef={registerRef}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className={cn(
          "shrink-0 border-t border-border-default",
          collapsed ? "p-2" : "p-3"
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={signOutUser}
                  className="flex items-center justify-center w-full h-9 rounded-md text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors duration-150 ease-out cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Sign out ({user.email})
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={signOutUser}
                className="flex items-center gap-2 w-full px-2 h-9 rounded-md text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors duration-150 ease-out cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs font-medium">Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <div className="shrink-0 p-3">
        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex items-center gap-2 w-full rounded-md text-text-muted hover:text-text-primary hover:bg-black/4 transition-colors duration-150 ease-out cursor-pointer",
            collapsed ? "justify-center h-9 w-full" : "px-2 h-9"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/* ─── Individual nav link ─── */

function NavLink({
  item,
  active,
  collapsed,
  registerRef,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  registerRef: (href: string, el: HTMLAnchorElement | null) => void;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      ref={(el) => registerRef(item.href, el)}
      href={item.href}
      className={cn(
        "relative z-[1] flex items-center gap-3 rounded-md transition-colors duration-150 ease-out text-sm",
        collapsed ? "justify-center h-10 w-full" : "px-2 h-10",
        active
          ? "text-primary-600 font-semibold"
          : "text-text-secondary font-medium hover:text-text-primary hover:bg-black/4"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

/* ─── Expandable parent nav item ─── */

function NavParent({
  item,
  active,
  collapsed,
  expanded,
  onToggle,
  registerRef,
  isChildActive,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  registerRef: (href: string, el: HTMLAnchorElement | null) => void;
  isChildActive: (href: string) => boolean;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            ref={(el) => registerRef(item.href, el)}
            href={item.href}
            className={cn(
              "relative z-[1] flex items-center justify-center rounded-md transition-colors duration-150 ease-out text-sm h-10 w-full",
              active
                ? "text-primary-600 font-semibold"
                : "text-text-secondary font-medium hover:text-text-primary hover:bg-black/4"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        ref={(el) => {
          if (el) registerRef(item.href, el as unknown as HTMLAnchorElement);
          else registerRef(item.href, null);
        }}
        onClick={onToggle}
        className={cn(
          "relative z-[1] flex items-center gap-3 rounded-md transition-colors duration-150 ease-out text-sm w-full px-2 h-10 cursor-pointer",
          active
            ? "text-primary-600 font-semibold"
            : "text-text-secondary font-medium hover:text-text-primary hover:bg-black/4"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && item.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-4 pl-3 border-l border-border-default space-y-0.5 mt-0.5 pb-0.5">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const childActive = isChildActive(child.href);
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 h-8 text-[13px] transition-colors duration-150 ease-out",
                      childActive
                        ? "text-primary-600 font-semibold bg-primary-50"
                        : "text-text-secondary font-medium hover:text-text-primary hover:bg-black/4"
                    )}
                  >
                    <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
