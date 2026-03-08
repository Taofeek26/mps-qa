/* ============================================
   MPS Platform — Report Tab PDF Documents
   Generates branded PDF for each report tab
   using the tab's KPIs, charts, and tables.
   ============================================ */

import * as React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Shipment } from "@/lib/types";
import { getMonthKey, formatMonthLabel, totalMpsCost, totalCustomerCost } from "@/lib/report-utils";
import { getVendors } from "@/lib/mock-data";
import {
  C,
  fmtNum, fmtDollar, fmtPct,
  PdfKpiCard, PdfKpiRow,
  PdfBarChart, PdfGroupedBarChart, PdfDonutChart,
  PdfProgressList, PdfWaterfallChart, PdfTable,
} from "@/components/report-builder/pdf-primitives";

/* ─── Page Styles ─── */
const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 50,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  logo: { width: 28, height: 28, objectFit: "contain" },
  headerTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.text },
  headerSub: { fontSize: 7, color: C.textMuted, marginTop: 2 },
  headerRule: { height: 2, backgroundColor: C.primary, borderRadius: 1, marginBottom: 16 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6.5,
    color: C.textMuted,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  section: { marginBottom: 14 },
  gap: { marginBottom: 10 },
});

const timestamp = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/* ─── Shell ─── */

function PdfShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Document title={title} author="MPS Platform">
      <Page size="A4" style={s.page}>
        <View style={s.headerRow} fixed>
          <Image src="/logo.png" style={s.logo} />
          <View>
            <Text style={s.headerTitle}>{title}</Text>
            <Text style={s.headerSub}>{subtitle}</Text>
          </View>
        </View>
        <View style={s.headerRule} fixed />
        {children}
        <View style={s.footer} fixed>
          <Text>MPS Centralized Waste Shipment Platform</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Generated {timestamp}</Text>
        </View>
      </Page>
    </Document>
  );
}

/* ============================================
   Waste Trends
   ============================================ */

function WasteTrendsPdf({ shipments, filterSummary }: TabPdfProps) {
  const totalTons = shipments.reduce((sum, sh) => sum + sh.weightValue, 0) / 2000;
  const totalShipments = shipments.length;
  const avgLoadLbs = totalShipments > 0 ? Math.round((totalTons * 2000) / totalShipments) : 0;

  let actualTotal = 0, targetTotal = 0;
  shipments.forEach((sh) => {
    if (!sh.containerType || !sh.targetLoadWeight) return;
    actualTotal += sh.weightValue;
    targetTotal += sh.targetLoadWeight;
  });
  const containerUtilPct = targetTotal > 0 ? (actualTotal / targetTotal) * 100 : 0;

  // Monthly volume
  const byMonth = new Map<string, number>();
  shipments.forEach((sh) => {
    const key = getMonthKey(sh.shipmentDate);
    byMonth.set(key, (byMonth.get(key) ?? 0) + sh.weightValue / 2000);
  });
  const monthlyData = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, tons]) => ({ month: formatMonthLabel(key), tons: Math.round(tons * 10) / 10 }));

  // Treatment donut
  const byMethod = new Map<string, number>();
  shipments.forEach((sh) => {
    const m = sh.treatmentMethod ?? "Unknown";
    byMethod.set(m, (byMethod.get(m) ?? 0) + sh.weightValue / 2000);
  });
  const treatmentData = Array.from(byMethod.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // Waste type progress
  const byType = new Map<string, { tons: number; count: number }>();
  shipments.forEach((sh) => {
    const existing = byType.get(sh.wasteTypeName) ?? { tons: 0, count: 0 };
    existing.tons += sh.weightValue / 2000;
    existing.count += 1;
    byType.set(sh.wasteTypeName, existing);
  });
  const wasteTypeData = Array.from(byType.entries())
    .map(([name, d]) => ({ name, tons: Math.round(d.tons), count: d.count }))
    .sort((a, b) => b.tons - a.tons);

  return (
    <PdfShell title="Waste Trends Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Total Tons" value={`${fmtNum(totalTons)} t`} sub="Standardized weight" />
          <PdfKpiCard label="Shipments" value={totalShipments.toLocaleString()} sub="All manifests" />
          <PdfKpiCard label="Container Util" value={fmtPct(containerUtilPct)} sub="Avg fill rate" />
          <PdfKpiCard label="Avg Load" value={`${avgLoadLbs.toLocaleString()} lbs`} sub="Per shipment" />
        </PdfKpiRow>
      </View>
      <View style={s.section} wrap={false}>
        <PdfBarChart data={monthlyData} dataKey="tons" label="Monthly Volume Trend" subtitle="Tonnage over time" />
      </View>
      <View style={s.section} wrap={false}>
        <PdfDonutChart data={treatmentData} title="Treatment Method Distribution" subtitle="Landfill vs Recycling vs Incineration" />
      </View>
      <View style={s.section} wrap={false}>
        <PdfProgressList data={wasteTypeData.map((d) => ({ name: d.name, value: d.tons }))} title="Waste Type Distribution" subtitle="Volume by waste stream (tons)" valueFormatter={(v) => `${fmtNum(v)} t`} />
      </View>
      <PdfTable
        title="Waste Streams"
        subtitle={`${wasteTypeData.length} waste types`}
        columns={[
          { key: "name", label: "Waste Type", width: 160 },
          { key: "tons", label: "Volume (tons)", width: 80, align: "right" },
          { key: "count", label: "Shipments", width: 80, align: "right" },
        ]}
        rows={wasteTypeData.map((d) => ({ name: d.name, tons: fmtNum(d.tons), count: String(d.count) }))}
      />
    </PdfShell>
  );
}

