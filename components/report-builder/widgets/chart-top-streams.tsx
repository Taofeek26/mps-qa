"use client";

import { ChartContainer, ProgressList } from "@/components/charts";
import { computeTopStreams } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartTopStreams({ shipments }: { shipments: Shipment[] }) {
  const data = computeTopStreams(shipments);

  const items = data.map((s) => ({
    label: s.name,
    value: s.tons,
    displayValue: `${s.tons.toLocaleString()} tons \u00b7 ${s.count} shipments`,
    color: "var(--color-primary-400)",
  }));

  return (
    <ChartContainer title="Top Waste Streams" subtitle="Top 10 by volume (tons)" chartClassName="max-h-[320px] overflow-y-auto">
      <ProgressList items={items} maxItems={10} className="px-1 py-2" />
    </ChartContainer>
  );
}
