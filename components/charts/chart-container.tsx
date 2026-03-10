"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Fixed height in px — ignored when chartClassName is provided */
  height?: number;
  /** Tailwind classes for chart wrapper (use for responsive heights, e.g. "h-[250px] lg:h-[300px]") */
  chartClassName?: string;
  /** Optional left accent border for primary/hero chart */
  accent?: "left" | "none";
}

export function ChartContainer({
  title,
  subtitle,
  action,
  height = 300,
  chartClassName,
  accent = "none",
  children,
  className,
  ...props
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border-default bg-bg-card p-4 sm:p-5",
        accent === "left" && "border-l-4 border-l-primary-400",
        className
      )}
      role="figure"
      aria-label={`Chart: ${title}`}
      {...props}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-text-primary">{title}</h3>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div
        className={chartClassName}
        style={chartClassName ? undefined : { height }}
      >
        {children}
      </div>
    </div>
  );
}
