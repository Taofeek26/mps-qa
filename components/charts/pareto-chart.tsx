"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { CATEGORY_COLORS, TOOLTIP_STYLE } from "@/components/charts";

interface ParetoChartProps {
  data: Array<{ name: string; value: number }>;
  barColor?: string;
  lineColor?: string;
  valueFormatter?: (value: number) => string;
  showThreshold?: boolean;
  thresholdValue?: number;
}

interface ParetoDataPoint {
  name: string;
  value: number;
  cumulativePercent: number;
}

function computeParetoData(
  data: Array<{ name: string; value: number }>
): ParetoDataPoint[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return sorted.map((item) => ({
      ...item,
      cumulativePercent: 0,
    }));
  }

  let cumulative = 0;
  return sorted.map((item) => {
    cumulative += item.value;
    return {
      name: item.name,
      value: item.value,
      cumulativePercent: Number(((cumulative / total) * 100).toFixed(1)),
    };
  });
}

const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--color-text-muted)",
} as const;

export function ParetoChart({
  data,
  barColor = CATEGORY_COLORS[0],
  lineColor = CATEGORY_COLORS[1],
  valueFormatter = (value: number) => value.toLocaleString(),
  showThreshold = true,
  thresholdValue = 80,
}: ParetoChartProps) {
  const paretoData = computeParetoData(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={paretoData}
        margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border-default)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border-default)" }}
          interval={0}
          angle={paretoData.length > 6 ? -35 : 0}
          textAnchor={paretoData.length > 6 ? "end" : "middle"}
          height={paretoData.length > 6 ? 80 : 40}
        />
        <YAxis
          yAxisId="left"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border-default)" }}
          tickFormatter={(value) => valueFormatter(value)}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border-default)" }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value, name) => {
            if (name === "cumulativePercent") {
              return [`${value}%`, "Cumulative %"];
            }
            return [valueFormatter(value as number), "Value"];
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="value"
          fill={barColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        />
        <Line
          yAxisId="right"
          dataKey="cumulativePercent"
          type="monotone"
          stroke={lineColor}
          strokeWidth={2}
          dot={{
            r: 4,
            fill: lineColor,
            stroke: "var(--color-bg-card)",
            strokeWidth: 2,
          }}
          activeDot={{
            r: 6,
            fill: lineColor,
            stroke: "var(--color-bg-card)",
            strokeWidth: 2,
          }}
        />
        {showThreshold && (
          <ReferenceLine
            yAxisId="right"
            y={thresholdValue}
            stroke="var(--color-text-muted)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `${thresholdValue}%`,
              position: "insideTopRight",
              fill: "var(--color-text-muted)",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
