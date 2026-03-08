"use client";

import { ShieldCheck, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { computeComplianceKpis } from "@/lib/report-builder-data";
import type { Shipment } from "@/lib/types";

export function KpiCompliance({ shipments }: { shipments: Shipment[] }) {
  const { manifestCoverage, hazPct, completionRate, totalShipments } = computeComplianceKpis(shipments);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard title="Manifest Coverage" value={`${manifestCoverage.toFixed(1)}%`} subtitle={`${totalShipments} shipments`} icon={FileText} variant={manifestCoverage >= 90 ? "success" : "warning"} />
      <KpiCard title="Hazardous %" value={`${hazPct.toFixed(1)}%`} subtitle="Of total shipments" icon={AlertTriangle} variant={hazPct > 30 ? "error" : "default"} />
      <KpiCard title="Completion Rate" value={`${completionRate.toFixed(1)}%`} subtitle="Shipments completed" icon={CheckCircle} variant="success" />
      <KpiCard title="Compliance Score" value={manifestCoverage >= 95 ? "A" : manifestCoverage >= 80 ? "B" : "C"} subtitle="Based on coverage" icon={ShieldCheck} variant={manifestCoverage >= 95 ? "success" : "warning"} />
    </div>
  );
}
