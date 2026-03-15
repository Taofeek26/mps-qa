"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, TOOLTIP_STYLE, CATEGORY_COLORS } from "@/components/charts";
import { computeCsatTrend } from "@/lib/report-builder-data";

export function ChartCsatTrend() {
  const data = computeCsatTrend();

  return (
    <ChartContainer title="CSAT & NPS Trend" subtitle="Monthly customer satisfaction and net promoter score">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis
            yAxisId="left"
            width={40}
            domain={[0, 5]}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickFormatter={(v) => v.toFixed(1)}
            label={{
              value: "CSAT",
              angle: -90,
              position: "insideTopLeft",
              offset: 4,
              style: { fontSize: 11, fill: "var(--color-text-muted)" },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            width={50}
            domain={[-100, 100]}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            label={{
              value: "NPS",
              angle: 90,
              position: "insideTopRight",
              offset: 4,
              style: { fontSize: 11, fill: "var(--color-text-muted)" },
            }}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value, name) => {
              if (name === "CSAT") return [Number(value).toFixed(1), "CSAT"];
              return [Number(value).toFixed(0), "NPS"];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="csat"
            name="CSAT"
            stroke={CATEGORY_COLORS[0]}
            strokeWidth={2}
            dot={{ r: 3, fill: CATEGORY_COLORS[0] }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="nps"
            name="NPS"
            stroke={CATEGORY_COLORS[2]}
            strokeWidth={2}
            dot={{ r: 3, fill: CATEGORY_COLORS[2] }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
