"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
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

  return (
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
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11 }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
