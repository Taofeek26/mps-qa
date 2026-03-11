"use client";

import { cn } from "@/lib/utils";

interface TimelineHeatmapItem {
  id: string;
  label: string;
}

interface TimelineHeatmapDataPoint {
  period: string;
  count: number;
  items?: TimelineHeatmapItem[];
}

interface TimelineHeatmapProps {
  data: TimelineHeatmapDataPoint[];
  maxMonths?: number;
  onCellClick?: (
    period: string,
    items?: TimelineHeatmapItem[]
  ) => void;
  className?: string;
}

function getBarColorClass(count: number): string {
  if (count === 0) return "bg-bg-subtle";
  if (count <= 2) return "bg-warning-400";
  return "bg-error-400";
}

function getTooltipText(items?: TimelineHeatmapItem[]): string | undefined {
  if (!items || items.length === 0) return undefined;
  return items.map((item) => item.label).join(", ");
}

export function TimelineHeatmap({
  data,
  maxMonths = 6,
  onCellClick,
  className,
}: TimelineHeatmapProps) {
  const visibleData = data.slice(0, maxMonths);
  const maxCount = Math.max(...visibleData.map((d) => d.count), 1);

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      {visibleData.map((entry) => {
        const widthPercent =
          maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
        const isClickable = !!onCellClick;
        const tooltip = getTooltipText(entry.items);

        return (
          <div
            key={entry.period}
            className={cn(
              "grid min-w-0 items-center gap-3",
              "grid-cols-[4rem_minmax(0,1fr)_auto] sm:grid-cols-[5rem_minmax(0,1fr)_auto]"
            )}
          >
            {/* Period label */}
            <span className="text-xs font-medium text-text-muted truncate">
              {entry.period}
            </span>

            {/* Bar cell */}
            <div
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              title={tooltip}
              aria-label={`${entry.period}: ${entry.count} item${entry.count !== 1 ? "s" : ""}`}
              className={cn(
                "relative h-6 w-full rounded-sm bg-bg-subtle overflow-hidden",
                isClickable &&
                  "cursor-pointer hover:ring-2 hover:ring-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 transition-shadow"
              )}
              onClick={
                isClickable
                  ? () => onCellClick(entry.period, entry.items)
                  : undefined
              }
              onKeyDown={
                isClickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onCellClick(entry.period, entry.items);
                      }
                    }
                  : undefined
              }
            >
              {entry.count > 0 && (
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-sm transition-all duration-300",
                    getBarColorClass(entry.count)
                  )}
                  style={{ width: `${widthPercent}%` }}
                />
              )}
            </div>

            {/* Count label */}
            <span className="text-xs tabular-nums text-text-primary min-w-[3rem] text-right">
              {entry.count}
            </span>
          </div>
        );
      })}

      {visibleData.length === 0 && (
        <p className="text-sm text-text-muted py-4 text-center">
          No data available.
        </p>
      )}
    </div>
  );
}
