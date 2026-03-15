/* ============================================
   MPS Platform — Report Builder Data Resolvers
   Compute widget data from filtered shipments
   ============================================ */

import type { Shipment } from "./types";
import type { SectionType } from "./report-builder-types";
import { totalMpsCost, totalCustomerCost, getMonthKey, formatMonthLabel, loadEfficiency } from "./report-utils";
import { getSafetyIncidents, SAFETY_TRAINING_DATA, getPlatformUserActivity, getCustomerSurveys, getInvoiceRecords, getFacilityCapacities } from "./mock-kpi-data";
import { getVendors } from "./mock-data";

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
  "kpi-operational": [
    { key: "activeSites", label: "Active Sites", description: "Sites with shipments in period" },
    { key: "avgMiles", label: "Avg Miles", description: "Average haul distance per shipment" },
    { key: "targetVsActual", label: "Target vs Actual", description: "Load weight accuracy percentage" },
  ],
  "kpi-safety": [
    { key: "trir", label: "TRIR", description: "Total Recordable Incident Rate" },
    { key: "incidents", label: "Incidents", description: "Total incidents in period" },
    { key: "resolvedPct", label: "Resolved %", description: "Percentage of incidents resolved" },
    { key: "trainingPct", label: "Training %", description: "Training completion rate" },
  ],
  "kpi-platform": [
    { key: "monthlyActive", label: "Monthly Active", description: "Monthly active users" },
    { key: "entriesPerUser", label: "Entries/User", description: "Average entries per user" },
    { key: "adoptionRate", label: "Adoption Rate", description: "Platform adoption percentage" },
  ],
  "kpi-customer": [
    { key: "csat", label: "CSAT", description: "Customer satisfaction score" },
    { key: "nps", label: "NPS", description: "Net Promoter Score" },
    { key: "fcr", label: "FCR", description: "First contact resolution rate" },
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

/* ─── Chart: Cost Composition (stacked area by cost category) ─── */

export function computeCostComposition(shipments: Shipment[]) {
  const byMonth = new Map<string, { haul: number; disposal: number; fuel: number; environmental: number; other: number }>();
  shipments.forEach((s) => {
    const key = getMonthKey(s.shipmentDate);
    const existing = byMonth.get(key) ?? { haul: 0, disposal: 0, fuel: 0, environmental: 0, other: 0 };
    if (s.mpsCost) {
      existing.haul += s.mpsCost.haulCharge;
      existing.disposal += s.mpsCost.disposalFeeTotal;
      existing.fuel += s.mpsCost.fuelFee;
      existing.environmental += s.mpsCost.environmentalFee;
      const knownCosts = s.mpsCost.haulCharge + s.mpsCost.disposalFeeTotal + s.mpsCost.fuelFee + s.mpsCost.environmentalFee;
      const total = totalMpsCost(s);
      existing.other += Math.max(0, total - knownCosts);
    }
    byMonth.set(key, existing);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, d]) => ({
      month: formatMonthLabel(key),
      Haul: Math.round(d.haul),
      Disposal: Math.round(d.disposal),
      Fuel: Math.round(d.fuel),
      Environmental: Math.round(d.environmental),
      Other: Math.round(d.other),
    }));
}

/* ─── Chart: Margin Heatmap (site x waste type) ─── */

export function computeMarginHeatmap(shipments: Shipment[]) {
  const sites = new Set<string>();
  const wasteTypes = new Set<string>();
  const marginMap = new Map<string, { revenue: number; cost: number }>();

  shipments.forEach((s) => {
    sites.add(s.siteName);
    wasteTypes.add(s.wasteTypeName);
    const cellKey = `${s.siteName}|${s.wasteTypeName}`;
    const existing = marginMap.get(cellKey) ?? { revenue: 0, cost: 0 };
    existing.revenue += totalCustomerCost(s);
    existing.cost += totalMpsCost(s);
    marginMap.set(cellKey, existing);
  });

  const siteList = Array.from(sites).sort();
  const wasteTypeList = Array.from(wasteTypes).sort();

  const rows = siteList.map((site) => {
    const cells = wasteTypeList.map((wt) => {
      const cellKey = `${site}|${wt}`;
      const data = marginMap.get(cellKey);
      if (!data) return { wasteType: wt, margin: null as number | null };
      return { wasteType: wt, margin: Math.round(data.revenue - data.cost) };
    });
    return { site, cells };
  });

  return { wasteTypes: wasteTypeList, rows };
}

