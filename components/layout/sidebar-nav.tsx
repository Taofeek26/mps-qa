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

export function SidebarNav({ collapsed, onToggleCollapse }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  /* Filter nav items by user role */
  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || (user && item.roles.includes(user.role))
    ),
  })).filter((group) => group.items.length > 0);

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
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
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
                />
              ))}
            </div>
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
