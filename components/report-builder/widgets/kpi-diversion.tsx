"use client";

import { Recycle, Trash2, Leaf, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeDiversionKpis } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

function fmtTons(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toFixed(0);
}

export function KpiDiversion({ shipments }: { shipments: Shipment[] }) {
  const { diversionRate, recyclingTons, landfillTons, totalTons } = computeDiversionKpis(shipments);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard title="Diversion Rate" value={`${diversionRate.toFixed(1)}%`} subtitle="Recycled / reused" icon={Leaf} variant={diversionRate >= 50 ? "success" : "warning"} />
      <KpiCard title="Recycling" value={`${fmtTons(recyclingTons)} t`} subtitle="Diverted from landfill" icon={Recycle} variant="success" />
      <KpiCard title="Landfill" value={`${fmtTons(landfillTons)} t`} subtitle="Sent to landfill" icon={Trash2} variant="error" />
      <KpiCard title="Total Volume" value={`${fmtTons(totalTons)} t`} subtitle="All treatment methods" icon={TrendingUp} />
    </div>
  );
}
