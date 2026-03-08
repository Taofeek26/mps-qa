/* ============================================
   MPS Platform — PDF Document (react-pdf)
   Renders the full report as a native PDF using
   @react-pdf/renderer primitives + SVG charts.
   ============================================ */

import * as React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Rect,
  Circle,
  Line,
  G,
  Path,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Shipment } from "@/lib/types";
import type { ReportSection, SectionType, SectionConfig } from "@/lib/report-builder-types";
import {
  computeWasteVolumeKpis,
  computeCostKpis,
  computeComplianceKpis,
  computeDiversionKpis,
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

/* ─── Brand Colors ─── */
const C = {
  primary: "#1863DC",
  primaryLight: "#EBF2FC",
  teal: "#00B38C",
  tealLight: "#E6F7F3",
  text: "#333333",
  textMuted: "#757575",
  border: "#E0E0E0",
  bg: "#F5F5F5",
  white: "#FFFFFF",
  success: "#3F8B65",
  warning: "#C48124",
  error: "#B04141",
};

const CHART_PALETTE = [
  "#1863DC", "#00B38C", "#C48124", "#B04141",
  "#0E3B84", "#008F70", "#E1A341", "#3F8B65",
];

/* ─── Base Styles ─── */
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
  /* Header */
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  logo: { width: 28, height: 28, objectFit: "contain" },
  headerTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.text },
  headerSub: { fontSize: 7, color: C.textMuted, marginTop: 2 },
  headerRule: { height: 2, backgroundColor: C.primary, borderRadius: 1, marginBottom: 16 },
  /* Footer */
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
  /* Section */
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, color: C.text },
  /* KPI grid */
  kpiRow: { flexDirection: "row", gap: 8 },
  kpiCard: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    backgroundColor: C.white,
  },
  kpiLabel: { fontSize: 6.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, color: C.textMuted, marginBottom: 3 },
  kpiValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.text },
  kpiSub: { fontSize: 7, color: C.textMuted, marginTop: 2 },
  /* Chart container */
  chartBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: C.white,
  },
  chartTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 2 },
  chartSub: { fontSize: 7, color: C.textMuted, marginBottom: 8 },
  /* Table */
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.textMuted },
  td: { fontSize: 7.5, color: C.text },
  /* Notes */
  notesBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: C.white,
    minHeight: 40,
  },
  notesText: { fontSize: 8.5, color: C.text, lineHeight: 1.5 },
  /* Legend */
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 2 },
  legendLabel: { fontSize: 7, color: C.textMuted },
});

/* ─── Helpers ─── */
function fmtNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toFixed(0);
}
function fmtDollar(v: number): string { return `$${fmtNum(v)}`; }
function fmtPct(v: number): string { return `${v.toFixed(1)}%`; }

/* ============================================
   KPI Widgets
   ============================================ */

function PdfKpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiSub}>{sub}</Text>
    </View>
  );
}

function PdfKpiWasteVolume({ shipments }: { shipments: Shipment[] }) {
  const d = computeWasteVolumeKpis(shipments);
  return (
    <View style={s.kpiRow}>
      <PdfKpiCard label="Total Tons" value={`${fmtNum(d.totalTons)} t`} sub="Standardized weight" />
      <PdfKpiCard label="Shipments" value={d.totalShipments.toLocaleString()} sub="All manifests" />
      <PdfKpiCard label="Container Util" value={fmtPct(d.containerUtilPct)} sub="Avg fill rate" />
      <PdfKpiCard label="Avg Load" value={`${d.avgLoadLbs.toLocaleString()} lbs`} sub="Per shipment" />
    </View>
  );
}

