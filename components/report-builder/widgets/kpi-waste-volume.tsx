"use client";

import { Package, Truck, Container, Weight } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeWasteVolumeKpis, isKpiVisible } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";
import { cn } from "@/lib/utils";

function fmtTons(v: number): string {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return v.toFixed(0);
}

export function KpiWasteVolume({ shipments, config }: { shipments: Shipment[]; config?: SectionConfig }) {
  const { totalTons, totalShipments, avgLoadLbs, containerUtilPct } = computeWasteVolumeKpis(shipments);
  const vis = config?.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-waste-volume");

  const cards = [
    show("totalTons") && <KpiCard key="totalTons" title="Total Tons" value={`${fmtTons(totalTons)} t`} subtitle="Standardized weight" icon={Package} />,
    show("totalShipments") && <KpiCard key="totalShipments" title="Shipments" value={totalShipments.toLocaleString()} subtitle="All manifests" icon={Truck} variant="success" />,
    show("containerUtil") && <KpiCard key="containerUtil" title="Container Util" value={`${containerUtilPct.toFixed(1)}%`} subtitle="Avg fill rate" icon={Container} variant="warning" />,
    show("avgLoad") && <KpiCard key="avgLoad" title="Avg Load" value={`${avgLoadLbs.toLocaleString()} lbs`} subtitle="Per shipment" icon={Weight} />,
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
