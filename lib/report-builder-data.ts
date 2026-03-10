/* ============================================
   MPS Platform — Report Builder Data Resolvers
   Compute widget data from filtered shipments
   ============================================ */

import type { Shipment } from "./types";
import type { SectionType } from "./report-builder-types";
import { totalMpsCost, totalCustomerCost, getMonthKey, formatMonthLabel } from "./report-utils";

/* ─── KPI Definitions ─── */

export interface KpiDefinition {
  key: string;
  label: string;
  description: string;
}

/** Per-block KPI definitions — keys match what each widget uses internally */
export const KPI_DEFINITIONS: Record<string, KpiDefinition[]> = {
  "kpi-waste-volume": [
    { key: "totalTons", label: "Total Tons", description: "Standardized weight in tons" },
    { key: "totalShipments", label: "Shipments", description: "Total manifest count" },
    { key: "containerUtil", label: "Container Util", description: "Average container fill rate" },
    { key: "avgLoad", label: "Avg Load", description: "Average load per shipment" },
  ],
  "kpi-cost-summary": [
    { key: "revenue", label: "Revenue", description: "Customer billed amount" },
    { key: "mpsCost", label: "MPS Cost", description: "Total platform cost" },
    { key: "margin", label: "Margin", description: "Revenue minus cost" },
    { key: "costPerTon", label: "Cost / Ton", description: "Blended cost per ton" },
  ],
  "kpi-compliance": [
    { key: "manifestCoverage", label: "Manifest Coverage", description: "Percentage with manifest" },
    { key: "hazPct", label: "Hazardous %", description: "Hazardous waste percentage" },
    { key: "completionRate", label: "Completion Rate", description: "Submitted shipments" },
    { key: "complianceScore", label: "Compliance Score", description: "Letter grade based on coverage" },
  ],
  "kpi-diversion": [
    { key: "diversionRate", label: "Diversion Rate", description: "Recycled or reused percentage" },
    { key: "recyclingTons", label: "Recycling", description: "Tons diverted from landfill" },
    { key: "landfillTons", label: "Landfill", description: "Tons sent to landfill" },
    { key: "totalVolume", label: "Total Volume", description: "All treatment methods" },
  ],
};

/** Get all KPI keys for a section type (returns empty array for non-KPI types) */
export function getKpiKeys(sectionType: SectionType): string[] {
  return (KPI_DEFINITIONS[sectionType] ?? []).map((d) => d.key);
}

/** Check if a KPI key should be visible given config */
export function isKpiVisible(key: string, visibleKpis: string[] | undefined, sectionType: SectionType): boolean {
  if (!visibleKpis || visibleKpis.length === 0) return true; // undefined = show all
  return visibleKpis.includes(key);
}

/* ─── KPI: Waste Volume ─── */

export function computeWasteVolumeKpis(shipments: Shipment[]) {
  const totalTons = shipments.reduce((sum, s) => sum + s.weightValue, 0) / 2000;
  const totalShipments = shipments.length;
  const avgLoadLbs = totalShipments > 0 ? Math.round((totalTons * 2000) / totalShipments) : 0;

  let actualTotal = 0;
  let targetTotal = 0;
  shipments.forEach((s) => {
    if (!s.containerType || !s.targetLoadWeight) return;
    actualTotal += s.weightValue;
    targetTotal += s.targetLoadWeight;
  });
  const containerUtilPct = targetTotal > 0 ? (actualTotal / targetTotal) * 100 : 0;

  return { totalTons, totalShipments, avgLoadLbs, containerUtilPct };
}

/* ─── KPI: Cost Summary ─── */

export function computeCostKpis(shipments: Shipment[]) {
  let mpsCostTotal = 0;
  let custCostTotal = 0;
  let totalVolume = 0;
  shipments.forEach((s) => {
    mpsCostTotal += totalMpsCost(s);
    custCostTotal += totalCustomerCost(s);
    totalVolume += s.weightValue;
  });
  const margin = custCostTotal - mpsCostTotal;
  const marginPct = custCostTotal > 0 ? (margin / custCostTotal) * 100 : 0;
  const costPerTon = totalVolume > 0 ? mpsCostTotal / (totalVolume / 2000) : 0;

  return { mpsCostTotal, custCostTotal, margin, marginPct, costPerTon };
}

/* ─── KPI: Compliance ─── */

export function computeComplianceKpis(shipments: Shipment[]) {
  const withManifest = shipments.filter((s) => s.manifestNumber).length;
  const manifestCoverage = shipments.length > 0 ? (withManifest / shipments.length) * 100 : 0;

  const hazardous = shipments.filter((s) => s.wasteCategory === "Hazardous Waste").length;
  const hazPct = shipments.length > 0 ? (hazardous / shipments.length) * 100 : 0;

  const completed = shipments.filter((s) => s.status === "submitted").length;
  const completionRate = shipments.length > 0 ? (completed / shipments.length) * 100 : 0;

  return { manifestCoverage, hazPct, completionRate, totalShipments: shipments.length };
}

/* ─── KPI: Diversion ─── */

export function computeDiversionKpis(shipments: Shipment[]) {
  let recyclingTons = 0;
  let landfillTons = 0;
  let totalTons = 0;
  shipments.forEach((s) => {
    const tons = s.weightValue / 2000;
    totalTons += tons;
    const method = (s.treatmentMethod ?? "").toLowerCase();
    if (method.includes("recycl") || method.includes("reuse") || method.includes("recovery")) {
      recyclingTons += tons;
    } else if (method.includes("landfill")) {
      landfillTons += tons;
    }
  });
  const diversionRate = totalTons > 0 ? (recyclingTons / totalTons) * 100 : 0;

  return { diversionRate, recyclingTons, landfillTons, totalTons };
}

