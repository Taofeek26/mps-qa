"use client";

import { ChartContainer, DonutChart } from "@/components/charts";
import { computeWasteCategoryDonut } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartWasteDonut({ shipments }: { shipments: Shipment[] }) {
  const data = computeWasteCategoryDonut(shipments);

  return (
    <ChartContainer title="Waste Distribution" subtitle="Volume by waste category (tons)" chartClassName="h-[280px]">
      <DonutChart data={data} valueFormatter={(v) => `${v.toLocaleString()} tons`} />
    </ChartContainer>
  );
}
