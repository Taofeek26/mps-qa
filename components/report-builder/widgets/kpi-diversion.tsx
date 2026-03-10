"use client";

import { Recycle, Trash2, Leaf, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeDiversionKpis, isKpiVisible } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";
import { cn } from "@/lib/utils";

function fmtTons(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(0);
}

export function KpiDiversion({ shipments, config }: { shipments: Shipment[]; config?: SectionConfig }) {
  const { diversionRate, recyclingTons, landfillTons, totalTons } = computeDiversionKpis(shipments);
  const vis = config?.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-diversion");

  const cards = [
    show("diversionRate") && <KpiCard key="diversionRate" title="Diversion Rate" value={`${diversionRate.toFixed(1)}%`} subtitle="Recycled / reused" icon={Leaf} variant={diversionRate >= 50 ? "success" : "warning"} />,
    show("recyclingTons") && <KpiCard key="recyclingTons" title="Recycling" value={`${fmtTons(recyclingTons)} t`} subtitle="Diverted from landfill" icon={Recycle} variant="success" />,
    show("landfillTons") && <KpiCard key="landfillTons" title="Landfill" value={`${fmtTons(landfillTons)} t`} subtitle="Sent to landfill" icon={Trash2} variant="error" />,
    show("totalVolume") && <KpiCard key="totalVolume" title="Total Volume" value={`${fmtTons(totalTons)} t`} subtitle="All treatment methods" icon={TrendingUp} />,
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
