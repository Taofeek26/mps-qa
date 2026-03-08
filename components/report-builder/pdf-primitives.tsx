/* ============================================
   MPS Platform — Shared PDF Primitives
   Reusable react-pdf building blocks for
   KPIs, charts, tables, and layout.
   ============================================ */

import * as React from "react";
import {
  View,
  Text,
  Svg,
  Rect,
  Circle,
  Line,
  G,
  Path,
  StyleSheet,
} from "@react-pdf/renderer";

/* ─── Brand Colors ─── */
export const C = {
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

export const CHART_PALETTE = [
  "#1863DC", "#00B38C", "#C48124", "#B04141",
  "#0E3B84", "#008F70", "#E1A341", "#3F8B65",
];

/* ─── Shared Styles ─── */
export const ps = StyleSheet.create({
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, color: C.text },
  /* KPI */
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
    marginBottom: 10,
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
  /* Legend */
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 2 },
  legendLabel: { fontSize: 7, color: C.textMuted },
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
});

/* ─── Helpers ─── */
export function fmtNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v.toFixed(0);
}
export function fmtDollar(v: number): string { return `$${fmtNum(v)}`; }
export function fmtPct(v: number): string { return `${v.toFixed(1)}%`; }

/* ============================================
   KPI Card
   ============================================ */

export function PdfKpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={ps.kpiCard}>
      <Text style={ps.kpiLabel}>{label}</Text>
      <Text style={ps.kpiValue}>{value}</Text>
      <Text style={ps.kpiSub}>{sub}</Text>
    </View>
  );
}

export function PdfKpiRow({ children }: { children: React.ReactNode }) {
  return <View style={ps.kpiRow}>{children}</View>;
}

/* ============================================
   SVG Bar Chart
   ============================================ */

const CHART_W = 500;
const CHART_H = 180;
const BAR_AREA = { left: 50, right: 20, top: 10, bottom: 30 };

