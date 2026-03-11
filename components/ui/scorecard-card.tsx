"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ScorecardCardVariant = "default" | "success" | "warning" | "error";
type ScorecardStatus = "on-track" | "at-risk" | "behind";

interface ScorecardTrend {
  /** Percentage change vs prior period */
  value: number;
  direction: "up" | "down";
  /** When true, "down" is colored green (good) and "up" is red (bad) */
  invertColor?: boolean;
  /** Contextual label, e.g. "vs last month" */
  label?: string;
}

interface ScorecardGoal {
  target: number | string;
  met: boolean;
}

interface ScorecardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  variant?: ScorecardCardVariant;
  trend?: ScorecardTrend;
  goal?: ScorecardGoal;
  status?: ScorecardStatus;
}

/* Aligned with KpiCard: green-tinted icon box */
const iconBoxStyles =
  "bg-success-400/20 border border-success-400/30 text-success-600";

const statusBarStyles: Record<ScorecardStatus, string> = {
  "on-track": "bg-success-600",
  "at-risk": "bg-warning-500",
  behind: "bg-error-600",
};

const ScorecardCard = React.forwardRef<HTMLDivElement, ScorecardCardProps>(
  (
    {
      className,
      title,
      value,
      icon: Icon,
      variant = "default",
      trend,
      goal,
      status,
      ...props
    },
    ref
  ) => {
    // Determine trend color: normally up=green/down=red, inverted when invertColor is true
    const trendIsPositive = trend
      ? trend.invertColor
        ? trend.direction === "down"
        : trend.direction === "up"
      : false;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-bg-card",
          className
        )}
        {...props}
      >
        {/* Card content */}
        <div className="flex-1 p-4 sm:p-5">
          {/* Header: icon + title */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted truncate">
                {title}
              </p>

              {/* Primary value */}
              <p className="mt-1.5 text-2xl font-bold text-text-primary tracking-tight">
                {value}
              </p>

              {/* Trend indicator */}
              {trend && (
                <div
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
                    trendIsPositive ? "text-success-600" : "text-error-600"
                  )}
                >
                  {trend.direction === "up" ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {trend.direction === "up" ? "+" : "-"}
                    {Math.abs(trend.value)}%
                  </span>
                  {trend.label && (
                    <span className="font-normal text-text-muted">
                      {trend.label}
                    </span>
                  )}
                </div>
              )}

              {/* Goal indicator */}
              {goal && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                  <Target className="h-3.5 w-3.5 shrink-0" />
                  <span>Goal: {goal.target}</span>
                  {goal.met ? (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-success-100">
                      <Check className="h-3 w-3 text-success-600" />
                    </span>
                  ) : (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-error-100">
                      <X className="h-3 w-3 text-error-600" />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Icon badge — neutral styling to match design system (KpiCard) */}
            {Icon && (
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                  iconBoxStyles
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>

        {/* Status bar — thin color-coded strip at the bottom */}
        {status && (
          <div
            className={cn("h-1 w-full", statusBarStyles[status])}
            role="presentation"
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);
ScorecardCard.displayName = "ScorecardCard";

export {
  ScorecardCard,
  type ScorecardCardProps,
  type ScorecardCardVariant,
  type ScorecardTrend,
  type ScorecardGoal,
  type ScorecardStatus,
};
