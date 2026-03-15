"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { ChartContainer, TOOLTIP_STYLE } from "@/components/charts";
import { computeArAging } from "@/lib/report-builder-data";

const BUCKET_COLORS: Record<string, string> = {
  "0-30": "var(--color-success-500)",
  "31-60": "var(--color-warning-500)",
  "61-90": "var(--color-error-500)",
  "90+": "var(--color-error-700, var(--color-error-500))",
};

export function ChartArAging() {
  const data = computeArAging();

  return (
    <ChartContainer title="AR Aging" subtitle="Outstanding invoice amounts by days overdue">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis
            dataKey="bucket"
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          />
          <YAxis
            width={70}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, "Outstanding"]}
          />
          <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BUCKET_COLORS[entry.bucket] ?? "var(--color-text-muted)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
