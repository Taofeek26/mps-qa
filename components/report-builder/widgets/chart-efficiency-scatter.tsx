"use client";

import { ChartContainer, ScatterQuadrant } from "@/components/charts";
import { computeEfficiencyScatter } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function ChartEfficiencyScatter({ shipments }: { shipments: Shipment[] }) {
  const data = computeEfficiencyScatter(shipments);

  return (
    <ChartContainer title="Load Efficiency" subtitle="Actual weight vs target weight (lbs)" chartClassName="h-[300px]">
      <ScatterQuadrant
        data={data}
        xLabel="Actual Weight (lbs)"
        yLabel="Target Weight (lbs)"
        showDiagonal
        xFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
        yFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
        tooltipFormatter={(p) => `${p.label}\nActual: ${p.x.toLocaleString()} lbs\nTarget: ${p.y.toLocaleString()} lbs`}
      />
    </ChartContainer>
  );
}
