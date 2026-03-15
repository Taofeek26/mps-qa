"use client";

import { Users, MousePointerClick, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computePlatformKpis, isKpiVisible } from "@/lib/report-builder-data";
import type { SectionConfig } from "@/lib/report-builder-types";
import { cn } from "@/lib/utils";

export function KpiPlatform({ config }: { config?: SectionConfig }) {
  const { monthlyActive, entriesPerUser, adoptionRate } = computePlatformKpis();
  const vis = config?.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-platform");

  const cards = [
    show("monthlyActive") && <KpiCard key="monthlyActive" title="Monthly Active" value={monthlyActive.toLocaleString()} subtitle="Active users" icon={Users} />,
    show("entriesPerUser") && <KpiCard key="entriesPerUser" title="Entries/User" value={entriesPerUser.toLocaleString()} subtitle="Avg shipments created" icon={MousePointerClick} />,
    show("adoptionRate") && <KpiCard key="adoptionRate" title="Adoption Rate" value={`${adoptionRate}%`} subtitle="Platform adoption" icon={TrendingUp} variant={adoptionRate >= 80 ? "success" : "warning"} />,
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
