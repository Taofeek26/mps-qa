"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MobileBackButton } from "@/components/ui/mobile-back-button";
import { useAuditLog } from "@/lib/hooks/use-api-data";

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

export default function NotificationsPage() {
  const { logs: entries } = useAuditLog();
  const displayEntries = entries.slice(0, 20);

  const unreadCount = 5;

  return (
    <div className="space-y-4">
      <MobileBackButton />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Notifications</h1>
        <button className="text-xs font-medium text-primary-400 active:text-primary-600">
          Mark all read
        </button>
      </div>

      {/* Notification list */}
      <div className="-mx-4 bg-bg-card">
        {displayEntries.length > 0 ? (
          displayEntries.map((entry, idx) => {
            const initials = entry.actor.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const isLast = idx === displayEntries.length - 1;

            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-start gap-3 pl-4 transition-colors active:bg-bg-subtle",
                  idx < unreadCount && "bg-primary-50/50"
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-400/20 text-[10px] font-bold text-success-600 mt-3.5">
                  {initials}
                </div>
                <div
                  className={cn(
                    "flex-1 min-w-0 py-3.5 pr-4",
                    !isLast && "border-b border-border-strong"
                  )}
                >
                  <p className="text-sm text-text-primary leading-snug">
                    {entry.summary}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {getRelativeTime(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-sm text-text-muted">
            No notifications
          </div>
        )}
      </div>
    </div>
  );
}
