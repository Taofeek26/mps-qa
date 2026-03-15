"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer, TOOLTIP_STYLE } from "@/components/charts";
import { computeIncidentTrend } from "@/lib/report-builder-data";

export function ChartIncidentTrend() {
  const data = computeIncidentTrend();

  return (
    <ChartContainer title="Incident Trend" subtitle="Monthly safety incidents">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-error-500)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-error-500)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis
            width={40}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            allowDecimals={false}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [Number(value), "Incidents"]}
          />
          <Area
            type="monotone"
            dataKey="incidents"
            name="Incidents"
            stroke="var(--color-error-500)"
            strokeWidth={2}
            fill="url(#incidentGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