/* ============================================
   Cost Analysis
   ============================================ */

function CostAnalysisPdf({ shipments, filterSummary }: TabPdfProps) {
  let mpsCostTotal = 0, custCostTotal = 0, rebateTotal = 0, totalVolume = 0, haulTotal = 0;
  shipments.forEach((sh) => {
    mpsCostTotal += totalMpsCost(sh);
    custCostTotal += totalCustomerCost(sh);
    totalVolume += sh.weightValue;
    rebateTotal += sh.customerCost?.rebate ?? 0;
    haulTotal += sh.mpsCost?.haulCharge ?? 0;
  });
  const costPerTon = totalVolume > 0 ? mpsCostTotal / (totalVolume / 2000) : 0;

  // Monthly trend
  const byMonth = new Map<string, { rev: number; cost: number }>();
  shipments.forEach((sh) => {
    const key = getMonthKey(sh.shipmentDate);
    const existing = byMonth.get(key) ?? { rev: 0, cost: 0 };
    existing.rev += totalCustomerCost(sh);
    existing.cost += totalMpsCost(sh);
    byMonth.set(key, existing);
  });
  const monthlyData = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, d]) => ({ month: formatMonthLabel(key), revenue: Math.round(d.rev), cost: Math.round(d.cost) }));

  // Cost by site
  const bySite = new Map<string, { cost: number; revenue: number; tons: number; count: number }>();
  shipments.forEach((sh) => {
    const existing = bySite.get(sh.siteName) ?? { cost: 0, revenue: 0, tons: 0, count: 0 };
    existing.cost += totalMpsCost(sh);
    existing.revenue += totalCustomerCost(sh);
    existing.tons += sh.weightValue / 2000;
    existing.count += 1;
    bySite.set(sh.siteName, existing);
  });
  const siteData = Array.from(bySite.entries())
    .map(([site, d]) => ({ site, shipments: d.count, tons: Math.round(d.tons), cost: Math.round(d.cost), revenue: Math.round(d.revenue), margin: Math.round(d.revenue - d.cost) }))
    .sort((a, b) => b.revenue - a.revenue);

  // Waterfall
  let haul = 0, disposal = 0, fuel = 0, env = 0, rebate = 0;
  shipments.forEach((sh) => {
    if (sh.mpsCost) { haul += sh.mpsCost.haulCharge; disposal += sh.mpsCost.disposalFeeTotal; fuel += sh.mpsCost.fuelFee; env += sh.mpsCost.environmentalFee; }
    rebate += sh.customerCost?.rebate ?? 0;
  });
  const waterfallData = [
    { name: "Revenue", value: Math.round(custCostTotal) },
    { name: "Haul", value: -Math.round(haul) },
    { name: "Disposal", value: -Math.round(disposal) },
    { name: "Fuel", value: -Math.round(fuel) },
    { name: "Env Fees", value: -Math.round(env) },
    { name: "Rebates", value: Math.round(rebate) },
    { name: "Net Margin", value: 0, isTotal: true as const },
  ];

  // Transactions table
  const transactions = shipments.slice(0, 50).map((sh) => ({
    date: sh.shipmentDate,
    site: sh.siteName,
    wasteType: sh.wasteTypeName,
    revenue: fmtDollar(totalCustomerCost(sh)),
    cost: fmtDollar(totalMpsCost(sh)),
    margin: fmtDollar(totalCustomerCost(sh) - totalMpsCost(sh)),
    rebate: fmtDollar(sh.customerCost?.rebate ?? 0),
  }));

  return (
    <PdfShell title="Cost Analysis Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Total Revenue" value={fmtDollar(custCostTotal)} sub="Customer billed" />
          <PdfKpiCard label="Total Cost" value={fmtDollar(mpsCostTotal)} sub="MPS spend" />
          <PdfKpiCard label="Rebate Credits" value={fmtDollar(rebateTotal)} sub="Total rebates" />
          <PdfKpiCard label="Cost/Ton" value={fmtDollar(costPerTon)} sub="MPS cost basis" />
          <PdfKpiCard label="Haul Cost" value={fmtDollar(haulTotal)} sub="Transportation" />
        </PdfKpiRow>
      </View>
      <View style={s.section} wrap={false}>
        <PdfGroupedBarChart data={monthlyData} keys={["revenue", "cost"]} labels={["Revenue", "MPS Cost"]} colors={[C.primary, C.teal]} title="Revenue vs Cost Trend" labelKey="month" formatter={fmtDollar} />
      </View>
      <View style={s.section} wrap={false}>
        <PdfWaterfallChart data={waterfallData} title="Margin Waterfall" subtitle="Revenue to net margin breakdown" />
      </View>
      <PdfTable
        title="Cost Breakdown by Site"
        columns={[
          { key: "site", label: "Site", width: 130 },
          { key: "shipments", label: "Shipments", width: 60, align: "right" },
          { key: "tons", label: "Tons", width: 60, align: "right" },
          { key: "cost", label: "MPS Cost", width: 70, align: "right" },
          { key: "revenue", label: "Revenue", width: 70, align: "right" },
          { key: "margin", label: "Margin", width: 70, align: "right" },
        ]}
        rows={siteData.map((d) => ({ site: d.site, shipments: String(d.shipments), tons: fmtNum(d.tons), cost: fmtDollar(d.cost), revenue: fmtDollar(d.revenue), margin: fmtDollar(d.margin) }))}
      />
      <View style={s.gap} />
      <PdfTable
        title="Transaction Detail"
        subtitle={`Showing ${transactions.length} of ${shipments.length} records`}
        columns={[
          { key: "date", label: "Date", width: 70 },
          { key: "site", label: "Site", width: 100 },
          { key: "wasteType", label: "Waste Type", width: 110 },
          { key: "revenue", label: "Revenue", width: 65, align: "right" },
          { key: "cost", label: "Cost", width: 65, align: "right" },
          { key: "margin", label: "Margin", width: 65, align: "right" },
          { key: "rebate", label: "Rebate", width: 55, align: "right" },
        ]}
        rows={transactions}
      />
    </PdfShell>
  );
}

