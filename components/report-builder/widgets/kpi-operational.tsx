"use client";

import { Building2, MapPin, Target } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeOperationalKpis, isKpiVisible } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";
import { cn } from "@/lib/utils";

export function KpiOperational({ shipments, config }: { shipments: Shipment[]; config?: SectionConfig }) {
  const { activeSites, avgMiles, targetVsActualPct } = computeOperationalKpis(shipments);
  const vis = config?.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-operational");

  const cards = [
    show("activeSites") && <KpiCard key="activeSites" title="Active Sites" value={activeSites.toLocaleString()} subtitle="Sites with shipments" icon={Building2} />,
    show("avgMiles") && <KpiCard key="avgMiles" title="Avg Miles" value={`${avgMiles} mi`} subtitle="Per shipment" icon={MapPin} />,
    show("targetVsActual") && <KpiCard key="targetVsActual" title="Target vs Actual" value={`${targetVsActualPct}%`} subtitle="Load accuracy" icon={Target} variant={targetVsActualPct >= 90 ? "success" : targetVsActualPct >= 75 ? "warning" : "error"} />,
  ].filter(Boolean);

  if (cards.length === 0) return null;

  return (
    <div className={cn(
      "grid gap-3",
      cards.length === 1 ? "grid-cols-1" : cards.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
    )}>
      {cards}
    </div>
  );
}