export function PdfBarChart({ data, dataKey, label, subtitle, color, formatter }: {
  data: Record<string, unknown>[];
  dataKey: string;
  label: string;
  subtitle?: string;
  color?: string;
  formatter?: (v: number) => string;
}) {
  if (data.length === 0) return <View style={ps.chartBox}><Text style={ps.chartTitle}>{label}</Text><Text style={ps.chartSub}>No data available</Text></View>;

  const fmt = formatter || fmtNum;
  const values = data.map((d) => Number(d[dataKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const plotW = CHART_W - BAR_AREA.left - BAR_AREA.right;
  const plotH = CHART_H - BAR_AREA.top - BAR_AREA.bottom;
  const barW = Math.min(plotW / data.length * 0.7, 30);
  const gap = plotW / data.length;
  const labelKey = Object.keys(data[0] || {}).find((k) => k !== dataKey) || dataKey;

  return (
    <View style={ps.chartBox}>
      <Text style={ps.chartTitle}>{label}</Text>
      {subtitle && <Text style={ps.chartSub}>{subtitle}</Text>}
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = BAR_AREA.top + plotH * (1 - pct);
          return (
            <G key={pct}>
              <Line x1={BAR_AREA.left} y1={y} x2={CHART_W - BAR_AREA.right} y2={y} stroke={C.border} strokeWidth={0.5} />
              <Text x={BAR_AREA.left - 4} y={y + 3} style={{ fontSize: 6, color: C.textMuted }} textAnchor="end">
                {fmt(maxVal * pct)}
              </Text>
            </G>
          );
        })}
        {data.map((d, i) => {
          const val = Number(d[dataKey]) || 0;
          const h = (val / maxVal) * plotH;
          const x = BAR_AREA.left + i * gap + (gap - barW) / 2;
          const y = BAR_AREA.top + plotH - h;
          return (
            <G key={i}>
              <Rect x={x} y={y} width={barW} height={h} fill={color || C.primary} rx={2} />
              <Text x={x + barW / 2} y={CHART_H - BAR_AREA.bottom + 12} style={{ fontSize: 5.5, color: C.textMuted }} textAnchor="middle">
                {String(d[labelKey] ?? "").substring(0, 12)}
              </Text>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/* ============================================
   SVG Grouped Bar Chart
   ============================================ */

export function PdfGroupedBarChart({ data, keys, labels, colors, title, subtitle, labelKey, formatter }: {
  data: Record<string, unknown>[];
  keys: string[];
  labels: string[];
  colors: string[];
  title: string;
  subtitle?: string;
  labelKey: string;
  formatter?: (v: number) => string;
}) {
  if (data.length === 0) return <View style={ps.chartBox}><Text style={ps.chartTitle}>{title}</Text><Text style={ps.chartSub}>No data available</Text></View>;

  const fmt = formatter || fmtNum;
  const maxVal = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k]) || 0)), 1);
  const plotW = CHART_W - BAR_AREA.left - BAR_AREA.right;
  const plotH = CHART_H - BAR_AREA.top - BAR_AREA.bottom;
  const gap = plotW / data.length;
  const barW = Math.min(gap * 0.35 / (keys.length / 2), 14);

  return (
    <View style={ps.chartBox}>
      <Text style={ps.chartTitle}>{title}</Text>
      {subtitle && <Text style={ps.chartSub}>{subtitle}</Text>}
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = BAR_AREA.top + plotH * (1 - pct);
          return (
            <G key={pct}>
              <Line x1={BAR_AREA.left} y1={y} x2={CHART_W - BAR_AREA.right} y2={y} stroke={C.border} strokeWidth={0.5} />
              <Text x={BAR_AREA.left - 4} y={y + 3} style={{ fontSize: 6, color: C.textMuted }} textAnchor="end">
                {fmt(maxVal * pct)}
              </Text>
            </G>
          );
        })}
        {data.map((d, i) => {
          const cx = BAR_AREA.left + i * gap + gap / 2;
          const totalW = barW * keys.length + (keys.length - 1) * 2;
          const startX = cx - totalW / 2;
          return (
            <G key={i}>
              {keys.map((k, ki) => {
                const val = Number(d[k]) || 0;
                const h = (val / maxVal) * plotH;
                return (
                  <Rect key={ki} x={startX + ki * (barW + 2)} y={BAR_AREA.top + plotH - h} width={barW} height={h} fill={colors[ki]} rx={2} />
                );
              })}
              <Text x={cx} y={CHART_H - BAR_AREA.bottom + 12} style={{ fontSize: 5.5, color: C.textMuted }} textAnchor="middle">
                {String(d[labelKey] ?? "").substring(0, 12)}
              </Text>
            </G>
          );
        })}
      </Svg>
      <View style={ps.legendRow}>
        {labels.map((lbl, i) => (
          <View key={i} style={ps.legendItem}><View style={[ps.legendDot, { backgroundColor: colors[i] }]} /><Text style={ps.legendLabel}>{lbl}</Text></View>
        ))}
      </View>
    </View>
  );
}

/* ============================================
   SVG Donut Chart
   ============================================ */

