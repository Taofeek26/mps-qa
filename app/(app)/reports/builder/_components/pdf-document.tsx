/* ============================================
   MPS Platform — Report Builder PDF Document
   Renders the full custom report as a native PDF.
   ============================================ */

import * as React from "react";
import { Document, Page, View, Text, Image, Font, StyleSheet } from "@react-pdf/renderer";

/* ─── Register Inter font family ─── */
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hiA.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYAZ9hiA.woff2", fontWeight: 800 },
  ],
});
import type { Shipment } from "@/lib/types";
import type { ReportSection, SectionConfig } from "@/lib/report-builder-types";
import {
  computeWasteVolumeKpis,
  computeCostKpis,
  computeComplianceKpis,
  computeDiversionKpis,
  isKpiVisible,
  computeMonthlyVolume,
  computeMonthlyCost,
  computeWasteCategoryDonut,
  computeTopStreams,
  computeCostWaterfall,
  computeVendorSpend,
  computeWasteStreamSummary,
  computeCostBySite,
  computeOperationalKpis,
  computeSafetyKpis,
  computePlatformKpis,
  computeCustomerKpis,
  computeCostComposition,
  computeMarginHeatmap,
  computeGhgEmissions,
  computeDiversionTrend,
  computeEfficiencyScatter,
  computeTreemapData,
  computeIncidentTrend,
  computeCsatTrend,
  computeArAging,
  computeFacilityUtilization,
  computeRouteMargin,
  computeVendorRisk,
  computeQualityBreakdown,
} from "@/lib/report-builder-data";
import { totalMpsCost, totalCustomerCost } from "@/lib/report-utils";
import {
  C, ps,
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
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  logo: { width: 28, height: 28, objectFit: "contain" },
  headerTitle: { fontSize: 16, fontFamily: "Inter", fontWeight: 700, color: C.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 7, fontWeight: 400, color: C.textMuted, marginTop: 2 },
  headerRule: { height: 2, backgroundColor: C.primary, borderRadius: 1, marginBottom: 16 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 6.5,
    color: C.textMuted,
    borderTopWidth: 0.5,
    borderTopColor: C.borderStrong,
    paddingTop: 6,
  },
});

/* ─── KPI Widgets ─── */

