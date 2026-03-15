"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { ChartContainer, TOOLTIP_STYLE } from "@/components/charts";
import { computeGhgEmissions } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartGhgEmissions({ shipments }: { shipments: Shipment[] }) {
  const data = computeGhgEmissions(shipments);

  return (
    <ChartContainer title="GHG Emissions" subtitle="Estimated CO2 by waste category (tons) — negative = offsets">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis
            width={60}
            tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            tickFormatter={(v) => `${v} t`}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value) => [`${Number(value).toLocaleString()} tons CO2`, "Emissions"]}
          />
          <Bar dataKey="co2" name="CO2 (tons)" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.co2 < 0 ? "var(--color-teal-400)" : "var(--color-error-500)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