/* ============================================
   Light Load
   ============================================ */

function LightLoadPdf({ shipments, filterSummary }: TabPdfProps) {
  const loads = shipments
    .filter((sh) => sh.targetLoadWeight && sh.targetLoadWeight > 0)
    .map((sh) => ({ ...sh, efficiency: (sh.weightValue / sh.targetLoadWeight!) * 100 }));
  const lightLoads = loads.filter((sh) => sh.efficiency < 75);
  const avgEff = loads.length > 0 ? loads.reduce((sum, sh) => sum + sh.efficiency, 0) / loads.length : 0;
  const savings = lightLoads.reduce((sum, sh) => sum + totalMpsCost(sh) * (1 - sh.efficiency / 100) * 0.5, 0);

  const tableData = lightLoads.slice(0, 50).map((sh) => ({
    date: sh.shipmentDate,
    site: sh.siteName,
    wasteType: sh.wasteTypeName,
    actual: sh.weightValue.toLocaleString(),
    target: (sh.targetLoadWeight ?? 0).toLocaleString(),
    efficiency: fmtPct(sh.efficiency),
    container: sh.containerType || "—",
  }));

  return (
    <PdfShell title="Light Load Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Light Loads" value={String(lightLoads.length)} sub={`< 75% capacity`} />
          <PdfKpiCard label="Light Load %" value={fmtPct(loads.length > 0 ? (lightLoads.length / loads.length) * 100 : 0)} sub="Of tracked loads" />
          <PdfKpiCard label="Avg Efficiency" value={fmtPct(avgEff)} sub="All tracked loads" />
          <PdfKpiCard label="Potential Savings" value={fmtDollar(savings)} sub="Estimated opportunity" />
        </PdfKpiRow>
      </View>
      <PdfTable
        title="Light Loads Detail"
        subtitle={`${tableData.length} light loads (< 75% efficiency)`}
        columns={[
          { key: "date", label: "Date", width: 70 },
          { key: "site", label: "Site", width: 110 },
          { key: "wasteType", label: "Waste Type", width: 110 },
          { key: "actual", label: "Actual (lbs)", width: 70, align: "right" },
          { key: "target", label: "Target (lbs)", width: 70, align: "right" },
          { key: "efficiency", label: "Efficiency", width: 60, align: "right" },
          { key: "container", label: "Container", width: 80 },
        ]}
        rows={tableData}
      />
    </PdfShell>
  );
}

