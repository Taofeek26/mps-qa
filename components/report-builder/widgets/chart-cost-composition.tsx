"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, TOOLTIP_STYLE, CATEGORY_COLORS } from "@/components/charts";
import { computeCostComposition } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

const SERIES = [
  { dataKey: "Haul", color: CATEGORY_COLORS[0] },
  { dataKey: "Disposal", color: CATEGORY_COLORS[1] },
  { dataKey: "Fuel", color: CATEGORY_COLORS[2] },
  { dataKey: "Environmental", color: CATEGORY_COLORS[3] },
  { dataKey: "Other", color: CATEGORY_COLORS[4] },
] as const;

export function ChartCostComposition({ shipments }: { shipments: Shipment[] }) {
  const data = computeCostComposition(shipments);

  return (
    <ChartContainer title="Cost Composition" subtitle="Monthly cost breakdown by category (stacked)">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis
            width={60}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {SERIES.map(({ dataKey, color }) => (
            <Area
              key={dataKey}
              type="monotone"
              dataKey={dataKey}
              stackId="1"
              stroke={color}
              fill={color}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
