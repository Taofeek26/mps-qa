"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from "recharts";
import { CATEGORY_COLORS, TOOLTIP_STYLE } from "@/components/charts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WaterfallStep {
  /** Label shown on the X axis */
  name: string;
  /** Positive = add, negative = subtract */
  value: number;
  /** If true the bar represents a running total (starts from 0, distinct color) */
  isTotal?: boolean;
}

export interface WaterfallChartProps {
  data: WaterfallStep[];
  /** Color for positive (additive) bars. Default: teal */
  positiveColor?: string;
  /** Color for negative (subtractive) bars. Default: red */
  negativeColor?: string;
  /** Color for total bars. Default: blue */
  totalColor?: string;
  /** Formatter applied to values in the tooltip and Y-axis */
  valueFormatter?: (value: number) => string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface ComputedBar {
  name: string;
  invisible: number;
  visible: number;
  /** The actual signed value for the tooltip */
  raw: number;
  color: string;
  isTotal: boolean;
}

function computeWaterfallData(
  data: WaterfallStep[],
  positiveColor: string,
  negativeColor: string,
  totalColor: string,
): ComputedBar[] {
  let runningTotal = 0;

  return data.map((step) => {
    if (step.isTotal) {
      // Total bar: show the running total, starting from 0
      const bar: ComputedBar = {
        name: step.name,
        invisible: runningTotal < 0 ? runningTotal : 0,
        visible: Math.abs(runningTotal),
        raw: runningTotal,
        color: totalColor,
        isTotal: true,
      };
      return bar;
    }

    const prevTotal = runningTotal;
    runningTotal += step.value;

    const isNegative = step.value < 0;

    const bar: ComputedBar = {
      name: step.name,
      invisible: isNegative ? runningTotal : prevTotal,
      visible: Math.abs(step.value),
      raw: step.value,
      color: isNegative ? negativeColor : positiveColor,
      isTotal: false,
    };

    // Ensure invisible is never negative for rendering – clamp to 0 and adjust
    // if both invisible and visible would put us below 0 we keep the math intact
    // because Recharts handles negative domain fine.
    return bar;
  });
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface CustomPayload {
  raw: number;
  isTotal: boolean;
}

function WaterfallTooltip(
  props: TooltipProps<number, string> & {
    valueFormat?: (v: number) => string;
  }
) {
  const { active, payload, label, valueFormat: formatter } = props as {
    active?: boolean;
    payload?: Array<{ dataKey?: string; payload: CustomPayload }>;
    label?: string;
    valueFormat?: (v: number) => string;
  };
  if (!active || !payload || payload.length === 0) return null;

  // The "visible" bar carries our custom payload
  const visibleEntry = payload.find((p) => p.dataKey === "visible");
  if (!visibleEntry) return null;

  const custom = visibleEntry.payload as CustomPayload;
  const displayValue = formatter
    ? formatter(custom.raw)
    : custom.raw.toLocaleString();

  return (
    <div style={TOOLTIP_STYLE.contentStyle}>
      <p style={TOOLTIP_STYLE.labelStyle}>{label}</p>
      <p style={{ margin: 0, color: "var(--color-text-primary)" }}>
        {custom.isTotal ? "Total: " : ""}
        {displayValue}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WaterfallChart({
  data,
  positiveColor = CATEGORY_COLORS[1],
  negativeColor = CATEGORY_COLORS[3],
  totalColor = CATEGORY_COLORS[0],
  valueFormatter,
}: WaterfallChartProps) {
  const computedData = computeWaterfallData(
    data,
    positiveColor,
    negativeColor,
    totalColor,
  );

  const yTickFormatter = valueFormatter ?? ((v: number) => v.toLocaleString());

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={computedData}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border-default)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={{ stroke: "var(--color-border-default)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => yTickFormatter(value)}
        />
        <Tooltip
          content={(props) => <WaterfallTooltip {...(props as Record<string, unknown>)} valueFormat={valueFormatter} />}
          cursor={{ fill: "var(--color-bg-subtle)", opacity: 0.5 }}
        />
        {/* Invisible base bar — lifts the visible bar to the correct Y position */}
        <Bar dataKey="invisible" stackId="waterfall" fill="transparent" />
        {/* Visible value bar */}
        <Bar
          dataKey="visible"
          stackId="waterfall"
          radius={[4, 4, 0, 0]}
        >
          {computedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
