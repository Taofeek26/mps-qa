"use client";

import { cn } from "@/lib/utils";

interface ProgressListItem {
  label: string;
  value: number;
  displayValue: string;
  /** Optional secondary text (right-aligned below the bar) */
  secondary?: string;
  color?: string;
}

interface ProgressListProps {
  items: ProgressListItem[];
  maxItems?: number;
  className?: string;
}

export function ProgressList({
  items,
  maxItems = 10,
  className,
}: ProgressListProps) {
  const visible = items.slice(0, maxItems);
  const maxVal = visible.length > 0 ? Math.max(...visible.map((i) => Math.abs(i.value))) : 1;

  return (
    <div className={cn("space-y-3", className)}>
      {visible.map((item, i) => {
        const pct = maxVal > 0 ? (Math.abs(item.value) / maxVal) * 100 : 0;
        const barColor = item.color ?? "var(--color-primary-400)";

        return (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-text-primary truncate">
                {item.label}
              </span>
              <span className="text-xs font-medium text-text-secondary shrink-0 font-mono">
                {item.displayValue}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-bg-subtle overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(pct, 100).toFixed(1)}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
            {item.secondary && (
              <p className="text-[10px] text-text-muted mt-0.5">{item.secondary}</p>
            )}
          </div>
        );
      })}
      {items.length === 0 && (
        <p className="text-xs text-text-muted text-center py-4">No data available</p>
      )}
    </div>
  );
}