/* ─── Chart: GHG Emissions ─── */

export function computeGhgEmissions(shipments: Shipment[]) {
  const emissionFactors: Record<string, number> = {
    "Hazardous Waste": 0.45,
    "Non-Hazardous Waste": 0.15,
    "Universal Waste": 0.08,
    "Used Oil": -0.12,
    "Recyclable Materials": -0.25,
    Unknown: 0.10,
  };

  const byCategory = new Map<string, number>();
  shipments.forEach((s) => {
    const cat = s.wasteCategory ?? "Unknown";
    const tons = s.weightValue / 2000;
    const factor = emissionFactors[cat] ?? emissionFactors["Unknown"];
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + tons * factor);
  });

  return Array.from(byCategory.entries())
    .map(([name, co2]) => ({ name, co2: Math.round(co2 * 10) / 10 }))
    .sort((a, b) => b.co2 - a.co2);
}

/* ─── Chart: Diversion Trend ─── */

export function computeDiversionTrend(shipments: Shipment[]) {
  const byMonth = new Map<string, { diverted: number; total: number }>();
  shipments.forEach((s) => {
    const key = getMonthKey(s.shipmentDate);
    const tons = s.weightValue / 2000;
    const existing = byMonth.get(key) ?? { diverted: 0, total: 0 };
    existing.total += tons;
    const method = (s.treatmentMethod ?? "").toLowerCase();
    if (method.includes("recycl") || method.includes("reuse") || method.includes("recovery")) {
      existing.diverted += tons;
    }
    byMonth.set(key, existing);
  });

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, d]) => ({
      month: formatMonthLabel(key),
      rate: d.total > 0 ? Math.round((d.diverted / d.total) * 1000) / 10 : 0,
    }));
}

/* ─── Chart: Efficiency Scatter (actual vs target weight) ─── */

export function computeEfficiencyScatter(shipments: Shipment[]) {
  return shipments
    .filter((s) => s.targetLoadWeight && s.targetLoadWeight > 0)
    .map((s) => ({
      x: s.weightValue,
      y: s.targetLoadWeight!,
      label: `${s.wasteTypeName} — ${s.siteName}`,
      category: s.wasteCategory ?? "Unknown",
    }));
}

/* ─── Chart: Treemap (waste type volume) ─── */

export function computeTreemapData(shipments: Shipment[]) {
  const byType = new Map<string, number>();
  shipments.forEach((s) => {
    byType.set(s.wasteTypeName, (byType.get(s.wasteTypeName) ?? 0) + s.weightValue);
  });
  return Array.from(byType.entries())
    .map(([name, size]) => ({ name, size: Math.round(size) }))
    .sort((a, b) => b.size - a.size);
}

/* ─── Chart: Incident Trend ─── */

export function computeIncidentTrend() {
  const incidents = getSafetyIncidents();
  const byMonth = new Map<string, number>();
  incidents.forEach((inc) => {
    const key = getMonthKey(inc.date);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ month: formatMonthLabel(key), incidents: count }));
}

/* ─── Chart: CSAT & NPS Trend ─── */

export function computeCsatTrend() {
  const surveys = getCustomerSurveys();
  const byMonth = new Map<string, { csatSum: number; npsSum: number; count: number }>();
  surveys.forEach((s) => {
    const key = getMonthKey(s.date);
    const existing = byMonth.get(key) ?? { csatSum: 0, npsSum: 0, count: 0 };
    existing.csatSum += s.csat;
    existing.npsSum += s.nps;
    existing.count += 1;
    byMonth.set(key, existing);
  });
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, d]) => ({
      month: formatMonthLabel(key),
      csat: d.count > 0 ? Math.round((d.csatSum / d.count) * 10) / 10 : 0,
      nps: d.count > 0 ? Math.round(((d.npsSum / d.count - 5) / 5) * 100) : 0,
    }));
}

/* ─── Chart: AR Aging ─── */