/* ============================================
   Regulatory
   ============================================ */

function RegulatoryPdf({ shipments, filterSummary }: TabPdfProps) {
  const withManifest = shipments.filter((sh) => sh.manifestNumber).length;
  const manifestRate = shipments.length > 0 ? (withManifest / shipments.length) * 100 : 0;
  const pending = shipments.filter((sh) => sh.status === "pending").length;
  const rcra = shipments.filter((sh) => sh.wasteCategory === "Hazardous Waste").length;

  const manifestDonut = [
    { name: "With Manifest", value: withManifest },
    { name: "Without Manifest", value: shipments.length - withManifest },
  ];

  const manifestedShipments = shipments.filter((sh) => sh.manifestNumber).slice(0, 50);
  const tableData = manifestedShipments.map((sh) => ({
    manifest: sh.manifestNumber || "",
    date: sh.shipmentDate,
    site: sh.siteName,
    wasteType: sh.wasteTypeName,
    category: sh.wasteCategory || "—",
    status: sh.status,
    transporter: sh.transporterName || "—",
    facility: sh.receivingFacility || "—",
  }));

  return (
    <PdfShell title="Regulatory Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Total Manifests" value={String(withManifest)} sub="Tracked shipments" />
          <PdfKpiCard label="Manifest Rate" value={fmtPct(manifestRate)} sub="Coverage" />
          <PdfKpiCard label="Pending" value={String(pending)} sub="Awaiting completion" />
          <PdfKpiCard label="RCRA Regulated" value={String(rcra)} sub="Hazardous waste" />
        </PdfKpiRow>
      </View>
      <View style={s.section} wrap={false}>
        <PdfDonutChart data={manifestDonut} title="Manifest Completion" subtitle="Coverage of shipments" />
      </View>
      <PdfTable
        title="Manifest Detail"
        subtitle={`${tableData.length} manifested shipments`}
        columns={[
          { key: "manifest", label: "Manifest #", width: 80 },
          { key: "date", label: "Date", width: 65 },
          { key: "site", label: "Site", width: 90 },
          { key: "wasteType", label: "Waste Type", width: 100 },
          { key: "category", label: "Category", width: 80 },
          { key: "status", label: "Status", width: 55 },
          { key: "transporter", label: "Transporter", width: 80 },
        ]}
        rows={tableData}
      />
    </PdfShell>
  );
}

