"use client";

import { ChartContainer, DonutChart } from "@/components/charts";
import { computeVendorSpend } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartVendorSpend({ shipments }: { shipments: Shipment[] }) {
  const data = computeVendorSpend(shipments);

  return (
    <ChartContainer title="Vendor Spend Distribution" subtitle="MPS cost by vendor (top 8)" chartClassName="h-[280px]">
      <DonutChart data={data} valueFormatter={(v) => `$${v.toLocaleString()}`} />
    </ChartContainer>
  );
}