export function computeArAging() {
  const invoices = getInvoiceRecords();
  const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  const today = new Date("2024-12-31");

  invoices.forEach((inv) => {
    if (inv.paidDate) return;
    const due = new Date(inv.dueDate + "T00:00:00");
    const daysOverdue = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
    if (daysOverdue <= 30) buckets["0-30"] += inv.amount;
    else if (daysOverdue <= 60) buckets["31-60"] += inv.amount;
    else if (daysOverdue <= 90) buckets["61-90"] += inv.amount;
    else buckets["90+"] += inv.amount;
  });

  return Object.entries(buckets).map(([bucket, amount]) => ({
    bucket,
    amount: Math.round(amount),
  }));
}

/* ─── Chart: Facility Utilization ─── */

export function computeFacilityUtilization() {
  const facilities = getFacilityCapacities();
  return facilities.map((f) => ({
    name: f.facilityName,
    utilization: f.monthlyCapacityTons > 0
      ? Math.round((f.monthlyProcessedTons / f.monthlyCapacityTons) * 1000) / 10
      : 0,
  })).sort((a, b) => b.utilization - a.utilization);
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

/* ─── KPI: Operational ─── */

export function computeOperationalKpis(shipments: Shipment[]) {
  const uniqueSites = new Set(shipments.map((s) => s.siteId));
  const activeSites = uniqueSites.size;

  const milesArray = shipments
    .map((s) => s.milesFromFacility)
    .filter((m): m is number => m != null && m > 0);
  const avgMiles = milesArray.length > 0
    ? Math.round(milesArray.reduce((sum, m) => sum + m, 0) / milesArray.length)
    : 0;

  let actualTotal = 0;
  let targetTotal = 0;
  shipments.forEach((s) => {
    const eff = loadEfficiency(s);
    if (eff != null) {
      actualTotal += s.weightValue;
      targetTotal += s.targetLoadWeight!;
    }
  });
  const targetVsActualPct = targetTotal > 0 ? Math.round((actualTotal / targetTotal) * 100) : 0;

  return { activeSites, avgMiles, targetVsActualPct };
}

/* ─── KPI: Safety ─── */

export function computeSafetyKpis() {
  const incidents = getSafetyIncidents();
  const totalIncidents = incidents.length;
  const resolved = incidents.filter((i) => i.resolved).length;
  const resolvedPct = totalIncidents > 0 ? Math.round((resolved / totalIncidents) * 100) : 0;

  // TRIR = (incidents * 200,000) / total hours worked (estimate 85 employees * 2000 hrs/yr)
  const totalHours = SAFETY_TRAINING_DATA.totalEmployees * 2000;
  const trir = totalHours > 0 ? Math.round(((totalIncidents * 200000) / totalHours) * 100) / 100 : 0;

  const modules = Object.values(SAFETY_TRAINING_DATA.modulesCompleted);
  const totalModuleCompletions = modules.reduce((sum, v) => sum + v, 0);
  const maxCompletions = modules.length * SAFETY_TRAINING_DATA.totalEmployees;
  const trainingPct = maxCompletions > 0 ? Math.round((totalModuleCompletions / maxCompletions) * 100) : 0;

  return { trir, totalIncidents, resolvedPct, trainingPct };
}

/* ─── KPI: Platform ─── */

export function computePlatformKpis() {
  const users = getPlatformUserActivity();
  const totalUsers = users.length;

  // Active in last 7 days (relative to latest activity date)
  const latestDate = users.reduce((max, u) => u.lastActiveDate > max ? u.lastActiveDate : max, "");
  const cutoff = new Date(latestDate + "T00:00:00");
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const monthlyActive = users.filter((u) => u.lastActiveDate >= cutoffStr).length;

  const totalEntries = users.reduce((sum, u) => sum + u.shipmentsCreated, 0);
  const entriesPerUser = totalUsers > 0 ? Math.round(totalEntries / totalUsers) : 0;

  const adoptionRate = totalUsers > 0 ? Math.round((monthlyActive / totalUsers) * 100) : 0;

  return { monthlyActive, entriesPerUser, adoptionRate };
}

/* ─── KPI: Customer ─── */

export function computeCustomerKpis() {
  const surveys = getCustomerSurveys();
  const totalSurveys = surveys.length;

  const avgCsat = totalSurveys > 0
    ? Math.round((surveys.reduce((sum, s) => sum + s.csat, 0) / totalSurveys) * 10) / 10
    : 0;

  // NPS = % promoters (9-10) minus % detractors (0-6)
  const promoters = surveys.filter((s) => s.nps >= 9).length;
  const detractors = surveys.filter((s) => s.nps <= 6).length;
  const nps = totalSurveys > 0
    ? Math.round(((promoters - detractors) / totalSurveys) * 100)
    : 0;

  const fcrResolved = surveys.filter((s) => s.fcrResolved).length;
  const fcrPct = totalSurveys > 0 ? Math.round((fcrResolved / totalSurveys) * 100) : 0;

  return { avgCsat, nps, fcrPct };
}

/* ─── Table: Route Margin ─── */

export function computeRouteMargin(shipments: Shipment[]) {
  const byRoute = new Map<string, { revenue: number; cost: number; count: number }>();
  shipments.forEach((s) => {
    const route = `${s.siteName} → ${s.transporterName ?? "Direct"}`;
    const existing = byRoute.get(route) ?? { revenue: 0, cost: 0, count: 0 };
    existing.revenue += totalCustomerCost(s);
    existing.cost += totalMpsCost(s);
    existing.count += 1;
    byRoute.set(route, existing);
  });
  return Array.from(byRoute.entries())
    .map(([route, d]) => {
      const margin = Math.round(d.revenue - d.cost);
      const marginPct = d.revenue > 0 ? (margin / d.revenue) * 100 : 0;
      return {
        route,
        shipments: d.count,
        revenue: Math.round(d.revenue),
        cost: Math.round(d.cost),
        margin,
        marginPct: Math.round(marginPct * 10) / 10,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/* ─── Table: Vendor Risk ─── */

export function computeVendorRisk(shipments: Shipment[]) {
  const vendors = getVendors();
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  const byVendor = new Map<string, { cost: number; count: number; vendorId: string }>();
  shipments.forEach((s) => {
    const existing = byVendor.get(s.vendorName) ?? { cost: 0, count: 0, vendorId: s.vendorId };
    existing.cost += totalMpsCost(s);
    existing.count += 1;
    byVendor.set(s.vendorName, existing);
  });

  return Array.from(byVendor.entries())
    .map(([name, d]) => {
      const vendor = vendorMap.get(d.vendorId);
      return {
        vendor: name,
        risk: vendor?.riskLevel ?? "Level 3 - Low",
        shipments: d.count,
        cost: Math.round(d.cost),
        dbe: vendor?.dbeFlag ?? false,
        status: vendor?.vendorStatus ?? "Active",
      };
    })
    .sort((a, b) => {
      const riskOrder: Record<string, number> = { "Level 1 - High": 0, "Level 2 - Medium": 1, "Level 3 - Low": 2 };
      return (riskOrder[a.risk] ?? 2) - (riskOrder[b.risk] ?? 2);
    });
}

/* ─── Table: Quality Breakdown ─── */

export function computeQualityBreakdown(shipments: Shipment[]) {
  const total = shipments.length;
  const checks: { check: string; test: (s: Shipment) => boolean }[] = [
    { check: "Missing Manifest", test: (s) => !s.manifestNumber },
    { check: "Missing Weight", test: (s) => !s.weightValue || s.weightValue === 0 },
    { check: "Missing Waste Category", test: (s) => !s.wasteCategory },
    { check: "Missing Treatment Method", test: (s) => !s.treatmentMethod },
    { check: "Missing Transporter", test: (s) => !s.transporterName },
    { check: "Missing Container Type", test: (s) => !s.containerType },
    { check: "Missing Cost Data", test: (s) => !s.mpsCost },
    { check: "Missing Customer Cost", test: (s) => !s.customerCost },
  ];

  return checks.map(({ check, test }) => {
    const issues = shipments.filter(test).length;
    const rate = total > 0 ? (issues / total) * 100 : 0;
    return {
      check,
      issues,
      total,
      rate: Math.round(rate * 10) / 10,
    };
  });
}