/* ============================================
   Operations
   ============================================ */

function OperationsPdf({ shipments, filterSummary }: TabPdfProps) {
  const sites = new Set(shipments.map((sh) => sh.siteName));
  const transporters = new Set(shipments.map((sh) => sh.transporterName).filter(Boolean));
  const totalVolume = shipments.reduce((sum, sh) => sum + sh.weightValue / 2000, 0);
  const avgPerSite = sites.size > 0 ? totalVolume / sites.size : 0;

  // Site leaderboard
  const bySite = new Map<string, { volume: number; count: number; cost: number; revenue: number }>();
  shipments.forEach((sh) => {
    const existing = bySite.get(sh.siteName) ?? { volume: 0, count: 0, cost: 0, revenue: 0 };
    existing.volume += sh.weightValue / 2000;
    existing.count += 1;
    existing.cost += totalMpsCost(sh);
    existing.revenue += totalCustomerCost(sh);
    bySite.set(sh.siteName, existing);
  });
  const siteLeaderboard = Array.from(bySite.entries())
    .map(([site, d]) => ({
      site, volume: fmtNum(Math.round(d.volume)), shipments: String(d.count),
      cost: fmtDollar(d.cost), revenue: fmtDollar(d.revenue),
      margin: fmtPct(d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0),
    }))
    .sort((a, b) => Number(b.shipments) - Number(a.shipments));

  return (
    <PdfShell title="Operations Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Active Sites" value={String(sites.size)} sub="Unique sites" />
          <PdfKpiCard label="Avg Vol/Site" value={`${fmtNum(avgPerSite)} t`} sub="Tons per site" />
          <PdfKpiCard label="Transporters" value={String(transporters.size)} sub="Unique carriers" />
          <PdfKpiCard label="Total Volume" value={`${fmtNum(totalVolume)} t`} sub="All sites" />
        </PdfKpiRow>
      </View>
      <PdfTable
        title="Site Leaderboard"
        columns={[
          { key: "site", label: "Site", width: 140 },
          { key: "volume", label: "Volume (t)", width: 70, align: "right" },
          { key: "shipments", label: "Shipments", width: 65, align: "right" },
          { key: "cost", label: "MPS Cost", width: 70, align: "right" },
          { key: "revenue", label: "Revenue", width: 70, align: "right" },
          { key: "margin", label: "Margin %", width: 60, align: "right" },
        ]}
        rows={siteLeaderboard}
      />
    </PdfShell>
  );
}

/* ============================================
   Data Quality
   ============================================ */

function DataQualityPdf({ shipments, filterSummary }: TabPdfProps) {
  const fields = ["manifestNumber", "wasteCategory", "treatmentMethod", "containerType", "transporterName", "receivingFacility"] as const;
  let complete = 0, missing = 0;
  shipments.forEach((sh) => {
    fields.forEach((f) => {
      if (sh[f]) complete++; else missing++;
    });
  });
  const total = complete + missing;
  const score = total > 0 ? (complete / total) * 100 : 0;

  // Duplicates
  const manifestCounts = new Map<string, number>();
  shipments.forEach((sh) => {
    if (sh.manifestNumber) manifestCounts.set(sh.manifestNumber, (manifestCounts.get(sh.manifestNumber) ?? 0) + 1);
  });
  const duplicates = Array.from(manifestCounts.entries()).filter(([, c]) => c > 1);

  return (
    <PdfShell title="Data Quality Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Overall Score" value={fmtPct(score)} sub="Completeness" />
          <PdfKpiCard label="Fields Complete" value={complete.toLocaleString()} sub={`Of ${total.toLocaleString()}`} />
          <PdfKpiCard label="Fields Missing" value={missing.toLocaleString()} sub="Need attention" />
          <PdfKpiCard label="Duplicate Manifests" value={String(duplicates.length)} sub="Manifest numbers" />
        </PdfKpiRow>
      </View>
      {duplicates.length > 0 && (
        <PdfTable
          title="Duplicate Manifests"
          columns={[
            { key: "manifest", label: "Manifest #", width: 200 },
            { key: "count", label: "Occurrences", width: 100, align: "right" },
          ]}
          rows={duplicates.map(([manifest, count]) => ({ manifest, count: String(count) }))}
        />
      )}
    </PdfShell>
  );
}

