"use client";

import { DollarSign, TrendingUp, Percent, BarChart3 } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeCostKpis, isKpiVisible } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";
import { cn } from "@/lib/utils";

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

export function KpiCostSummary({ shipments, config }: { shipments: Shipment[]; config?: SectionConfig }) {
  const { mpsCostTotal, custCostTotal, margin, marginPct, costPerTon } = computeCostKpis(shipments);
  const vis = config?.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-cost-summary");

  const cards = [
    show("revenue") && <KpiCard key="revenue" title="Revenue" value={fmt(custCostTotal)} subtitle="Customer billed" icon={DollarSign} />,
    show("mpsCost") && <KpiCard key="mpsCost" title="MPS Cost" value={fmt(mpsCostTotal)} subtitle="Platform cost" icon={TrendingUp} variant="error" />,
    show("margin") && <KpiCard key="margin" title="Margin" value={fmt(margin)} subtitle={`${marginPct.toFixed(1)}% margin`} icon={Percent} variant="success" />,
    show("costPerTon") && <KpiCard key="costPerTon" title="Cost / Ton" value={fmt(costPerTon)} subtitle="Blended CPT" icon={BarChart3} />,
  ].filter(Boolean);

  if (cards.length === 0) return null;

  return (
    <div className={cn(
      "grid gap-3",
      cards.length === 1 ? "grid-cols-1" : cards.length === 2 ? "grid-cols-2" : cards.length === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4"
    )}>
      {cards}
    </div>
  );
}