function PdfKpiCostSummary({ shipments }: { shipments: Shipment[] }) {
  const d = computeCostKpis(shipments);
  return (
    <View style={s.kpiRow}>
      <PdfKpiCard label="MPS Cost" value={fmtDollar(d.mpsCostTotal)} sub="Total spend" />
      <PdfKpiCard label="Revenue" value={fmtDollar(d.custCostTotal)} sub="Customer billed" />
      <PdfKpiCard label="Margin" value={fmtPct(d.marginPct)} sub={fmtDollar(d.margin)} />
      <PdfKpiCard label="Cost/Ton" value={fmtDollar(d.costPerTon)} sub="MPS cost basis" />
    </View>
  );
}

function PdfKpiCompliance({ shipments }: { shipments: Shipment[] }) {
  const d = computeComplianceKpis(shipments);
  return (
    <View style={s.kpiRow}>
      <PdfKpiCard label="Manifest Coverage" value={fmtPct(d.manifestCoverage)} sub={`${d.totalShipments} shipments`} />
      <PdfKpiCard label="Hazardous %" value={fmtPct(d.hazPct)} sub="Of total shipments" />
      <PdfKpiCard label="Completion Rate" value={fmtPct(d.completionRate)} sub="Submitted" />
      <PdfKpiCard label="Total Records" value={d.totalShipments.toString()} sub="In dataset" />
    </View>
  );
}

function PdfKpiDiversion({ shipments }: { shipments: Shipment[] }) {
  const d = computeDiversionKpis(shipments);
  return (
    <View style={s.kpiRow}>
      <PdfKpiCard label="Diversion Rate" value={fmtPct(d.diversionRate)} sub="Recycled / total" />
      <PdfKpiCard label="Recycling" value={`${fmtNum(d.recyclingTons)} t`} sub="Tons diverted" />
      <PdfKpiCard label="Landfill" value={`${fmtNum(d.landfillTons)} t`} sub="Tons to landfill" />
      <PdfKpiCard label="Total Volume" value={`${fmtNum(d.totalTons)} t`} sub="All methods" />
    </View>
  );
}

/* ============================================
   SVG Chart Widgets
   ============================================ */

const CHART_W = 500;
const CHART_H = 180;
const BAR_AREA = { left: 50, right: 20, top: 10, bottom: 30 };