/* ============================================
   Vendor Intel
   ============================================ */

function VendorIntelPdf({ shipments, filterSummary }: TabPdfProps) {
  const vendors = getVendors();
  const highRisk = vendors.filter((v) => v.riskLevel === "Level 1 - High").length;
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 86400000);
  const expiring = vendors.filter((v) => v.expirationDate && new Date(v.expirationDate) <= in90Days).length;
  const dbe = vendors.filter((v) => v.dbeFlag).length;

  // Vendor spend
  const byVendor = new Map<string, number>();
  shipments.forEach((sh) => {
    const vendor = sh.vendorName ?? "Unknown";
    byVendor.set(vendor, (byVendor.get(vendor) ?? 0) + totalMpsCost(sh));
  });
  const vendorSpend = Array.from(byVendor.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const vendorTable = vendors.map((v) => ({
    name: v.name,
    status: v.vendorStatus || "—",
    risk: v.riskLevel || "—",
    expiration: v.expirationDate || "—",
    dbe: v.dbeFlag ? "Yes" : "No",
  }));

  return (
    <PdfShell title="Vendor Intelligence Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Total Vendors" value={String(vendors.length)} sub="All vendors" />
          <PdfKpiCard label="High Risk" value={String(highRisk)} sub="Need review" />
          <PdfKpiCard label="Expiring < 90d" value={String(expiring)} sub="Action required" />
          <PdfKpiCard label="DBE Vendors" value={String(dbe)} sub="Certified diverse" />
        </PdfKpiRow>
      </View>
      <View style={s.section} wrap={false}>
        <PdfDonutChart data={vendorSpend} title="Vendor Spend" subtitle="MPS cost by vendor" />
      </View>
      <PdfTable
        title="Vendor Compliance"
        columns={[
          { key: "name", label: "Vendor", width: 140 },
          { key: "status", label: "Status", width: 80 },
          { key: "risk", label: "Risk Level", width: 70 },
          { key: "expiration", label: "Expiration", width: 80 },
          { key: "dbe", label: "DBE", width: 50 },
        ]}
        rows={vendorTable}
      />
    </PdfShell>
  );
}

/* ============================================
   Logistics
   ============================================ */

function LogisticsPdf({ shipments, filterSummary }: TabPdfProps) {
  const facilities = new Set(shipments.map((sh) => sh.receivingFacility).filter(Boolean));
  const transporters = new Set(shipments.map((sh) => sh.transporterName).filter(Boolean));
  const avgDistance = shipments.length > 0 ? shipments.reduce((sum, sh) => sum + 0, 0) / shipments.length : 0;

  // Facility utilization
  const byFacility = new Map<string, { count: number; volume: number; cost: number }>();
  shipments.forEach((sh) => {
    const name = sh.receivingFacility || "Unknown";
    const existing = byFacility.get(name) ?? { count: 0, volume: 0, cost: 0 };
    existing.count += 1;
    existing.volume += sh.weightValue / 2000;
    existing.cost += totalMpsCost(sh);
    byFacility.set(name, existing);
  });
  const facilityData = Array.from(byFacility.entries())
    .map(([name, d]) => ({ name, shipments: String(d.count), volume: fmtNum(Math.round(d.volume)), cost: fmtDollar(d.cost) }))
    .sort((a, b) => Number(b.shipments) - Number(a.shipments));

  return (
    <PdfShell title="Logistics Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Facilities Used" value={String(facilities.size)} sub="Receiving facilities" />
          <PdfKpiCard label="Transporters" value={String(transporters.size)} sub="Unique carriers" />
          <PdfKpiCard label="Avg Distance" value={`${Math.round(avgDistance)} mi`} sub="Per shipment" />
          <PdfKpiCard label="Total Shipments" value={shipments.length.toLocaleString()} sub="In period" />
        </PdfKpiRow>
      </View>
      <PdfTable
        title="Facility Utilization"
        columns={[
          { key: "name", label: "Facility", width: 180 },
          { key: "shipments", label: "Shipments", width: 70, align: "right" },
          { key: "volume", label: "Volume (t)", width: 70, align: "right" },
          { key: "cost", label: "MPS Cost", width: 80, align: "right" },
        ]}
        rows={facilityData}
      />
    </PdfShell>
  );
}

