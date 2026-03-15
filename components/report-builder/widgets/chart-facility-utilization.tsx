"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from "recharts";
import { ChartContainer, TOOLTIP_STYLE } from "@/components/charts";
import { computeFacilityUtilization } from "@/lib/report-builder-data";

function getUtilColor(utilization: number): string {
  if (utilization < 80) return "var(--color-success-500)";
  if (utilization <= 120) return "var(--color-warning-500)";
  return "var(--color-error-500)";
}

export function ChartFacilityUtilization() {
  const data = computeFacilityUtilization();

  return (
    <ChartContainer title="Facility Utilization" subtitle="Receiving facility capacity usage (%)">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Utilization"]}
          />
          <ReferenceLine
            x={100}
            stroke="var(--color-text-muted)"
            strokeDasharray="3 3"
            label={{
              value: "100%",
              position: "top",
              style: { fontSize: 10, fill: "var(--color-text-muted)" },
            }}
          />
          <Bar dataKey="utilization" name="Utilization" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getUtilColor(entry.utilization)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
