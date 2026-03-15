"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer, TOOLTIP_STYLE } from "@/components/charts";
import { computeDiversionTrend } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartDiversionTrend({ shipments }: { shipments: Shipment[] }) {
  const data = computeDiversionTrend(shipments);

  return (
    <ChartContainer title="Diversion Trend" subtitle="Monthly landfill diversion rate">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="diversionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-teal-400)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-teal-400)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis
            width={50}
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Diversion Rate"]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            name="Diversion Rate"
            stroke="var(--color-teal-400)"
            strokeWidth={2}
            fill="url(#diversionGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
