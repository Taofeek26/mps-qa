"use client";

import { ShieldCheck, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeComplianceKpis, isKpiVisible } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";
import { cn } from "@/lib/utils";

export function KpiCompliance({ shipments, config }: { shipments: Shipment[]; config?: SectionConfig }) {
  const { manifestCoverage, hazPct, completionRate, totalShipments } = computeComplianceKpis(shipments);
  const vis = config?.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-compliance");

  const cards = [
    show("manifestCoverage") && <KpiCard key="manifestCoverage" title="Manifest Coverage" value={`${manifestCoverage.toFixed(1)}%`} subtitle={`${totalShipments} shipments`} icon={FileText} variant={manifestCoverage >= 90 ? "success" : "warning"} />,
    show("hazPct") && <KpiCard key="hazPct" title="Hazardous %" value={`${hazPct.toFixed(1)}%`} subtitle="Of total shipments" icon={AlertTriangle} variant={hazPct > 30 ? "error" : "default"} />,
    show("completionRate") && <KpiCard key="completionRate" title="Completion Rate" value={`${completionRate.toFixed(1)}%`} subtitle="Shipments completed" icon={CheckCircle} variant="success" />,
    show("complianceScore") && <KpiCard key="complianceScore" title="Compliance Score" value={manifestCoverage >= 95 ? "A" : manifestCoverage >= 80 ? "B" : "C"} subtitle="Based on coverage" icon={ShieldCheck} variant={manifestCoverage >= 95 ? "success" : "warning"} />,
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
