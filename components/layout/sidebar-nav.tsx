"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const { user } = useAuth();
  const navRef = React.useRef<HTMLElement>(null);
  const itemRefs = React.useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = React.useState<{
    top: number;
    height: number;
  } | null>(null);
  const hasMounted = React.useRef(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/reports")
      return (
        pathname === "/reports" ||
        (pathname.startsWith("/reports/") &&
          !pathname.startsWith("/reports/builder"))
      );
    return pathname.startsWith(href);
  }

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
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  collapsed={collapsed}
                  registerRef={registerRef}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

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