function SvgBarChart({ data, dataKey, label }: { data: { month: string; [k: string]: unknown }[]; dataKey: string; label: string }) {
  if (data.length === 0) return <Text style={s.chartSub}>No data available</Text>;

  const values = data.map((d) => Number(d[dataKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const plotW = CHART_W - BAR_AREA.left - BAR_AREA.right;
  const plotH = CHART_H - BAR_AREA.top - BAR_AREA.bottom;
  const barW = Math.min(plotW / data.length * 0.7, 30);
  const gap = plotW / data.length;

  return (
    <View style={s.chartBox}>
      <Text style={s.chartTitle}>{label}</Text>
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = BAR_AREA.top + plotH * (1 - pct);
          return (
            <G key={pct}>
              <Line x1={BAR_AREA.left} y1={y} x2={CHART_W - BAR_AREA.right} y2={y} stroke={C.border} strokeWidth={0.5} />
              <Text x={BAR_AREA.left - 4} y={y + 3} style={{ fontSize: 6, color: C.textMuted }} textAnchor="end">
                {fmtNum(maxVal * pct)}
              </Text>
            </G>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const val = Number(d[dataKey]) || 0;
          const h = (val / maxVal) * plotH;
          const x = BAR_AREA.left + i * gap + (gap - barW) / 2;
          const y = BAR_AREA.top + plotH - h;
          return (
            <G key={i}>
              <Rect x={x} y={y} width={barW} height={h} fill={C.primary} rx={2} />
              <Text x={x + barW / 2} y={CHART_H - BAR_AREA.bottom + 12} style={{ fontSize: 5.5, color: C.textMuted }} textAnchor="middle">
                {String(d.month)}
              </Text>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function SvgGroupedBarChart({ data }: { data: { month: string; revenue: number; cost: number }[] }) {
  if (data.length === 0) return <Text style={s.chartSub}>No data available</Text>;

  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.cost]), 1);
  const plotW = CHART_W - BAR_AREA.left - BAR_AREA.right;
  const plotH = CHART_H - BAR_AREA.top - BAR_AREA.bottom;
  const gap = plotW / data.length;
  const barW = Math.min(gap * 0.35, 14);

  return (
    <View style={s.chartBox}>
      <Text style={s.chartTitle}>Revenue vs Cost by Month</Text>
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = BAR_AREA.top + plotH * (1 - pct);
          return (
            <G key={pct}>
              <Line x1={BAR_AREA.left} y1={y} x2={CHART_W - BAR_AREA.right} y2={y} stroke={C.border} strokeWidth={0.5} />
              <Text x={BAR_AREA.left - 4} y={y + 3} style={{ fontSize: 6, color: C.textMuted }} textAnchor="end">
                {fmtDollar(maxVal * pct)}
              </Text>
            </G>
          );
        })}
        {data.map((d, i) => {
          const cx = BAR_AREA.left + i * gap + gap / 2;
          const hRev = (d.revenue / maxVal) * plotH;
          const hCost = (d.cost / maxVal) * plotH;
          return (
            <G key={i}>
              <Rect x={cx - barW - 1} y={BAR_AREA.top + plotH - hRev} width={barW} height={hRev} fill={C.primary} rx={2} />
              <Rect x={cx + 1} y={BAR_AREA.top + plotH - hCost} width={barW} height={hCost} fill={C.teal} rx={2} />
              <Text x={cx} y={CHART_H - BAR_AREA.bottom + 12} style={{ fontSize: 5.5, color: C.textMuted }} textAnchor="middle">
                {d.month}
              </Text>
            </G>
          );
        })}
      </Svg>
      <View style={s.legendRow}>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.primary }]} /><Text style={s.legendLabel}>Revenue</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.teal }]} /><Text style={s.legendLabel}>MPS Cost</Text></View>
      </View>
    </View>
  );
}

