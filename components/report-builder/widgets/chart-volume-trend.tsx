"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer, TOOLTIP_STYLE, CHART_COLORS } from "@/components/charts";
import { computeMonthlyVolume } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartVolumeTrend({ shipments }: { shipments: Shipment[] }) {
  const data = computeMonthlyVolume(shipments);

  return (
    <ChartContainer title="Monthly Volume Trend" subtitle="Tonnage by month" chartClassName="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toLocaleString()} tons`, "Volume"]} />
          <Bar dataKey="tons" name="Tons" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
