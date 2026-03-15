"use client";

import { HardHat, ShieldAlert, CheckCircle2 } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeSafetyKpis, isKpiVisible } from "@/lib/report-builder-data";
import type { SectionConfig } from "@/lib/report-builder-types";
import { cn } from "@/lib/utils";

export function KpiSafety({ config }: { config?: SectionConfig }) {
  const { trir, totalIncidents, resolvedPct, trainingPct } = computeSafetyKpis();
  const vis = config?.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-safety");

  const cards = [
    show("trir") && <KpiCard key="trir" title="TRIR" value={trir.toFixed(2)} subtitle="Total Recordable Rate" icon={HardHat} variant={trir < 2 ? "success" : trir < 4 ? "warning" : "error"} />,
    show("incidents") && <KpiCard key="incidents" title="Incidents" value={totalIncidents.toLocaleString()} subtitle="Total in period" icon={ShieldAlert} />,
    show("resolvedPct") && <KpiCard key="resolvedPct" title="Resolved %" value={`${resolvedPct}%`} subtitle="Incidents resolved" icon={CheckCircle2} variant="success" />,
    show("trainingPct") && <KpiCard key="trainingPct" title="Training %" value={`${trainingPct}%`} subtitle="Completion rate" icon={HardHat} variant="success" />,
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
