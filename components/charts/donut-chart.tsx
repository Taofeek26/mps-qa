"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CATEGORY_COLORS, TOOLTIP_STYLE } from "@/components/charts";

interface DonutChartDatum {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartDatum[];
  /** Override colors — falls back to CATEGORY_COLORS */
  colors?: string[];
  valueFormatter?: (value: number) => string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  showLegend?: boolean;
}

export function DonutChart({
  data,
  colors,
  valueFormatter = (v) => v.toLocaleString(),
  innerRadius = "60%",
  outerRadius = "85%",
  showLegend = true,
}: DonutChartProps) {
  const palette = colors ?? data.map((d, i) => d.color ?? CATEGORY_COLORS[i % CATEGORY_COLORS.length]);

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i]} />
          ))}
        </Pie>
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value) => [valueFormatter(value as number), ""]}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  if (!showLegend) {
    return chart;
  }

  return (
    <div className="flex h-full w-full items-center">
      <div className="h-[115%] aspect-square shrink-0">
        {chart}
      </div>
      <ul className="flex flex-1 flex-col gap-2 min-w-0 pl-6">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm leading-tight text-text-primary">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: palette[i] }}
            />
            <span className="truncate">{d.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
