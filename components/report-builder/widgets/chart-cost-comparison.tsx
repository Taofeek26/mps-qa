"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, TOOLTIP_STYLE, CHART_COLORS } from "@/components/charts";
import { computeMonthlyCost } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartCostComparison({ shipments }: { shipments: Shipment[] }) {
  const data = computeMonthlyCost(shipments);

  return (
    <ChartContainer title="Revenue vs Cost" subtitle="Monthly comparison — customer revenue vs MPS cost" chartClassName="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
          <Bar dataKey="cost" name="MPS Cost" fill={CHART_COLORS.error} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