function SvgDonutChart({ data, title, subtitle }: { data: { name: string; value: number }[]; title: string; subtitle?: string }) {
  if (data.length === 0) return <Text style={s.chartSub}>No data available</Text>;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 90;
  const cy = 90;
  const r = 70;
  const inner = 42;

  // Build arcs
  let startAngle = -90;
  const arcs = data.slice(0, 8).map((d, i) => {
    const pct = d.value / total;
    const sweep = pct * 360;
    const endAngle = startAngle + sweep;
    const largeArc = sweep > 180 ? 1 : 0;
    const toRad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const ix1 = cx + inner * Math.cos(toRad(endAngle));
    const iy1 = cy + inner * Math.sin(toRad(endAngle));
    const ix2 = cx + inner * Math.cos(toRad(startAngle));
    const iy2 = cy + inner * Math.sin(toRad(startAngle));

    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    startAngle = endAngle;

    return { path, color: CHART_PALETTE[i % CHART_PALETTE.length], name: d.name, value: d.value, pct };
  });

  return (
    <View style={s.chartBox}>
      <Text style={s.chartTitle}>{title}</Text>
      {subtitle && <Text style={s.chartSub}>{subtitle}</Text>}
      <View style={{ flexDirection: "row", gap: 20 }}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          {arcs.map((arc, i) => (
            <Path key={i} d={arc.path} fill={arc.color} />
          ))}
          <Circle cx={cx} cy={cy} r={inner - 1} fill={C.white} />
          <Text x={cx} y={cy + 4} style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.text }} textAnchor="middle">
            {fmtNum(total)}
          </Text>
        </Svg>
        <View style={{ flex: 1, justifyContent: "center", gap: 4 }}>
          {arcs.map((arc, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: arc.color }} />
              <Text style={{ fontSize: 7, color: C.text, flex: 1 }}>{arc.name}</Text>
              <Text style={{ fontSize: 7, color: C.textMuted }}>{(arc.pct * 100).toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function SvgProgressList({ data, title, subtitle }: { data: { name: string; tons: number; count: number }[]; title: string; subtitle?: string }) {
  const maxVal = Math.max(...data.map((d) => d.tons), 1);
  const barW = 260;

  return (
    <View style={s.chartBox}>
      <Text style={s.chartTitle}>{title}</Text>
      {subtitle && <Text style={s.chartSub}>{subtitle}</Text>}
      {data.map((d, i) => {
        const pct = d.tons / maxVal;
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <Text style={{ fontSize: 7, color: C.text, width: 130 }}>{d.name}</Text>
            <Svg width={barW} height={12} viewBox={`0 0 ${barW} 12`}>
              <Rect x={0} y={2} width={barW} height={8} fill={C.bg} rx={3} />
              <Rect x={0} y={2} width={Math.max(barW * pct, 4)} height={8} fill={CHART_PALETTE[i % CHART_PALETTE.length]} rx={3} />
            </Svg>
            <Text style={{ fontSize: 7, color: C.textMuted, width: 50, textAlign: "right" }}>{fmtNum(d.tons)} t</Text>
          </View>
        );
      })}
    </View>
  );
}

function SvgWaterfallChart({ data }: { data: ReturnType<typeof computeCostWaterfall> }) {
  if (data.length === 0) return <Text style={s.chartSub}>No data available</Text>;

  // Compute running totals
  let running = 0;
  const items = data.map((d) => {
    if ("isTotal" in d && d.isTotal) {
      return { ...d, start: 0, end: running, value: running };
    }
    const start = running;
    running += d.value;
    return { ...d, start, end: running };
  });

  const allVals = items.flatMap((d) => [d.start, d.end]);
  const minVal = Math.min(...allVals, 0);
  const maxVal = Math.max(...allVals, 1);
  const range = maxVal - minVal || 1;

  const plotW = CHART_W - BAR_AREA.left - BAR_AREA.right;
  const plotH = CHART_H - BAR_AREA.top - BAR_AREA.bottom;
  const gap = plotW / items.length;
  const barW = Math.min(gap * 0.6, 36);

  const toY = (v: number) => BAR_AREA.top + plotH * (1 - (v - minVal) / range);

  return (
    <View style={s.chartBox}>
      <Text style={s.chartTitle}>Cost Waterfall</Text>
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {/* Zero line */}
        <Line x1={BAR_AREA.left} y1={toY(0)} x2={CHART_W - BAR_AREA.right} y2={toY(0)} stroke={C.border} strokeWidth={0.5} />
        {items.map((d, i) => {
          const x = BAR_AREA.left + i * gap + (gap - barW) / 2;
          const y1 = toY(Math.max(d.start, d.end));
          const y2 = toY(Math.min(d.start, d.end));
          const h = Math.max(y2 - y1, 1);
          const isPositive = d.value >= 0;
          const color = "isTotal" in d && d.isTotal ? C.primary : isPositive ? C.success : C.error;

          return (
            <G key={i}>
              <Rect x={x} y={y1} width={barW} height={h} fill={color} rx={2} />
              <Text x={x + barW / 2} y={y1 - 4} style={{ fontSize: 6, color: C.textMuted }} textAnchor="middle">
                {fmtDollar(Math.abs(d.value))}
              </Text>
              <Text x={x + barW / 2} y={CHART_H - BAR_AREA.bottom + 12} style={{ fontSize: 5.5, color: C.textMuted }} textAnchor="middle">
                {d.name}
              </Text>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/* ============================================
   Table Widgets
   ============================================ */

function PdfTable({ columns, rows }: { columns: { key: string; label: string; width: number; align?: string }[]; rows: Record<string, string | number>[] }) {
  const totalW = columns.reduce((sum, c) => sum + c.width, 0);

  return (
    <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: "hidden" }}>
      {/* Header */}
      <View style={s.tableHeader}>
        {columns.map((col) => (
          <Text key={col.key} style={[s.th, { width: `${(col.width / totalW) * 100}%`, textAlign: (col.align as "left" | "right") || "left" }]}>
            {col.label}
          </Text>
        ))}
      </View>
      {/* Rows */}
      {rows.map((row, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 1 ? { backgroundColor: "#FAFAFA" } : {}]} wrap={false}>
          {columns.map((col) => (
            <Text key={col.key} style={[s.td, { width: `${(col.width / totalW) * 100}%`, textAlign: (col.align as "left" | "right") || "left" }]}>
              {String(row[col.key] ?? "")}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function PdfTableShipmentDetail({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const limit = config.tableRowLimit ?? 25;
  const data = shipments.slice(0, limit);

  const columns = [
    { key: "date", label: "Date", width: 70 },
    { key: "site", label: "Site", width: 100 },
    { key: "client", label: "Client", width: 80 },
    { key: "wasteType", label: "Waste Type", width: 110 },
    { key: "weight", label: "Weight (lbs)", width: 70, align: "right" },
    { key: "cost", label: "MPS Cost", width: 65, align: "right" },
    { key: "revenue", label: "Revenue", width: 65, align: "right" },
    { key: "manifest", label: "Manifest #", width: 80 },
    { key: "status", label: "Status", width: 60 },
  ];

  const rows = data.map((sh) => ({
    date: sh.shipmentDate,
    site: sh.siteName,
    client: sh.clientName,
    wasteType: sh.wasteTypeName,
    weight: sh.weightValue.toLocaleString(),
    cost: `$${totalMpsCost(sh).toLocaleString()}`,
    revenue: `$${totalCustomerCost(sh).toLocaleString()}`,
    manifest: sh.manifestNumber || "—",
    status: sh.status,
  }));

  return (
    <View style={s.chartBox}>
      <Text style={s.chartTitle}>Shipment Detail</Text>
      <Text style={s.chartSub}>Showing {data.length} of {shipments.length} records</Text>
      <PdfTable columns={columns} rows={rows} />
    </View>
  );
}

function PdfTableWasteSummary({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const all = computeWasteStreamSummary(shipments);
  const data = all.slice(0, config.tableRowLimit ?? 25);

  const columns = [
    { key: "name", label: "Waste Type", width: 140 },
    { key: "tons", label: "Tons", width: 60, align: "right" },
    { key: "shipments", label: "Shipments", width: 60, align: "right" },
    { key: "cost", label: "MPS Cost", width: 70, align: "right" },
    { key: "revenue", label: "Revenue", width: 70, align: "right" },
    { key: "margin", label: "Margin", width: 70, align: "right" },
  ];

  const rows = data.map((d) => ({
    name: d.name,
    tons: fmtNum(d.tons),
    shipments: String(d.shipments),
    cost: fmtDollar(d.cost),
    revenue: fmtDollar(d.revenue),
    margin: fmtDollar(d.margin),
  }));

  return (
    <View style={s.chartBox}>
      <Text style={s.chartTitle}>Waste Stream Summary</Text>
      <PdfTable columns={columns} rows={rows} />
    </View>
  );
}

function PdfTableCostBySite({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const all = computeCostBySite(shipments);
  const data = all.slice(0, config.tableRowLimit ?? 25);

  const columns = [
    { key: "site", label: "Site", width: 130 },
    { key: "shipments", label: "Shipments", width: 60, align: "right" },
    { key: "tons", label: "Tons", width: 60, align: "right" },
    { key: "cost", label: "MPS Cost", width: 70, align: "right" },
    { key: "revenue", label: "Revenue", width: 70, align: "right" },
    { key: "margin", label: "Margin", width: 70, align: "right" },
  ];

  const rows = data.map((d) => ({
    site: d.site,
    shipments: String(d.shipments),
    tons: fmtNum(d.tons),
    cost: fmtDollar(d.cost),
    revenue: fmtDollar(d.revenue),
    margin: fmtDollar(d.margin),
  }));

  return (
    <View style={s.chartBox}>
      <Text style={s.chartTitle}>Cost Breakdown by Site</Text>
      <PdfTable columns={columns} rows={rows} />
    </View>
  );
}

/* ============================================
   Notes Widget
   ============================================ */

function PdfNotesBlock({ config }: { config: SectionConfig }) {
  return (
    <View style={s.notesBox}>
      <Text style={s.chartTitle}>Notes</Text>
      <Text style={s.notesText}>{config.notes || "No notes added."}</Text>
    </View>
  );
}

/* ============================================
   Section Renderer
   ============================================ */

function PdfSection({ section, shipments }: { section: ReportSection; shipments: Shipment[] }) {
  const { type, config } = section;

  const widget = (() => {
    switch (type) {
      case "kpi-waste-volume": return <PdfKpiWasteVolume shipments={shipments} />;
      case "kpi-cost-summary": return <PdfKpiCostSummary shipments={shipments} />;
      case "kpi-compliance": return <PdfKpiCompliance shipments={shipments} />;
      case "kpi-diversion": return <PdfKpiDiversion shipments={shipments} />;
      case "chart-volume-trend": return <SvgBarChart data={computeMonthlyVolume(shipments)} dataKey="tons" label="Monthly Volume Trend" />;
      case "chart-cost-comparison": return <SvgGroupedBarChart data={computeMonthlyCost(shipments)} />;
      case "chart-waste-donut": return <SvgDonutChart data={computeWasteCategoryDonut(shipments)} title="Waste Distribution" subtitle="By category (tons)" />;
      case "chart-top-streams": return <SvgProgressList data={computeTopStreams(shipments)} title="Top Waste Streams" subtitle="Top 10 by volume" />;
      case "chart-cost-waterfall": return <SvgWaterfallChart data={computeCostWaterfall(shipments)} />;
      case "chart-vendor-spend": return <SvgDonutChart data={computeVendorSpend(shipments)} title="Vendor Spend" subtitle="MPS cost by vendor" />;
      case "table-shipment-detail": return <PdfTableShipmentDetail shipments={shipments} config={config} />;
      case "table-waste-summary": return <PdfTableWasteSummary shipments={shipments} config={config} />;
      case "table-cost-by-site": return <PdfTableCostBySite shipments={shipments} config={config} />;
      case "notes-block": return <PdfNotesBlock config={config} />;
      default: return null;
    }
  })();

  return <View style={s.section} wrap={false}>{widget}</View>;
}

/* ============================================
   Main PDF Document
   ============================================ */

interface ReportPdfDocumentProps {
  title: string;
  filterSummary: string;
  sections: ReportSection[];
  shipments: Shipment[];
}

const timestamp = new Date().toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function ReportPdfDocument({ title, filterSummary, sections, shipments }: ReportPdfDocumentProps) {
  return (
    <Document title={title} author="MPS Platform" creator="MPS Centralized Waste Shipment Platform">
      <Page size="A4" style={s.page}>
        {/* ── Header (fixed on every page) ── */}
        <View style={s.headerRow} fixed>
          <Image src="/logo.png" style={s.logo} />
          <View>
            <Text style={s.headerTitle}>{title || "Untitled Report"}</Text>
            <Text style={s.headerSub}>{filterSummary}</Text>
          </View>
        </View>
        <View style={s.headerRule} fixed />

        {/* ── Sections ── */}
        {sections.map((section) => (
          <PdfSection key={section.id} section={section} shipments={shipments} />
        ))}

        {/* ── Footer (fixed on every page) ── */}
        <View style={s.footer} fixed>
          <Text>MPS Centralized Waste Shipment Platform</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          <Text>Generated {timestamp}</Text>
        </View>
      </Page>
    </Document>
  );
}
