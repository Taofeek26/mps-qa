"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import { Bar as ChartBar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, ChartLegend);
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  Treemap as RechartsTreemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Truck,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Recycle,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DataTable } from "@/components/ui/data-table";
import {
  PillTabs,
  PillTabsList,
  PillTabsTrigger,
  PillTabsContent,
} from "@/components/ui/pill-tabs";
import {
  ChartContainer,
  CATEGORY_COLORS,
  CHART_COLORS,
  TOOLTIP_STYLE,
  WaterfallChart,
  DonutChart,
  ProgressList,
} from "@/components/charts";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/lib/types";
import {
  getMonthKey,
  formatMonthLabel,
  totalMpsCost,
  totalCustomerCost,
  downloadCsv,
  getNetTonMargin,
  getRecyclablesRevenuePerTon,
} from "@/lib/report-utils";
import { getInvoiceRecords } from "@/lib/mock-kpi-data";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";


/* ---- Heatmap Cell ---- */

function HeatmapCell({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) {
  const range = Math.max(Math.abs(min), Math.abs(max), 1);
  const normalized = value / range;
  const intensity = Math.min(Math.abs(normalized), 1);

  let bg: string;
  let text: string;

  if (value > 0) {
    // Green scale — interpolate opacity from success-100 to success-400
    bg = intensity > 0.5
      ? "var(--color-success-400)"
      : "var(--color-success-100)";
    text = intensity > 0.5
      ? "#FFFFFF"
      : "var(--color-success-600)";
  } else if (value < 0) {
    // Red scale
    bg = intensity > 0.5
      ? "var(--color-error-400)"
      : "var(--color-error-100)";
    text = intensity > 0.5
      ? "#FFFFFF"
      : "var(--color-error-600)";
  } else {
    bg = "var(--color-bg-subtle)";
    text = "var(--color-text-muted)";
  }

  return (
    <div
      className="flex items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium tabular-nums"
      style={{ backgroundColor: bg, color: text }}
    >
      ${Math.abs(value).toLocaleString()}
    </div>
  );
}

/* ---- Bullet Chart (Chart.js) ---- */

function BulletChart({
  data,
  formatValue,
}: {
  data: Array<{ name: string; actual: number; target: number }>;
  formatValue: (v: number) => string;
}) {
  const rawMax = Math.max(...data.map((d) => Math.max(d.actual, d.target)), 1);
  const maxVal = Math.ceil(rawMax / 50000) * 50000;

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: "Poor",
        data: data.map(() => maxVal),
        backgroundColor: "#F1F5F9",
        barPercentage: 0.85,
        categoryPercentage: 0.8,
        borderRadius: 3,
      },
      {
        label: "Satisfactory",
        data: data.map(() => maxVal * 0.75),
        backgroundColor: "#E2E8F0",
        barPercentage: 0.85,
        categoryPercentage: 0.8,
        borderRadius: 3,
      },
      {
        label: "Good",
        data: data.map(() => maxVal * 0.5),
        backgroundColor: "#CBD5E1",
        barPercentage: 0.85,
        categoryPercentage: 0.8,
        borderRadius: 3,
      },
      {
        label: "Actual",
        data: data.map((d) => d.actual),
        backgroundColor: "#00BD9D",
        barPercentage: 0.4,
        categoryPercentage: 0.8,
        borderRadius: 2,
      },
      {
        label: "Target",
        data: data.map((d) => d.target),
        backgroundColor: "#0F172A",
        barPercentage: 0.03,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        max: maxVal,
        grid: { color: "#F3F4F6" },
        ticks: {
          callback: (v: number | string) => formatValue(Number(v)),
          font: { size: 10, family: "Inter, system-ui, sans-serif" },
          color: "#64748B",
        },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: "Inter, system-ui, sans-serif" },
          color: "#475569",
        },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#FFFFFF",
        titleColor: "#0F172A",
        bodyColor: "#475569",
        borderColor: "#F3F4F6",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12, weight: "bold" as const },
        bodyFont: { size: 11 },
        filter: (item: { datasetIndex: number }) => item.datasetIndex >= 3,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) =>
            `${ctx.dataset.label ?? ""}: ${formatValue(ctx.parsed.x)}`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelColor: (ctx: any) => ({
            borderColor: ctx.datasetIndex === 4 ? "#0F172A" : "#00BD9D",
            backgroundColor: ctx.datasetIndex === 4 ? "#0F172A" : "#00BD9D",
          }),
        },
      },
    },
  };

  const chartH = Math.max(data.length * 60 + 30, 120);

  return (
    <div>
      <div style={{ height: chartH }}>
        <ChartBar data={chartData} options={options} />
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {[
          { label: "Actual", color: "#00BD9D", w: 12, h: 10 },
          { label: "Target", color: "#0F172A", w: 2, h: 12 },
          { label: "Good", color: "#CBD5E1", w: 12, h: 10 },
          { label: "Satisfactory", color: "#E2E8F0", w: 12, h: 10 },
          { label: "Poor", color: "#F1F5F9", w: 12, h: 10 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="shrink-0 rounded-sm"
              style={{ width: item.w, height: item.h, backgroundColor: item.color, display: "block" }}
            />
            <span className="text-[10px] text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

function fmtExact(v: number): string {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ---- Content ---- */

export function CostAnalysisContent() {
  const {
    clients,
    filteredSites,
    dateRange,
    setDateRange,
    clientId,
    setClientId,
    siteId,
    setSiteId,
    hasFilters,
    resetFilters,
    shipments,
    transporterName,
    setTransporterName,
    transporterOptions,
    wasteStreamName,
    setWasteStreamName,
    wasteStreamOptions,
  } = useReportFilters();

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [txnPage, setTxnPage] = React.useState(1);
  const hasData = shipments.length > 0;

  const filterSummary = [clientId && "Customer filtered", siteId && "Site filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("cost-analysis", shipments, filterSummary);

  React.useEffect(() => {
    setTxnPage(1);
  }, [shipments]);

  /* ---- KPI totals ---- */

  const totals = React.useMemo(() => {
    let mpsCostTotal = 0,
      custCostTotal = 0,
      totalRebate = 0,
      totalVolume = 0,
      totalHaul = 0;
    shipments.forEach((s) => {
      mpsCostTotal += totalMpsCost(s);
      custCostTotal += totalCustomerCost(s);
      totalRebate += s.customerCost?.rebate ?? 0;
      totalVolume += s.weightValue;
      if (s.mpsCost) totalHaul += s.mpsCost.haulCharge;
    });
    const costPerTon =
      totalVolume > 0 ? mpsCostTotal / (totalVolume / 2000) : 0;
    const haulPct = mpsCostTotal > 0 ? (totalHaul / mpsCostTotal) * 100 : 0;
    return { mpsCostTotal, custCostTotal, totalRebate, costPerTon, totalHaul, haulPct };
  }, [shipments]);

  /* ---- Net Ton Margin KPI ---- */

  const netTonMargin = React.useMemo(() => getNetTonMargin(shipments), [shipments]);

  /* ---- Recyclables Revenue/Ton KPI ---- */

  const recyclablesRevPerTon = React.useMemo(() => getRecyclablesRevenuePerTon(shipments), [shipments]);

  /* ---- Monthly cost trend (Revenue vs Cost) ---- */

  const monthlyCost = React.useMemo(() => {
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
  }, [shipments]);

  /* ---- Vendor Margin Spread (margin per waste stream) ---- */

  const marginByStream = React.useMemo(() => {
    const byType = new Map<string, { rev: number; cost: number }>();
    shipments.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? { rev: 0, cost: 0 };
      existing.rev += totalCustomerCost(s);
      existing.cost += totalMpsCost(s);
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name: name.length > 22 ? name.slice(0, 20) + "\u2026" : name,
        margin: Math.round(d.rev - d.cost),
      }))
      .sort((a, b) => a.margin - b.margin);
  }, [shipments]);

  /* ---- Haul vs Disposal Split (donut) ---- */

  const haulDisposalData = React.useMemo(() => {
    let haul = 0, disposal = 0, fuel = 0, other = 0;
    shipments.forEach((s) => {
      if (s.mpsCost) {
        haul += s.mpsCost.haulCharge;
        disposal += s.mpsCost.disposalFeeTotal;
        fuel += s.mpsCost.fuelFee;
        other += s.mpsCost.environmentalFee + s.mpsCost.otherFees;
      }
    });
    return [
      { name: "Haul", value: Math.round(haul) },
      { name: "Disposal", value: Math.round(disposal) },
      { name: "Fuel", value: Math.round(fuel) },
      { name: "Other", value: Math.round(other) },
    ].filter((d) => d.value > 0);
  }, [shipments]);

  /* ---- Cost per ton by waste stream ---- */

  const costByStream = React.useMemo(() => {
    const byType = new Map<string, { cost: number; volume: number }>();
    shipments.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? { cost: 0, volume: 0 };
      existing.cost += totalMpsCost(s);
      existing.volume += s.weightValue;
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name,
        costPerTon:
          d.volume > 0
            ? Math.round((d.cost / (d.volume / 2000)) * 100) / 100
            : 0,
        totalCost: Math.round(d.cost),
      }))
      .sort((a, b) => b.costPerTon - a.costPerTon)
      .slice(0, 10);
  }, [shipments]);

  /* ---- Rebate realization ---- */

  const rebateData = React.useMemo(() => {
    const byType = new Map<string, { actual: number; volume: number }>();
    shipments.forEach((s) => {
      const rebate = s.customerCost?.rebate ?? 0;
      if (rebate > 0) {
        const existing = byType.get(s.wasteTypeName) ?? { actual: 0, volume: 0 };
        existing.actual += rebate;
        existing.volume += s.weightValue;
        byType.set(s.wasteTypeName, existing);
      }
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name,
        actual: Math.round(d.actual),
        target: Math.round(d.actual * 1.3),
      }))
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 8);
  }, [shipments]);

  /* ---- Cost by Transporter ---- */

  const costByTransporter = React.useMemo(() => {
    const byT = new Map<string, { cost: number; count: number }>();
    shipments.forEach((s) => {
      const name = s.transporterName ?? "Unknown";
      const existing = byT.get(name) ?? { cost: 0, count: 0 };
      existing.cost += totalMpsCost(s);
      existing.count += 1;
      byT.set(name, existing);
    });
    return Array.from(byT.entries())
      .map(([label, d]) => ({
        label,
        value: d.cost,
        displayValue: `${fmt(d.cost)} \u00b7 ${d.count} trips`,
        color: "var(--color-error-500)",
      }))
      .sort((a, b) => b.value - a.value);
  }, [shipments]);

  /* ---- Cost by Site ---- */

  const costBySite = React.useMemo(() => {
    const byS = new Map<string, { cost: number; rev: number }>();
    shipments.forEach((s) => {
      const existing = byS.get(s.siteName) ?? { cost: 0, rev: 0 };
      existing.cost += totalMpsCost(s);
      existing.rev += totalCustomerCost(s);
      byS.set(s.siteName, existing);
    });
    return Array.from(byS.entries())
      .map(([label, d]) => ({
        label,
        value: d.cost,
        displayValue: `Cost: ${fmt(d.cost)} | Rev: ${fmt(d.rev)}`,
        color: "var(--color-primary-400)",
      }))
      .sort((a, b) => b.value - a.value);
  }, [shipments]);

  /* ---- Margin Waterfall (from Financial) ---- */

  const waterfallData = React.useMemo(() => {
    let haul = 0, disposal = 0, fuel = 0, env = 0, rebate = 0;
    shipments.forEach((s) => {
      if (s.mpsCost) {
        haul += s.mpsCost.haulCharge;
        disposal += s.mpsCost.disposalFeeTotal;
        fuel += s.mpsCost.fuelFee;
        env += s.mpsCost.environmentalFee;
      }
      rebate += s.customerCost?.rebate ?? 0;
    });
    return [
      { name: "Revenue", value: Math.round(totals.custCostTotal) },
      { name: "Haul", value: -Math.round(haul) },
      { name: "Disposal", value: -Math.round(disposal) },
      { name: "Fuel", value: -Math.round(fuel) },
      { name: "Env Fees", value: -Math.round(env) },
      { name: "Rebates", value: Math.round(rebate) },
      { name: "Net Margin", value: 0, isTotal: true },
    ];
  }, [shipments, totals.custCostTotal]);

  /* ---- Stacked Cost Composition (from Financial) ---- */

  const monthlyCostStack = React.useMemo(() => {
    const byMonth = new Map<
      string,
      { haul: number; disposal: number; fuel: number; env: number; other: number }
    >();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) ?? { haul: 0, disposal: 0, fuel: 0, env: 0, other: 0 };
      if (s.mpsCost) {
        existing.haul += s.mpsCost.haulCharge;
        existing.disposal += s.mpsCost.disposalFeeTotal;
        existing.fuel += s.mpsCost.fuelFee;
        existing.env += s.mpsCost.environmentalFee;
        existing.other += s.mpsCost.otherFees;
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
        Environmental: Math.round(d.env),
        Other: Math.round(d.other),
      }));
  }, [shipments]);

  /* ---- Margin Heatmap (from Financial) ---- */

  const heatmapData = React.useMemo(() => {
    const siteCols = new Set<string>();
    const wasteRows = new Map<string, Map<string, number>>();

    shipments.forEach((s) => {
      const site = s.siteName;
      const waste = s.wasteTypeName;
      siteCols.add(site);
      if (!wasteRows.has(waste)) wasteRows.set(waste, new Map());
      const existing = wasteRows.get(waste)!.get(site) ?? 0;
      const margin = totalCustomerCost(s) - totalMpsCost(s);
      wasteRows.get(waste)!.set(site, existing + margin);
    });

    const sites = Array.from(siteCols).sort();
    const rows = Array.from(wasteRows.entries())
      .map(([waste, siteMap]) => {
        const row: Record<string, number | string> = { waste };
        let rowTotal = 0;
        sites.forEach((s) => {
          const val = Math.round(siteMap.get(s) ?? 0);
          row[s] = val;
          rowTotal += val;
        });
        row._total = rowTotal;
        return row;
      })
      .sort((a, b) => (b._total as number) - (a._total as number))
      .slice(0, 10);

    let min = 0, max = 0;
    rows.forEach((row) => {
      sites.forEach((s) => {
        const val = row[s] as number;
        if (val < min) min = val;
        if (val > max) max = val;
      });
    });

    return { sites, rows, min, max };
  }, [shipments]);

  /* ---- True Margin / Profit per Route ---- */

  const routeMarginData = React.useMemo(() => {
    const byRoute = new Map<string, { count: number; rev: number; cost: number }>();
    shipments.forEach((s) => {
      const route = `${s.siteName} \u2192 ${s.transporterName || "Unknown"}`;
      const existing = byRoute.get(route) ?? { count: 0, rev: 0, cost: 0 };
      existing.count += 1;
      existing.rev += totalCustomerCost(s);
      existing.cost += totalMpsCost(s);
      byRoute.set(route, existing);
    });
    return Array.from(byRoute.entries())
      .map(([route, d]) => ({
        route,
        shipments: d.count,
        revenue: Math.round(d.rev),
        cost: Math.round(d.cost),
        margin: Math.round(d.rev - d.cost),
        marginPct: d.rev > 0 ? Math.round(((d.rev - d.cost) / d.rev) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.margin - a.margin);
  }, [shipments]);

  /* ---- Subcontractor / Vendor Spend (horizontal bar) ---- */

  const vendorSpendData = React.useMemo(() => {
    const byVendor = new Map<string, number>();
    shipments.forEach((s) => {
      const name = s.vendorName ?? s.transporterName ?? "Unknown";
      byVendor.set(name, (byVendor.get(name) ?? 0) + totalMpsCost(s));
    });
    return Array.from(byVendor.entries())
      .map(([name, cost]) => ({
        name: name.length > 22 ? name.slice(0, 20) + "\u2026" : name,
        cost: Math.round(cost),
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [shipments]);

  /* ---- AR Aging ---- */

  const arAgingData = React.useMemo(() => {
    const invoices = getInvoiceRecords();
    const today = new Date();
    const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };

    invoices.forEach((inv) => {
      if (inv.paidDate) return; // Already paid
      const dueDate = new Date(inv.dueDate + "T00:00:00");
      const daysOutstanding = Math.max(0, Math.round((today.getTime() - dueDate.getTime()) / 86400000));
      if (daysOutstanding <= 30) buckets["0-30"] += inv.amount;
      else if (daysOutstanding <= 60) buckets["31-60"] += inv.amount;
      else if (daysOutstanding <= 90) buckets["61-90"] += inv.amount;
      else buckets["90+"] += inv.amount;
    });

    return Object.entries(buckets).map(([bucket, amount]) => ({
      bucket,
      amount: Math.round(amount),
    }));
  }, []);

  /* ---- Operational Cost Reduction % ---- */

  const costReduction = React.useMemo(() => {
    if (shipments.length === 0) return { pct: 0, direction: "down" as const };

    const sorted = [...shipments].sort((a, b) => a.shipmentDate.localeCompare(b.shipmentDate));
    const midIdx = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midIdx);
    const secondHalf = sorted.slice(midIdx);

    let firstCost = 0, secondCost = 0;
    firstHalf.forEach((s) => { firstCost += totalMpsCost(s); });
    secondHalf.forEach((s) => { secondCost += totalMpsCost(s); });

    const pct = firstCost > 0 ? Math.round(((firstCost - secondCost) / firstCost) * 1000) / 10 : 0;
    return { pct, direction: pct >= 0 ? "down" as const : "up" as const };
  }, [shipments]);

  const costReductionSparkline = React.useMemo(() => {
    const byMonth = new Map<string, number>();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      byMonth.set(key, (byMonth.get(key) ?? 0) + totalMpsCost(s));
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, cost]) => ({ month: formatMonthLabel(key), cost: Math.round(cost) }));
  }, [shipments]);

  /* ---- Dumping Summary Cost (donut by waste type) ---- */

  const dumpingCostData = React.useMemo(() => {
    const byType = new Map<string, number>();
    shipments.forEach((s) => {
      if (s.mpsCost) {
        byType.set(s.wasteTypeName, (byType.get(s.wasteTypeName) ?? 0) + s.mpsCost.disposalFeeTotal);
      }
    });
    const sorted = Array.from(byType.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 8) return sorted;
    const top8 = sorted.slice(0, 8);
    const otherSum = sorted.slice(8).reduce((sum, d) => sum + d.value, 0);
    return [...top8, { name: "Other", value: otherSum }];
  }, [shipments]);

  /* ---- Route Margin Table Columns ---- */

  const routeMarginColumns: ColumnDef<typeof routeMarginData[number], unknown>[] = React.useMemo(
    () => [
      { accessorKey: "route", header: "Route" },
      {
        accessorKey: "shipments",
        header: "Shipments",
        meta: { align: "center" },
      },
      {
        accessorKey: "revenue",
        header: "Revenue",
        meta: { align: "center" },
        cell: ({ row }) => fmtExact(row.original.revenue),
      },
      {
        accessorKey: "cost",
        header: "Cost",
        meta: { align: "center" },
        cell: ({ row }) => fmtExact(row.original.cost),
      },
      {
        accessorKey: "margin",
        header: "Margin ($)",
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className={row.original.margin >= 0 ? "text-success-600" : "text-error-600"}>
            {fmtExact(row.original.margin)}
          </span>
        ),
      },
      {
        accessorKey: "marginPct",
        header: "Margin %",
        meta: { align: "center" },
        cell: ({ row }) => (
          <span className={row.original.marginPct >= 0 ? "text-success-600" : "text-error-600"}>
            {row.original.marginPct.toFixed(1)}%
          </span>
        ),
      },
    ],
    []
  );

  /* ---- Transaction Table Columns ---- */

  const txnColumns: ColumnDef<Shipment, unknown>[] = React.useMemo(
    () => [
      { accessorKey: "shipmentDate", header: "Date" },
      { accessorKey: "siteName", header: "Site" },
      { accessorKey: "wasteTypeName", header: "Waste Type" },
      {
        id: "custRevenue",
        header: "Revenue",
        meta: { align: "center" },
        cell: ({ row }) => fmtExact(totalCustomerCost(row.original)),
      },
      {
        id: "mpsCost",
        header: "MPS Cost",
        meta: { align: "center" },
        cell: ({ row }) => fmtExact(totalMpsCost(row.original)),
      },
      {
        id: "margin",
        header: "Margin",
        meta: { align: "center" },
        cell: ({ row }) => {
          const margin = totalCustomerCost(row.original) - totalMpsCost(row.original);
          return (
            <span className={margin >= 0 ? "text-success-600" : "text-error-600"}>
              {fmtExact(margin)}
            </span>
          );
        },
      },
      {
        id: "rebate",
        header: "Rebate",
        meta: { align: "center" },
        cell: ({ row }) => fmtExact(row.original.customerCost?.rebate ?? 0),
      },
    ],
    []
  );

  const costStackCategories = ["Haul", "Disposal", "Fuel", "Environmental", "Other"];

  /* ---- Route margin table pagination ---- */

  const routeTableRef = React.useRef<HTMLDivElement>(null);
  const routePageSize = useAutoPageSize(routeTableRef);
  const [routePage, setRoutePage] = React.useState(1);

  React.useEffect(() => {
    setRoutePage(1);
  }, [shipments]);

  /* ---- CSV export ---- */

  const handleExport = () => {
    const headers = ["Month", "Revenue", "Cost"];
    const rows = monthlyCost.map((d) => [
      d.month,
      `$${d.revenue}`,
      `$${d.cost}`,
    ]);
    downloadCsv("Cost_Analysis_Report.csv", headers, rows);
  };

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Total Revenue"
            value={fmt(totals.custCostTotal)}
            subtitle="Customer billed"
            icon={DollarSign}
          />
          <KpiCard
            title="Total Cost"
            value={fmt(totals.mpsCostTotal)}
            subtitle="MPS platform cost"
            icon={TrendingUp}
            variant="error"
          />
          <KpiCard
            title="Cost Per Ton"
            value={fmt(totals.costPerTon)}
            subtitle="Blended CPT"
            icon={DollarSign}
          />
          <KpiCard
            title="Net $/Ton"
            value={`$${netTonMargin.toFixed(0)}`}
            subtitle="Margin per ton"
            icon={TrendingUp}
            variant={netTonMargin >= 0 ? "success" : "error"}
          />
        </>
      }
      filters={
        <>
          <DateRangePicker
            from={dateRange?.from}
            to={dateRange?.to}
            onChange={setDateRange}
            presets={REPORT_PRESETS}
            placeholder="All time"
            className="w-full sm:w-[220px]"
          />
          <SearchableSelect
            options={[
              { value: "all", label: "All Customers" },
              ...clients.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={clientId || "all"}
            onChange={setClientId}
            placeholder="All Customers"
            className="w-full sm:w-[200px]"
          />
          <SearchableSelect
            options={[
              { value: "all", label: "All Sites" },
              ...filteredSites.map((s) => ({ value: s.id, label: s.name })),
            ]}
            value={siteId || "all"}
            onChange={setSiteId}
            placeholder="All Sites"
            className="w-full sm:w-[200px]"
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </>
      }
      moreFilters={
        <>
          <SearchableSelect
            options={[
              { value: "all", label: "All Transporters" },
              ...transporterOptions.map((t) => ({ value: t, label: t })),
            ]}
            value={transporterName || "all"}
            onChange={setTransporterName}
            placeholder="All Transporters"
            className="w-full sm:w-[200px]"
          />
          <SearchableSelect
            options={[
              { value: "all", label: "All Waste Streams" },
              ...wasteStreamOptions.map((w) => ({ value: w, label: w })),
            ]}
            value={wasteStreamName || "all"}
            onChange={setWasteStreamName}
            placeholder="All Waste Streams"
            className="w-full sm:w-[200px]"
          />
        </>
      }
      onExport={handleExport}
      exportDisabled={!hasData}
      onExportPdf={handleExportPdf}
      isPdfExporting={isPdfExporting}
      onResetFilters={resetFilters}
      hasFilters={hasFilters}
    >
      {hasData ? (
        <PillTabs defaultValue="trends">
          <PillTabsList>
            <PillTabsTrigger value="trends">Trends & Margins</PillTabsTrigger>
            <PillTabsTrigger value="breakdown">Cost Breakdown</PillTabsTrigger>
            <PillTabsTrigger value="rankings">Rankings & Heatmap</PillTabsTrigger>
            <PillTabsTrigger value="commercial">Commercial</PillTabsTrigger>
            <PillTabsTrigger value="transactions" count={shipments.length}>Transactions</PillTabsTrigger>
          </PillTabsList>

          {/* Tab 1: Revenue vs Cost Trend + Vendor Margin Spread */}
          <PillTabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Revenue vs Cost Trend"
                subtitle="Monthly dual-line comparison"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyCost}
                    margin={{ top: 5, right: 40, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={CATEGORY_COLORS[0]}
                      fill="rgba(24,99,220,.05)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      name="Cost"
                      stroke="var(--color-error-500)"
                      fill="rgba(239,68,68,.05)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer
                title="Vendor Margin Spread"
                subtitle="Revenue minus cost per waste stream — red = loss"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={marginByStream}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "Margin",
                      ]}
                    />
                    <Bar dataKey="margin" name="Margin" radius={[4, 4, 0, 0]}>
                      {marginByStream.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.margin < 0
                              ? "var(--color-error-500)"
                              : "var(--color-teal-400)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Tab 2: Waterfall + Stacked Composition + Donut + CPT + Rebate */}
          <PillTabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Margin Waterfall"
                subtitle="How customer revenue flows to net margin"
              >
                <WaterfallChart
                  data={waterfallData}
                  valueFormatter={(v) => `$${Math.abs(v).toLocaleString()}`}
                />
              </ChartContainer>

              <ChartContainer
                title="MPS Cost Composition"
                subtitle="Monthly cost breakdown by category"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyCostStack} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {costStackCategories.map((cat, idx) => (
                      <Area
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        stackId="cost"
                        stroke={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                        fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                        fillOpacity={0.6}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Haul vs Disposal Split"
                subtitle="Transportation vs processing cost breakdown"
                chartClassName="h-auto"
              >
                <ResponsiveContainer width="100%" aspect={1.8}>
                  <RechartsTreemap
                    data={haulDisposalData}
                    dataKey="value"
                    nameKey="name"
                    stroke="var(--color-border-default)"
                    isAnimationActive={false}
                    content={({ x, y, width, height, name, value, index }: { x: number; y: number; width: number; height: number; name: string; value: number; index: number }) => {
                      const colors = ["var(--color-warning-500)", "var(--color-primary-400)", "var(--color-error-500)", "var(--color-text-muted)"];
                      if (width < 2 || height < 2) return <g />;
                      const showBoth = width > 45 && height > 32;
                      const showName = width > 30 && height > 18;
                      return (
                        <g>
                          <rect x={x} y={y} width={width} height={height} rx={4} fill={colors[index % colors.length]} stroke="var(--color-bg-card)" strokeWidth={2} />
                          {showBoth ? (
                            <>
                              <text x={x + width / 2} y={y + height / 2 - 7} textAnchor="middle" fill="#fff" fontSize={Math.min(13, width / 5)} style={{ fontWeight: 400, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.03em", textRendering: "geometricPrecision" }}>{name}</text>
                              <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={Math.min(11, width / 6)} fontFamily="Inter, system-ui, sans-serif" style={{ textRendering: "geometricPrecision" }}>{fmt(value)}</text>
                            </>
                          ) : showName ? (
                            <text x={x + width / 2} y={y + height / 2 + 1} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={Math.min(11, width / 4)} style={{ fontWeight: 400, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.03em", textRendering: "geometricPrecision" }}>{name}</text>
                          ) : null}
                        </g>
                      );
                    }}
                  />
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-3">
                  {haulDisposalData.map((d, i) => {
                    const colors = ["var(--color-warning-500)", "var(--color-primary-400)", "var(--color-error-500)", "var(--color-text-muted)"];
                    return (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span className="shrink-0 rounded-sm" style={{ width: 12, height: 10, backgroundColor: colors[i % colors.length], display: "block" }} />
                        <span className="text-[10px] text-text-muted">{d.name}</span>
                      </div>
                    );
                  })}
                </div>
              </ChartContainer>

              <ChartContainer
                title="Cost per Ton by Waste Stream"
                subtitle="Top 10 most expensive streams"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={costByStream}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      width={100}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}/ton`,
                        "",
                      ]}
                    />
                    <Bar
                      dataKey="costPerTon"
                      name="$/Ton"
                      fill={CATEGORY_COLORS[0]}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <ChartContainer
              title="Rebate Realization"
              subtitle="Actual recovery vs target potential by waste stream"
              chartClassName="h-auto"
            >
              <BulletChart data={rebateData} formatValue={fmt} />
            </ChartContainer>
          </PillTabsContent>

          {/* Tab 3: Rankings + Heatmap */}
          <PillTabsContent value="rankings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Cost by Transporter"
                subtitle="Ranked by total platform cost"
              >
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={costByTransporter.slice(0, 10).map(d => ({ name: d.label, cost: Math.round(d.value) }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={120} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString()}`, "Cost"]} />
                    <Bar dataKey="cost" name="MPS Cost" fill={CATEGORY_COLORS[0]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer
                title="Cost by Site"
                subtitle="Regional cost distribution"
              >
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={costBySite.slice(0, 10).map(d => ({ name: d.label, cost: Math.round(d.value) }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={120} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString()}`, "Cost"]} />
                    <Bar dataKey="cost" name="MPS Cost" fill={CATEGORY_COLORS[2]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Where Are We Making / Losing Money?</CardTitle>
                  <p className="text-xs text-text-muted mt-1">Margin per waste type at each site — spot profitable and unprofitable combinations</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-muted shrink-0">
                  <div className="flex items-center gap-1"><span className="shrink-0 rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-error-400)", display: "block" }} />Loss</div>
                  <div className="flex items-center gap-1"><span className="shrink-0 rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-bg-subtle)", display: "block" }} />Break-even</div>
                  <div className="flex items-center gap-1"><span className="shrink-0 rounded-sm" style={{ width: 12, height: 12, backgroundColor: "var(--color-success-400)", display: "block" }} />Profit</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-border-default">
                        <th className="pb-2 pr-3 text-left font-semibold text-text-muted uppercase tracking-wider sticky left-0 bg-bg-card min-w-[120px]">
                          Waste Type
                        </th>
                        {heatmapData.sites.map((site) => (
                          <th key={site} className="pb-2 px-1 text-center font-semibold text-text-muted uppercase tracking-wider min-w-[80px]">
                            {site}
                          </th>
                        ))}
                        <th className="pb-2 pl-3 text-right font-semibold text-text-primary uppercase tracking-wider min-w-[80px]">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.rows.map((row) => (
                        <tr key={row.waste as string} className="border-b border-border-default last:border-0 hover:bg-surface-secondary/50 transition-colors">
                          <td className="py-2 pr-3 text-text-primary font-semibold sticky left-0 bg-bg-card">
                            {row.waste as string}
                          </td>
                          {heatmapData.sites.map((site) => (
                            <td key={site} className="py-2 px-1">
                              <HeatmapCell value={row[site] as number} min={heatmapData.min} max={heatmapData.max} />
                            </td>
                          ))}
                          <td className="py-2 pl-3 text-right">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tabular-nums",
                              (row._total as number) >= 0 ? "bg-success-100 text-success-700" : "bg-error-100 text-error-700"
                            )}>
                              {(row._total as number) >= 0 ? "+" : "-"}${Math.abs(row._total as number).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </PillTabsContent>

          {/* Tab 4: Commercial — Route Margin, Vendor Spend, AR Aging, Cost Reduction, Dumping Summary */}
          <PillTabsContent value="commercial" className="space-y-4">
            {/* Operational Cost Reduction KPI */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                    costReduction.pct >= 0
                      ? "bg-success-400/20 border border-success-400/30"
                      : "bg-error-400/20 border border-error-400/30"
                  )}
                >
                  {costReduction.pct >= 0 ? (
                    <ArrowDownRight className="h-6 w-6 text-success-600" />
                  ) : (
                    <ArrowUpRight className="h-6 w-6 text-error-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Operational Cost Reduction
                  </p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-[20px] sm:text-[26px] font-extrabold leading-tight tracking-tight">
                      <span className={costReduction.pct >= 0 ? "text-success-600" : "text-error-600"}>
                        {Math.abs(costReduction.pct).toFixed(1)}%
                      </span>
                    </p>
                    <span className="text-xs text-text-muted">Target: 5%</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {costReduction.pct >= 0 ? "Cost decreased" : "Cost increased"} — first half vs second half of period
                  </p>
                </div>
                {/* Sparkline */}
                <div className="w-32 h-10 shrink-0 hidden sm:block">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={costReductionSparkline}>
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke={costReduction.pct >= 0 ? "var(--color-success-500)" : "var(--color-error-500)"}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* Route Margin Table */}
            <Card>
              <CardHeader>
                <CardTitle>True Margin / Profit per Route</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={routeTableRef}>
                  <DataTable
                    columns={routeMarginColumns}
                    data={routeMarginData.slice((routePage - 1) * routePageSize, routePage * routePageSize)}
                    pagination={{ page: routePage, pageSize: routePageSize, total: routeMarginData.length }}
                    onPaginationChange={setRoutePage}
                    emptyState={
                      <div className="flex items-center justify-center h-full text-sm text-text-muted">
                        No route data available
                      </div>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Subcontractor / Vendor Spend */}
              <ChartContainer
                title="Subcontractor / Vendor Spend"
                subtitle="MPS cost aggregated by vendor"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vendorSpendData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      width={120}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "Spend",
                      ]}
                    />
                    <Bar
                      dataKey="cost"
                      name="MPS Cost"
                      fill={CATEGORY_COLORS[0]}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* AR Aging */}
              <ChartContainer
                title="AR Aging"
                subtitle="Outstanding invoice amounts by days overdue"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={arAgingData}
                    margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "Outstanding",
                      ]}
                    />
                    <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]}>
                      {arAgingData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            i === 0
                              ? "var(--color-success-500)"
                              : i === 1
                                ? "var(--color-warning-400)"
                                : i === 2
                                  ? "var(--color-error-400)"
                                  : "var(--color-error-600)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Dumping Summary Cost (Donut) */}
            <ChartContainer
              title="Dumping Summary Cost"
              subtitle="Disposal fee breakdown by waste type (top 8 + Other)"
              chartClassName="h-[260px] sm:h-[300px] lg:h-[340px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsTreemap
                  data={dumpingCostData}
                  dataKey="value"
                  nameKey="name"
                  stroke="var(--color-border-default)"
                  isAnimationActive={false}
                  content={({ x, y, width, height, name, value, index }: { x: number; y: number; width: number; height: number; name: string; value: number; index: number }) => {
                    if (width < 4 || height < 4) return <g />;
                    return (
                      <g>
                        <rect x={x} y={y} width={width} height={height} rx={4} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} stroke="var(--color-bg-card)" strokeWidth={2} />
                        {width > 50 && height > 35 && (
                          <>
                            <text x={x + width / 2} y={y + height / 2 - 8} textAnchor="middle" fill="#fff" fontSize={11} style={{ fontWeight: 400, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.03em", textRendering: "geometricPrecision" }}>{name}</text>
                            <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={10} fontFamily="Inter, system-ui, sans-serif" style={{ textRendering: "geometricPrecision" }}>{fmt(value)}</text>
                          </>
                        )}
                      </g>
                    );
                  }}
                />
              </ResponsiveContainer>
            </ChartContainer>
          </PillTabsContent>

          {/* Tab 5: Transactions Table */}
          <PillTabsContent value="transactions">
            <div ref={tableRef}>
            <DataTable
              columns={txnColumns}
              data={shipments.slice((txnPage - 1) * pageSize, txnPage * pageSize)}
              pagination={{ page: txnPage, pageSize: pageSize, total: shipments.length }}
              onPaginationChange={setTxnPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No transactions found
                </div>
              }
            />
            </div>
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<DollarSign className="h-10 w-10" />}
            title="No shipments found"
            description="No shipments match the current filters. Try adjusting the date range, customer, or site selection."
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}
    </ReportContentLayout>
  );
}
