"use client";

export { ChartContainer } from "./chart-container";
export { ParetoChart } from "./pareto-chart";
export { TimelineHeatmap } from "./timeline-heatmap";
export { WaterfallChart } from "./waterfall-chart";
export { ScatterQuadrant } from "./scatter-quadrant";

/**
 * Design-token-aligned color palette for charts.
 * Uses CSS custom property values from the brand theme.
 */
export const CHART_COLORS = {
  primary: "var(--color-primary-400)",
  primaryLight: "var(--color-primary-200)",
  teal: "var(--color-teal-400)",
  tealLight: "var(--color-teal-200)",
  success: "var(--color-success-500)",
  warning: "var(--color-warning-500)",
  error: "var(--color-error-500)",
  muted: "var(--color-text-muted)",
} as const;

/**
 * Categorical palette for multi-series charts.
 * 8 visually distinct colors using design tokens.
 */
export const CATEGORY_COLORS = [
  "#1863DC", // primary blue
  "#00B38C", // teal
  "#F59E0B", // amber/warning
  "#EF4444", // red/error
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
] as const;

/**
 * Common Recharts tooltip styles matching design system.
 */
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border-default)",
    borderRadius: "var(--radius-sm)",
    fontSize: 12,
    color: "var(--color-text-primary)",
  },
  labelStyle: {
    color: "var(--color-text-muted)",
    fontWeight: 600,
    marginBottom: 4,
  },
} as const;
