/* ============================================
   MPS Platform — Report Builder PDF Document
   Renders the full custom report as a native PDF.
   ============================================ */

import * as React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
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
      default: return null;
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