/* ============================================
   Emissions
   ============================================ */

function EmissionsPdf({ shipments, filterSummary }: TabPdfProps) {
  const totalTons = shipments.reduce((sum, sh) => sum + sh.weightValue / 2000, 0);
  let recyclingTons = 0, landfillTons = 0;
  shipments.forEach((sh) => {
    const t = sh.weightValue / 2000;
    const method = (sh.treatmentMethod ?? "").toLowerCase();
    if (method.includes("recycl") || method.includes("reuse") || method.includes("recovery")) recyclingTons += t;
    else if (method.includes("landfill")) landfillTons += t;
  });
  const diversionRate = totalTons > 0 ? (recyclingTons / totalTons) * 100 : 0;
  const ghgEstimate = landfillTons * 0.58;
  const scope3 = shipments.reduce((sum, sh) => sum + 0 * 0.000121, 0);

  // GHG by category
  const byCat = new Map<string, number>();
  shipments.forEach((sh) => {
    const cat = sh.wasteCategory ?? "Unknown";
    byCat.set(cat, (byCat.get(cat) ?? 0) + sh.weightValue / 2000);
  });
  const ghgData = Array.from(byCat.entries())
    .map(([name, tons]) => ({ name, tons: Math.round(tons), co2e: Math.round(tons * 0.58) }))
    .sort((a, b) => b.co2e - a.co2e);

  return (
    <PdfShell title="Emissions & Sustainability Report" subtitle={filterSummary}>
      <View style={s.section} wrap={false}>
        <PdfKpiRow>
          <PdfKpiCard label="Total GHG" value={`${fmtNum(ghgEstimate)} t`} sub="CO₂e estimate" />
          <PdfKpiCard label="Diversion Rate" value={fmtPct(diversionRate)} sub="From landfill" />
          <PdfKpiCard label="Recycling Offset" value={`${fmtNum(recyclingTons)} t`} sub="Tons diverted" />
          <PdfKpiCard label="Scope 3 Proxy" value={`${fmtNum(scope3)} t`} sub="Transport CO₂" />
        </PdfKpiRow>
      </View>
      <View style={s.section} wrap={false}>
        <PdfBarChart data={ghgData} dataKey="co2e" label="GHG Emissions by Category" subtitle="Estimated CO₂e by waste category" />
      </View>
      <PdfTable
        title="GHG Breakdown"
        columns={[
          { key: "name", label: "Category", width: 160 },
          { key: "tons", label: "Quantity (t)", width: 80, align: "right" },
          { key: "co2e", label: "CO₂e (t)", width: 80, align: "right" },
        ]}
        rows={ghgData.map((d) => ({ name: d.name, tons: fmtNum(d.tons), co2e: fmtNum(d.co2e) }))}
      />
    </PdfShell>
  );
}

/* ============================================
   Tab → Document Mapping
   ============================================ */

interface TabPdfProps {
  shipments: Shipment[];
  filterSummary: string;
}

const TAB_DOCUMENTS: Record<string, React.FC<TabPdfProps>> = {
  "waste-trends": WasteTrendsPdf,
  "cost-analysis": CostAnalysisPdf,
  "light-load": LightLoadPdf,
  "regulatory": RegulatoryPdf,
  "operations": OperationsPdf,
  "data-quality": DataQualityPdf,
  "vendor-intel": VendorIntelPdf,
  "logistics": LogisticsPdf,
  "emissions": EmissionsPdf,
};

export function getTabPdfDocument(tabId: string, props: TabPdfProps): React.ReactElement | null {
  const DocComponent = TAB_DOCUMENTS[tabId];
  if (!DocComponent) return null;
  return <DocComponent {...props} />;
}
