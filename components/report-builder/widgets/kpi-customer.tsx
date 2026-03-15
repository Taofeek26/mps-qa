"use client";

import { Heart, ThumbsUp, MessageCircle } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeCustomerKpis, isKpiVisible } from "@/lib/report-builder-data";
import type { SectionConfig } from "@/lib/report-builder-types";
import { cn } from "@/lib/utils";

export function KpiCustomer({ config }: { config?: SectionConfig }) {
  const { avgCsat, nps, fcrPct } = computeCustomerKpis();
  const vis = config?.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-customer");

  const cards = [
    show("csat") && <KpiCard key="csat" title="CSAT" value={`${avgCsat}/5`} subtitle="Customer satisfaction" icon={Heart} variant={avgCsat >= 4 ? "success" : avgCsat >= 3 ? "warning" : "error"} />,
    show("nps") && <KpiCard key="nps" title="NPS" value={nps.toString()} subtitle="Net Promoter Score" icon={ThumbsUp} variant={nps >= 50 ? "success" : nps >= 0 ? "warning" : "error"} />,
    show("fcr") && <KpiCard key="fcr" title="FCR" value={`${fcrPct}%`} subtitle="First contact resolution" icon={MessageCircle} variant={fcrPct >= 80 ? "success" : "warning"} />,
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