/* ─── Chart: Monthly Volume Trend ─── */

export function computeMonthlyVolume(shipments: Shipment[]) {
  const byMonth = new Map<string, number>();
  shipments.forEach((s) => {
    const key = getMonthKey(s.shipmentDate);
    byMonth.set(key, (byMonth.get(key) ?? 0) + s.weightValue / 2000);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, tons]) => ({ month: formatMonthLabel(key), tons: Math.round(tons * 10) / 10 }));
}

/* ─── Chart: Cost Comparison (Revenue vs Cost by month) ─── */

export function computeMonthlyCost(shipments: Shipment[]) {
  const byMonth = new Map<string, { rev: number; cost: number }>();
  shipments.forEach((s) => {
    const key = getMonthKey(s.shipmentDate);
    const existing = byMonth.get(key) ?? { rev: 0, cost: 0 };
    existing.rev += totalCustomerCost(s);
    existing.cost += totalMpsCost(s);
    byMonth.set(key, existing);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, d]) => ({
      month: formatMonthLabel(key),
      revenue: Math.round(d.rev),
      cost: Math.round(d.cost),
    }));
}

/* ─── Chart: Waste Category Donut ─── */

export function computeWasteCategoryDonut(shipments: Shipment[]) {
  const byCategory = new Map<string, number>();
  shipments.forEach((s) => {
    const cat = s.wasteCategory ?? "Unknown";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + s.weightValue / 2000);
  });
  return Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
}

/* ─── Chart: Top Waste Streams (ProgressList) ─── */

export function computeTopStreams(shipments: Shipment[]) {
  const byType = new Map<string, { tons: number; count: number }>();
  shipments.forEach((s) => {
    const existing = byType.get(s.wasteTypeName) ?? { tons: 0, count: 0 };
    existing.tons += s.weightValue / 2000;
    existing.count += 1;
    byType.set(s.wasteTypeName, existing);
  });
  return Array.from(byType.entries())
    .map(([name, d]) => ({ name, tons: Math.round(d.tons), count: d.count }))
    .sort((a, b) => b.tons - a.tons)
    .slice(0, 10);
}

/* ─── Chart: Cost Waterfall ─── */

export function computeCostWaterfall(shipments: Shipment[]) {
  let custTotal = 0;
  let haul = 0;
  let disposal = 0;
  let fuel = 0;
  let env = 0;
  let rebate = 0;
  shipments.forEach((s) => {
    custTotal += totalCustomerCost(s);
    if (s.mpsCost) {
      haul += s.mpsCost.haulCharge;
      disposal += s.mpsCost.disposalFeeTotal;
      fuel += s.mpsCost.fuelFee;
      env += s.mpsCost.environmentalFee;
    }
    rebate += s.customerCost?.rebate ?? 0;
  });
  return [
    { name: "Revenue", value: Math.round(custTotal) },
    { name: "Haul", value: -Math.round(haul) },
    { name: "Disposal", value: -Math.round(disposal) },
    { name: "Fuel", value: -Math.round(fuel) },
    { name: "Env Fees", value: -Math.round(env) },
    { name: "Rebates", value: Math.round(rebate) },
    { name: "Net Margin", value: 0, isTotal: true as const },
  ];
}

/* ─── Chart: Vendor Spend Donut ─── */

export function computeVendorSpend(shipments: Shipment[]) {
  const byVendor = new Map<string, number>();
  shipments.forEach((s) => {
    const vendor = s.vendorName ?? "Unknown";
    byVendor.set(vendor, (byVendor.get(vendor) ?? 0) + totalMpsCost(s));
  });
  return Array.from(byVendor.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

/* ─── Table: Waste Stream Summary ─── */

export function computeWasteStreamSummary(shipments: Shipment[]) {
  const byType = new Map<string, { tons: number; count: number; cost: number; revenue: number }>();
  shipments.forEach((s) => {
    const existing = byType.get(s.wasteTypeName) ?? { tons: 0, count: 0, cost: 0, revenue: 0 };
    existing.tons += s.weightValue / 2000;
    existing.count += 1;
    existing.cost += totalMpsCost(s);
    existing.revenue += totalCustomerCost(s);
    byType.set(s.wasteTypeName, existing);
  });
  return Array.from(byType.entries())
    .map(([name, d]) => ({
      name,
      tons: Math.round(d.tons),
      shipments: d.count,
      cost: Math.round(d.cost),
      revenue: Math.round(d.revenue),
      margin: Math.round(d.revenue - d.cost),
    }))
    .sort((a, b) => b.tons - a.tons);
}

/* ─── Table: Cost by Site ─── */

export function computeCostBySite(shipments: Shipment[]) {
  const bySite = new Map<string, { cost: number; revenue: number; tons: number; count: number }>();
  shipments.forEach((s) => {
    const existing = bySite.get(s.siteName) ?? { cost: 0, revenue: 0, tons: 0, count: 0 };
    existing.cost += totalMpsCost(s);
    existing.revenue += totalCustomerCost(s);
    existing.tons += s.weightValue / 2000;
    existing.count += 1;
    bySite.set(s.siteName, existing);
  });
  return Array.from(bySite.entries())
    .map(([site, d]) => ({
      site,
      cost: Math.round(d.cost),
      revenue: Math.round(d.revenue),
      margin: Math.round(d.revenue - d.cost),
      tons: Math.round(d.tons),
      shipments: d.count,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
