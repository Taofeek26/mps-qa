"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, type NavItem, type NavGroup } from "@/lib/navigation";
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

/** Check if any item in a group (including subGroups) matches the pathname */
function groupContainsActive(group: NavGroup, pathname: string): boolean {
  const check = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  if (group.items.some((item) => check(item.href))) return true;
  if (group.subGroups) {
    return group.subGroups.some((sg) => sg.items.some((item) => check(item.href)));
  }
  return false;
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

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  /* Compute initial expanded state — auto-expand groups containing active route */
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      if (group.collapsible) {
        initial[group.label] =
          group.defaultExpanded || groupContainsActive(group, pathname);
      }
    }
    return initial;
  });

  /* Auto-expand when navigating into a collapsed group */
  React.useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const group of NAV_GROUPS) {
        if (group.collapsible && !prev[group.label] && groupContainsActive(group, pathname)) {
          next[group.label] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname]);

  function toggleGroup(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  /* Filter groups by role */
  const filteredGroups = NAV_GROUPS.map((group) => {
    const filteredItems = filterItems(group.items, user?.role);
    const filteredSubGroups = group.subGroups
      ?.map((sg) => ({ ...sg, items: filterItems(sg.items, user?.role) }))
      .filter((sg) => sg.items.length > 0);

    const totalItems =
      filteredItems.length +
      (filteredSubGroups?.reduce((sum, sg) => sum + sg.items.length, 0) ?? 0);

    return { ...group, items: filteredItems, subGroups: filteredSubGroups, _totalItems: totalItems };
  }).filter((group) => group._totalItems > 0);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col shrink-0 border-r border-border-default bg-nav-sidebar sticky top-0 h-screen transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-border-default shrink-0",
          collapsed ? "justify-center h-14 px-2" : "h-14 px-5"
        )}
      >
        {collapsed ? (
          <Image src="/logo.png" alt="MPS" width={32} height={32} priority />
        ) : (
          <Image src="/logo.png" alt="MPS" width={90} height={32} priority />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {/* Group header */}
            {!collapsed && group.collapsible ? (
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    expanded[group.label] ? "rotate-0" : "-rotate-90"
                  )}
                />
              </button>
            ) : !collapsed ? (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {group.label}
              </p>
            ) : null}

            {/* Collapsible content */}
            {group.collapsible && !collapsed ? (
              <div
                className="grid transition-[grid-template-rows] duration-200"
                style={{
                  gridTemplateRows: expanded[group.label] ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  {/* Direct items (Reports group) */}
                  {group.items.length > 0 && (
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.href}
                          item={item}
                          active={isActive(item.href)}
                          collapsed={false}
                        />
                      ))}
                    </div>
                  )}

                  {/* Sub-groups (Admin group) */}
                  {group.subGroups?.map((sg) => (
                    <div key={sg.label} className="mt-2 first:mt-0">
                      <p className="px-3 mb-0.5 pt-1 text-[10px] font-medium uppercase tracking-wider text-text-muted/60">
                        {sg.label}
                      </p>
                      <div className="space-y-0.5">
                        {sg.items.map((item) => (
                          <NavLink
                            key={item.href}
                            item={item}
                            active={isActive(item.href)}
                            collapsed={false}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Non-collapsible or collapsed sidebar — flat items */
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                  />
                ))}
                {/* In collapsed mode, show subgroup items as flat icons */}
                {collapsed &&
                  group.subGroups?.flatMap((sg) =>
                    sg.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={isActive(item.href)}
                        collapsed={true}
                      />
                    ))
                  )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-border-default p-2">
        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex items-center gap-2 w-full rounded-[var(--radius-sm)] text-text-muted hover:text-text-primary hover:bg-gray-100 transition-colors cursor-pointer",
            collapsed ? "justify-center h-9 w-full" : "px-3 h-9"
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
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-sm)] transition-colors text-sm font-medium",
        collapsed ? "justify-center h-9 w-full" : "px-3 h-9",
        active
          ? "bg-primary-50 text-primary-500"
          : "text-text-secondary hover:text-text-primary hover:bg-gray-100"
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