export function PdfDonutChart({ data, title, subtitle }: { data: { name: string; value: number }[]; title: string; subtitle?: string }) {
  if (data.length === 0) return <View style={ps.chartBox}><Text style={ps.chartTitle}>{title}</Text><Text style={ps.chartSub}>No data available</Text></View>;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 90, cy = 90, r = 70, inner = 42;

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
    return { path, color: CHART_PALETTE[i % CHART_PALETTE.length], name: d.name, pct };
  });

  return (
    <View style={ps.chartBox}>
      <Text style={ps.chartTitle}>{title}</Text>
      {subtitle && <Text style={ps.chartSub}>{subtitle}</Text>}
      <View style={{ flexDirection: "row", gap: 20 }}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          {arcs.map((arc, i) => <Path key={i} d={arc.path} fill={arc.color} />)}
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

/* ============================================
   SVG Progress List (Horizontal Bars)
   ============================================ */

export function PdfProgressList({ data, title, subtitle, valueFormatter }: {
  data: { name: string; value: number }[];
  title: string;
  subtitle?: string;
  valueFormatter?: (v: number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = 260;
  const fmt = valueFormatter || ((v: number) => fmtNum(v));

  return (
    <View style={ps.chartBox}>
      <Text style={ps.chartTitle}>{title}</Text>
      {subtitle && <Text style={ps.chartSub}>{subtitle}</Text>}
      {data.slice(0, 10).map((d, i) => {
        const pct = d.value / maxVal;
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <Text style={{ fontSize: 7, color: C.text, width: 130 }}>{d.name}</Text>
            <Svg width={barW} height={12} viewBox={`0 0 ${barW} 12`}>
              <Rect x={0} y={2} width={barW} height={8} fill={C.bg} rx={3} />
              <Rect x={0} y={2} width={Math.max(barW * pct, 4)} height={8} fill={CHART_PALETTE[i % CHART_PALETTE.length]} rx={3} />
            </Svg>
            <Text style={{ fontSize: 7, color: C.textMuted, width: 50, textAlign: "right" }}>{fmt(d.value)}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ============================================
   SVG Waterfall Chart
   ============================================ */

export function PdfWaterfallChart({ data, title, subtitle }: {
  data: { name: string; value: number; isTotal?: boolean }[];
  title: string;
  subtitle?: string;
}) {
  if (data.length === 0) return <View style={ps.chartBox}><Text style={ps.chartTitle}>{title}</Text><Text style={ps.chartSub}>No data available</Text></View>;

  let running = 0;
  const items = data.map((d) => {
    if (d.isTotal) return { ...d, start: 0, end: running, value: running };
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
    <View style={ps.chartBox}>
      <Text style={ps.chartTitle}>{title}</Text>
      {subtitle && <Text style={ps.chartSub}>{subtitle}</Text>}
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <Line x1={BAR_AREA.left} y1={toY(0)} x2={CHART_W - BAR_AREA.right} y2={toY(0)} stroke={C.border} strokeWidth={0.5} />
        {items.map((d, i) => {
          const x = BAR_AREA.left + i * gap + (gap - barW) / 2;
          const y1 = toY(Math.max(d.start, d.end));
          const y2 = toY(Math.min(d.start, d.end));
          const h = Math.max(y2 - y1, 1);
          const color = d.isTotal ? C.primary : d.value >= 0 ? C.success : C.error;
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
   PDF Table
   ============================================ */

export function PdfTable({ title, subtitle, columns, rows }: {
  title?: string;
  subtitle?: string;
  columns: { key: string; label: string; width: number; align?: string }[];
  rows: Record<string, string | number>[];
}) {
  const totalW = columns.reduce((sum, c) => sum + c.width, 0);

  return (
    <View style={ps.chartBox} wrap={false}>
      {title && <Text style={ps.chartTitle}>{title}</Text>}
      {subtitle && <Text style={ps.chartSub}>{subtitle}</Text>}
      <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: "hidden" }}>
        <View style={ps.tableHeader}>
          {columns.map((col) => (
            <Text key={col.key} style={[ps.th, { width: `${(col.width / totalW) * 100}%`, textAlign: (col.align as "left" | "right") || "left" }]}>
              {col.label}
            </Text>
          ))}
        </View>
        {rows.map((row, i) => (
          <View key={i} style={[ps.tableRow, i % 2 === 1 ? { backgroundColor: "#FAFAFA" } : {}]} wrap={false}>
            {columns.map((col) => (
              <Text key={col.key} style={[ps.td, { width: `${(col.width / totalW) * 100}%`, textAlign: (col.align as "left" | "right") || "left" }]}>
                {String(row[col.key] ?? "")}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/* ============================================
   Section Title
   ============================================ */

export function PdfSectionTitle({ children }: { children: string }) {
  return <Text style={ps.sectionTitle}>{children}</Text>;
}