function PdfKpiWasteVolume({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const d = computeWasteVolumeKpis(shipments);
  const vis = config.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-waste-volume");
  const cards = [
    show("totalTons") && <PdfKpiCard key="totalTons" label="Total Tons" value={`${fmtNum(d.totalTons)} t`} sub="Standardized weight" />,
    show("totalShipments") && <PdfKpiCard key="totalShipments" label="Shipments" value={d.totalShipments.toLocaleString()} sub="All manifests" />,
    show("containerUtil") && <PdfKpiCard key="containerUtil" label="Container Util" value={fmtPct(d.containerUtilPct)} sub="Avg fill rate" />,
    show("avgLoad") && <PdfKpiCard key="avgLoad" label="Avg Load" value={`${d.avgLoadLbs.toLocaleString()} lbs`} sub="Per shipment" />,
  ].filter(Boolean);
  if (cards.length === 0) return null;
  return <PdfKpiRow>{cards}</PdfKpiRow>;
}

function PdfKpiCostSummary({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const d = computeCostKpis(shipments);
  const vis = config.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-cost-summary");
  const cards = [
    show("revenue") && <PdfKpiCard key="revenue" label="Revenue" value={fmtDollar(d.custCostTotal)} sub="Customer billed" />,
    show("mpsCost") && <PdfKpiCard key="mpsCost" label="MPS Cost" value={fmtDollar(d.mpsCostTotal)} sub="Total spend" />,
    show("margin") && <PdfKpiCard key="margin" label="Margin" value={fmtPct(d.marginPct)} sub={fmtDollar(d.margin)} />,
    show("costPerTon") && <PdfKpiCard key="costPerTon" label="Cost/Ton" value={fmtDollar(d.costPerTon)} sub="MPS cost basis" />,
  ].filter(Boolean);
  if (cards.length === 0) return null;
  return <PdfKpiRow>{cards}</PdfKpiRow>;
}

function PdfKpiCompliance({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const d = computeComplianceKpis(shipments);
  const vis = config.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-compliance");
  const cards = [
    show("manifestCoverage") && <PdfKpiCard key="manifestCoverage" label="Manifest Coverage" value={fmtPct(d.manifestCoverage)} sub={`${d.totalShipments} shipments`} />,
    show("hazPct") && <PdfKpiCard key="hazPct" label="Hazardous %" value={fmtPct(d.hazPct)} sub="Of total shipments" />,
    show("completionRate") && <PdfKpiCard key="completionRate" label="Completion Rate" value={fmtPct(d.completionRate)} sub="Submitted" />,
    show("complianceScore") && <PdfKpiCard key="complianceScore" label="Total Records" value={d.totalShipments.toString()} sub="In dataset" />,
  ].filter(Boolean);
  if (cards.length === 0) return null;
  return <PdfKpiRow>{cards}</PdfKpiRow>;
}

function PdfKpiDiversion({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const d = computeDiversionKpis(shipments);
  const vis = config.visibleKpis;
  const show = (key: string) => isKpiVisible(key, vis, "kpi-diversion");
  const cards = [
    show("diversionRate") && <PdfKpiCard key="diversionRate" label="Diversion Rate" value={fmtPct(d.diversionRate)} sub="Recycled / total" />,
    show("recyclingTons") && <PdfKpiCard key="recyclingTons" label="Recycling" value={`${fmtNum(d.recyclingTons)} t`} sub="Tons diverted" />,
    show("landfillTons") && <PdfKpiCard key="landfillTons" label="Landfill" value={`${fmtNum(d.landfillTons)} t`} sub="Tons to landfill" />,
    show("totalVolume") && <PdfKpiCard key="totalVolume" label="Total Volume" value={`${fmtNum(d.totalTons)} t`} sub="All methods" />,
  ].filter(Boolean);
  if (cards.length === 0) return null;
  return <PdfKpiRow>{cards}</PdfKpiRow>;
}

/* ─── Section Renderer ─── */

function PdfSection({ section, shipments }: { section: ReportSection; shipments: Shipment[] }) {
  const { type, config } = section;

  const widget = (() => {
    switch (type) {
      case "kpi-waste-volume": return <PdfKpiWasteVolume shipments={shipments} config={config} />;
      case "kpi-cost-summary": return <PdfKpiCostSummary shipments={shipments} config={config} />;
      case "kpi-compliance": return <PdfKpiCompliance shipments={shipments} config={config} />;
      case "kpi-diversion": return <PdfKpiDiversion shipments={shipments} config={config} />;
      case "chart-volume-trend":
        return <PdfBarChart data={computeMonthlyVolume(shipments)} dataKey="tons" label="Monthly Volume Trend" subtitle="Tonnage by month" />;
      case "chart-cost-comparison":
        return <PdfGroupedBarChart data={computeMonthlyCost(shipments)} keys={["revenue", "cost"]} labels={["Revenue", "MPS Cost"]} colors={[C.primary, C.teal]} title="Revenue vs Cost by Month" labelKey="month" formatter={fmtDollar} />;
      case "chart-waste-donut":
        return <PdfDonutChart data={computeWasteCategoryDonut(shipments)} title="Waste Distribution" subtitle="By category (tons)" />;
      case "chart-top-streams": {
        const streams = computeTopStreams(shipments);
        return <PdfProgressList data={streams.map((d) => ({ name: d.name, value: d.tons }))} title="Top Waste Streams" subtitle="Top 10 by volume" valueFormatter={(v) => `${fmtNum(v)} t`} />;
      }
      case "chart-cost-waterfall":
        return <PdfWaterfallChart data={computeCostWaterfall(shipments)} title="Cost Waterfall" />;
      case "chart-vendor-spend":
        return <PdfDonutChart data={computeVendorSpend(shipments)} title="Vendor Spend" subtitle="MPS cost by vendor" />;
      case "table-shipment-detail":
        return <PdfShipmentDetailTable shipments={shipments} config={config} />;
      case "table-waste-summary":
        return <PdfWasteSummaryTable shipments={shipments} config={config} />;
      case "table-cost-by-site":
        return <PdfCostBySiteTable shipments={shipments} config={config} />;
      case "notes-block":
        return (
          <View style={ps.notesBox}>
            <Text style={ps.chartTitle}>Notes</Text>
            <Text style={ps.notesText}>{config.notes || "No notes added."}</Text>
          </View>
        );
      /* ── New KPI blocks ── */
      case "kpi-operational": {
        const op = computeOperationalKpis(shipments);
        return (
          <PdfKpiRow>
            <PdfKpiCard label="Active Sites" value={String(op.activeSites)} sub="Sites with shipments" />
            <PdfKpiCard label="Avg Miles" value={`${op.avgMiles} mi`} sub="Per shipment" />
            <PdfKpiCard label="Target vs Actual" value={`${op.targetVsActualPct}%`} sub="" />
          </PdfKpiRow>
        );
      }
      case "kpi-safety": {
        const sf = computeSafetyKpis();
        return (
          <PdfKpiRow>
            <PdfKpiCard label="TRIR" value={sf.trir.toFixed(2)} sub="Per 200K hours" />
            <PdfKpiCard label="Incidents" value={String(sf.totalIncidents)} sub="Last 12 months" />
            <PdfKpiCard label="Resolved" value={`${sf.resolvedPct}%`} sub="Of incidents" />
            <PdfKpiCard label="Training" value={`${sf.trainingPct}%`} sub="" />
          </PdfKpiRow>
        );
      }
      case "kpi-platform": {
        const pl = computePlatformKpis();
        return (
          <PdfKpiRow>
            <PdfKpiCard label="Monthly Active" value={String(pl.monthlyActive)} sub="Users" />
            <PdfKpiCard label="Entries/User" value={String(pl.entriesPerUser)} sub="Avg shipments" />
            <PdfKpiCard label="Adoption Rate" value={`${pl.adoptionRate}%`} sub="" />
          </PdfKpiRow>
        );
      }
      case "kpi-customer": {
        const cx = computeCustomerKpis();
        return (
          <PdfKpiRow>
            <PdfKpiCard label="CSAT" value={`${cx.avgCsat}/5`} sub="Satisfaction" />
            <PdfKpiCard label="NPS" value={String(cx.nps)} sub="Net promoter" />
            <PdfKpiCard label="FCR" value={`${cx.fcrPct}%`} sub="" />
          </PdfKpiRow>
        );
      }
      /* ── New charts ── */
      case "chart-cost-composition":
        return <PdfBarChart data={computeCostComposition(shipments)} dataKey="Haul" label="Cost Composition" subtitle="Monthly cost breakdown (haul component)" />;
      case "chart-margin-heatmap": {
        const hm = computeMarginHeatmap(shipments);
        const hmCols = ["Site", ...hm.wasteTypes.slice(0, 6)];
        const hmRows = hm.rows.map((r) => {
          const row: Record<string, string> = { Site: r.site };
          r.cells.forEach((c) => {
            if (hmCols.includes(c.wasteType)) {
              row[c.wasteType] = c.margin != null ? `$${Math.abs(c.margin).toLocaleString()}` : "—";
            }
          });
          return row;
        });
        return <PdfTable title="Margin Heatmap" subtitle="Site × Waste Type" columns={hmCols.map((h) => ({ key: h, label: h, width: h === "Site" ? 80 : 55 }))} rows={hmRows} />;
      }
      case "chart-ghg-emissions": {
        const ghg = computeGhgEmissions(shipments);
        return <PdfBarChart data={ghg} dataKey="co2" label="GHG Emissions" subtitle="t CO₂e by waste category" />;
      }
      case "chart-diversion-trend":
        return <PdfBarChart data={computeDiversionTrend(shipments)} dataKey="diversion" label="Diversion Trend" subtitle="Monthly diversion rate %" />;
      case "chart-efficiency-scatter": {
        const eff = computeEfficiencyScatter(shipments);
        return <PdfProgressList data={eff.slice(0, 15).map((d) => ({ name: d.label, value: d.x }))} title="Load Efficiency" subtitle="Actual weight (lbs) — top 15" valueFormatter={(v) => `${fmtNum(v)} lbs`} />;
      }
      case "chart-treemap": {
        const tm = computeTreemapData(shipments);
        return <PdfProgressList data={tm.slice(0, 10).map((d) => ({ name: d.name, value: d.size }))} title="Waste Composition" subtitle="Volume by waste type (lbs)" valueFormatter={(v) => `${fmtNum(v)} lbs`} />;
      }
      case "chart-incident-trend":
        return <PdfBarChart data={computeIncidentTrend()} dataKey="incidents" label="Incident Trend" subtitle="Monthly safety incidents" />;
      case "chart-csat-trend": {
        const csat = computeCsatTrend();
        return <PdfBarChart data={csat} dataKey="csat" label="CSAT Trend" subtitle="Monthly customer satisfaction" />;
      }
      case "chart-ar-aging":
        return <PdfBarChart data={computeArAging()} dataKey="amount" label="AR Aging" subtitle="Outstanding invoices by days overdue" />;
      case "chart-facility-utilization": {
        const fu = computeFacilityUtilization();
        return <PdfProgressList data={fu.map((d) => ({ name: d.name, value: d.utilization }))} title="Facility Utilization" subtitle="% of capacity" valueFormatter={(v) => `${v}%`} />;
      }
      /* ── New tables ── */
      case "table-route-margin": {
        const routes = computeRouteMargin(shipments).slice(0, config.tableRowLimit ?? 25);
        return <PdfTable title="Route Margin" subtitle="Profit per route" columns={[
          { label: "Route", key: "route", width: 120 },
          { label: "Shipments", key: "shipments", width: 50, align: "right" },
          { label: "Revenue", key: "revenue", width: 60, align: "right" },
          { label: "Cost", key: "cost", width: 60, align: "right" },
          { label: "Margin", key: "margin", width: 60, align: "right" },
          { label: "Margin %", key: "marginPct", width: 50, align: "right" },
        ]} rows={routes.map((r) => ({
          route: r.route,
          shipments: String(r.shipments),
          revenue: fmtDollar(r.revenue),
          cost: fmtDollar(r.cost),
          margin: fmtDollar(r.margin),
          marginPct: `${r.marginPct}%`,
        }))} />;
      }
      case "table-vendor-risk": {
        const vr = computeVendorRisk(shipments).slice(0, config.tableRowLimit ?? 25);
        return <PdfTable title="Vendor Risk Matrix" subtitle="Risk levels and performance" columns={[
          { label: "Vendor", key: "name", width: 100 },
          { label: "Risk", key: "risk", width: 50 },
          { label: "Shipments", key: "shipments", width: 50, align: "right" },
          { label: "Cost", key: "cost", width: 60, align: "right" },
          { label: "DBE", key: "dbe", width: 30 },
          { label: "Status", key: "status", width: 50 },
        ]} rows={vr.map((v) => ({
          name: v.vendor,
          risk: v.risk,
          shipments: String(v.shipments),
          cost: fmtDollar(v.cost),
          dbe: v.dbe ? "Yes" : "—",
          status: v.status,
        }))} />;
      }
      case "table-quality-breakdown": {
        const qb = computeQualityBreakdown(shipments);
        return <PdfTable title="Quality Breakdown" subtitle="Data quality checks" columns={[
          { label: "Check", key: "label", width: 120 },
          { label: "Issues", key: "issues", width: 50, align: "right" },
          { label: "Total", key: "total", width: 50, align: "right" },
          { label: "Rate", key: "rate", width: 40, align: "right" },
          { label: "Status", key: "status", width: 50 },
        ]} rows={qb.map((q) => ({
          label: q.check,
          issues: String(q.issues),
          total: String(q.total),
          rate: `${q.rate}%`,
          status: q.rate < 5 ? "Good" : q.rate <= 15 ? "Attention" : "Critical",
        }))} />;
      }
      default:
        return (
          <View style={ps.notesBox}>
            <Text style={ps.chartTitle}>{String(type).replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
            <Text style={ps.notesText}>This widget type is not yet available in PDF export.</Text>
          </View>
        );
    }
  })();

  return <View style={ps.section} wrap={false}>{widget}</View>;
}

/* ─── Table Helpers ─── */

function PdfShipmentDetailTable({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const data = shipments.slice(0, config.tableRowLimit ?? 25);
  return (
    <PdfTable
      title="Shipment Detail"
      subtitle={`Showing ${data.length} of ${shipments.length} records`}
      columns={[
        { key: "date", label: "Date", width: 70 },
        { key: "site", label: "Site", width: 100 },
        { key: "client", label: "Client", width: 80 },
        { key: "wasteType", label: "Waste Type", width: 110 },
        { key: "weight", label: "Weight (lbs)", width: 70, align: "right" },
        { key: "cost", label: "MPS Cost", width: 65, align: "right" },
        { key: "revenue", label: "Revenue", width: 65, align: "right" },
        { key: "manifest", label: "Manifest #", width: 80 },
        { key: "status", label: "Status", width: 60 },
      ]}
      rows={data.map((sh) => ({
        date: sh.shipmentDate, site: sh.siteName, client: sh.clientName,
        wasteType: sh.wasteTypeName, weight: sh.weightValue.toLocaleString(),
        cost: `$${totalMpsCost(sh).toLocaleString()}`, revenue: `$${totalCustomerCost(sh).toLocaleString()}`,
        manifest: sh.manifestNumber || "—", status: sh.status,
      }))}
    />
  );
}

function PdfWasteSummaryTable({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const all = computeWasteStreamSummary(shipments);
  const data = all.slice(0, config.tableRowLimit ?? 25);
  return (
    <PdfTable
      title="Waste Stream Summary"
      columns={[
        { key: "name", label: "Waste Type", width: 140 },
        { key: "tons", label: "Tons", width: 60, align: "right" },
        { key: "shipments", label: "Shipments", width: 60, align: "right" },
        { key: "cost", label: "MPS Cost", width: 70, align: "right" },
        { key: "revenue", label: "Revenue", width: 70, align: "right" },
        { key: "margin", label: "Margin", width: 70, align: "right" },
      ]}
      rows={data.map((d) => ({ name: d.name, tons: fmtNum(d.tons), shipments: String(d.shipments), cost: fmtDollar(d.cost), revenue: fmtDollar(d.revenue), margin: fmtDollar(d.margin) }))}
    />
  );
}

function PdfCostBySiteTable({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const all = computeCostBySite(shipments);
  const data = all.slice(0, config.tableRowLimit ?? 25);
  return (
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
      rows={data.map((d) => ({ site: d.site, shipments: String(d.shipments), tons: fmtNum(d.tons), cost: fmtDollar(d.cost), revenue: fmtDollar(d.revenue), margin: fmtDollar(d.margin) }))}
    />
  );
}

/* ============================================
   Main Document
   ============================================ */

interface ReportPdfDocumentProps {
  title: string;
  filterSummary: string;
  sections: ReportSection[];
  shipments: Shipment[];
}

const timestamp = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export function ReportPdfDocument({ title, filterSummary, sections, shipments }: ReportPdfDocumentProps) {
  return (
    <Document title={title} author="MPS Platform" creator="MPS Centralized Waste Shipment Platform">
      <Page size="A4" style={s.page}>
        <View style={s.headerRow} fixed>
          <Image src="/logo.png" style={s.logo} />
          <View>
            <Text style={s.headerTitle}>{title || "Untitled Report"}</Text>
            <Text style={s.headerSub}>{filterSummary}</Text>
          </View>
        </View>
        <View style={s.headerRule} fixed />

        {sections.map((section) => (
          <PdfSection key={section.id} section={section} shipments={shipments} />
        ))}

        <View style={s.footer} fixed>
          <Text>MPS Centralized Waste Shipment Platform</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Generated {timestamp}</Text>
        </View>
      </Page>
    </Document>
  );
}
