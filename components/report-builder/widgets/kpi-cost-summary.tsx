"use client";

import { DollarSign, TrendingUp, Percent, BarChart3 } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeCostKpis } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

export function KpiCostSummary({ shipments }: { shipments: Shipment[] }) {
  const { mpsCostTotal, custCostTotal, margin, marginPct, costPerTon } = computeCostKpis(shipments);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard title="Revenue" value={fmt(custCostTotal)} subtitle="Customer billed" icon={DollarSign} />
      <KpiCard title="MPS Cost" value={fmt(mpsCostTotal)} subtitle="Platform cost" icon={TrendingUp} variant="error" />
      <KpiCard title="Margin" value={fmt(margin)} subtitle={`${marginPct.toFixed(1)}% margin`} icon={Percent} variant="success" />
      <KpiCard title="Cost / Ton" value={fmt(costPerTon)} subtitle="Blended CPT" icon={BarChart3} />
    </div>
  );
}
