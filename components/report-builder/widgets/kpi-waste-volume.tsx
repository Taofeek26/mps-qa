"use client";

import { Package, Truck, Container, Weight } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeWasteVolumeKpis } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

function fmtTons(v: number): string {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return v.toFixed(0);
}

export function KpiWasteVolume({ shipments }: { shipments: Shipment[] }) {
  const { totalTons, totalShipments, avgLoadLbs, containerUtilPct } = computeWasteVolumeKpis(shipments);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard title="Total Tons" value={`${fmtTons(totalTons)} t`} subtitle="Standardized weight" icon={Package} />
      <KpiCard title="Shipments" value={totalShipments.toLocaleString()} subtitle="All manifests" icon={Truck} variant="success" />
      <KpiCard title="Container Util" value={`${containerUtilPct.toFixed(1)}%`} subtitle="Avg fill rate" icon={Container} variant="warning" />
      <KpiCard title="Avg Load" value={`${avgLoadLbs.toLocaleString()} lbs`} subtitle="Per shipment" icon={Weight} />
    </div>
  );
}
