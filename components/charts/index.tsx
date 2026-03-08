"use client";

export { ChartContainer } from "./chart-container";
export { ParetoChart } from "./pareto-chart";
export { TimelineHeatmap } from "./timeline-heatmap";
export { WaterfallChart } from "./waterfall-chart";
export { ScatterQuadrant } from "./scatter-quadrant";
export { DonutChart } from "./donut-chart";
export { ProgressList } from "./progress-list";

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
 * 8 visually distinct colors using design tokens (resolved via CSS custom properties).
 */
export const CATEGORY_COLORS = [
  "var(--color-primary-400)",
  "var(--color-teal-400)",
  "var(--color-warning-500)",
  "var(--color-error-500)",
  "var(--color-primary-600)",
  "var(--color-teal-600)",
  "var(--color-warning-300)",
  "var(--color-success-500)",
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
