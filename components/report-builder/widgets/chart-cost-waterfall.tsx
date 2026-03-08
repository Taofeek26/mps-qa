"use client";

import { ChartContainer, WaterfallChart } from "@/components/charts";
import { computeCostWaterfall } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartCostWaterfall({ shipments }: { shipments: Shipment[] }) {
  const data = computeCostWaterfall(shipments);

  return (
    <ChartContainer title="Margin Waterfall" subtitle="Revenue to net margin flow">
      <WaterfallChart data={data} valueFormatter={(v) => `$${Math.abs(v).toLocaleString()}`} />
    </ChartContainer>
  );
}
