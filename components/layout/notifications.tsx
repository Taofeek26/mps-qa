"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { getAuditLog } from "@/lib/mock-data";
import type { AuditLogEntry } from "@/lib/types";

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function Notifications() {
  const [entries] = React.useState<AuditLogEntry[]>(() => {
    const result = getAuditLog(undefined, 1, 8);
    return result.data;
  });

  const unreadCount = Math.min(entries.length, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-text-muted transition-colors duration-150 ease-out hover:bg-bg-surface hover:text-text-primary cursor-pointer focus-ring"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <p className="text-sm font-semibold text-text-primary">Notifications</p>
          <button className="text-xs font-medium text-primary-400 hover:text-primary-500 transition-colors cursor-pointer">
            Mark all read
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {entries.length > 0 ? (
            entries.map((entry, idx) => {
              const initials = entry.actor.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-bg-surface cursor-pointer",
                    idx < unreadCount && "bg-primary-50/50"
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-400/20 text-[10px] font-bold text-success-600">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-primary leading-snug line-clamp-2">
                      {entry.summary}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {getRelativeTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-text-muted">
              No notifications
            </div>
          )}
        </div>
        <div className="border-t border-border-default px-4 py-2.5">
          <Link
            href="/admin/audit-log"
            className="block text-center text-xs font-medium text-primary-400 hover:text-primary-500 transition-colors"
          >
            View all activity
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
