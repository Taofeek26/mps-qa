"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
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
  Percent,
  Truck,
  RotateCcw,
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
} from "@/lib/report-utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";

const PAGE_SIZE = 10;

/* ─── Heatmap Cell ─── */

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

  let bgClass = "bg-bg-subtle";
  let textClass = "text-text-muted";

  if (value > 0) {
    if (normalized > 0.6) {
      bgClass = "bg-success-200";
      textClass = "text-success-700";
    } else if (normalized > 0.3) {
      bgClass = "bg-success-100";
      textClass = "text-success-600";
    } else {
      bgClass = "bg-success-50";
      textClass = "text-success-600";
    }
  } else if (value < 0) {
    if (normalized < -0.6) {
      bgClass = "bg-error-200";
      textClass = "text-error-700";
    } else if (normalized < -0.3) {
      bgClass = "bg-error-100";
      textClass = "text-error-600";
    } else {
      bgClass = "bg-error-50";
      textClass = "text-error-600";
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium tabular-nums",
        bgClass,
        textClass
      )}
    >
      ${Math.abs(value).toLocaleString()}
    </div>
  );
}

/* ─── Helpers ─── */

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

function fmtExact(v: number): string {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ─── Content ─── */

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
  } = useReportFilters();

  const [txnPage, setTxnPage] = React.useState(1);
  const hasData = shipments.length > 0;

  React.useEffect(() => {
    setTxnPage(1);
  }, [shipments]);

  /* ─── KPI totals ─── */

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

  /* ─── Monthly cost trend (Revenue vs Cost) ─── */

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

  /* ─── Vendor Margin Spread (margin per waste stream) ─── */

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

  /* ─── Haul vs Disposal Split (donut) ─── */

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

  /* ─── Cost per ton by waste stream ─── */

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

  /* ─── Rebate realization ─── */

  const rebateData = React.useMemo(() => {
    const byType = new Map<string, number>();
    shipments.forEach((s) => {
      const rebate = s.customerCost?.rebate ?? 0;
      if (rebate > 0) {
        byType.set(s.wasteTypeName, (byType.get(s.wasteTypeName) ?? 0) + rebate);
      }
    });
    return Array.from(byType.entries())
      .map(([name, value]) => ({
        label: name,
        value,
        displayValue: fmt(value) + " recovered",
        color: "var(--color-teal-400)",
      }))
      .sort((a, b) => b.value - a.value);
  }, [shipments]);

  /* ─── Cost by Transporter ─── */

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

  /* ─── Cost by Site ─── */

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

  /* ─── Margin Waterfall (from Financial) ─── */

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

  /* ─── Stacked Cost Composition (from Financial) ─── */

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

  /* ─── Margin Heatmap (from Financial) ─── */

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

  /* ─── Transaction Table Columns ─── */

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

  /* ─── CSV export ─── */

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
            title="Rebate Credits"
            value={fmt(totals.totalRebate)}
            subtitle="Recycling revenue"
            icon={Percent}
            variant="success"
          />
          <KpiCard
            title="Cost Per Ton"
            value={fmt(totals.costPerTon)}
            subtitle="Blended CPT"
            icon={DollarSign}
          />
          <KpiCard
            title="Haul Cost"
            value={fmt(totals.totalHaul)}
            subtitle={`${totals.haulPct.toFixed(1)}% of total`}
            icon={Truck}
            variant="warning"
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
      onExport={handleExport}
      exportDisabled={!hasData}
    >
      {hasData ? (
        <PillTabs defaultValue="trends">
          <PillTabsList>
            <PillTabsTrigger value="trends">Trends & Margins</PillTabsTrigger>
            <PillTabsTrigger value="breakdown">Cost Breakdown</PillTabsTrigger>
            <PillTabsTrigger value="rankings">Rankings & Heatmap</PillTabsTrigger>
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
                  <BarChart
                    data={monthlyCostStack}
                    margin={{ top: 5, right: 40, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {costStackCategories.map((cat, idx) => (
                      <Bar
                        key={cat}
                        dataKey={cat}
                        stackId="cost"
                        fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                        radius={idx === costStackCategories.length - 1 ? [4, 4, 0, 0] : undefined}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Haul vs Disposal Split"
                subtitle="Transportation vs processing cost breakdown"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <DonutChart
                  data={haulDisposalData}
                  colors={[
                    "var(--color-warning-500)",
                    "var(--color-primary-400)",
                    "var(--color-error-500)",
                    "var(--color-text-muted)",
                  ]}
                  valueFormatter={(v) => fmt(v)}
                />
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
                    margin={{ top: 5, right: 30, bottom: 5, left: 10 }}
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
              subtitle="Revenue recovery from recyclable streams"
              chartClassName="max-h-[300px] overflow-y-auto"
            >
              <ProgressList
                items={rebateData}
                maxItems={8}
                className="px-1 py-2"
              />
            </ChartContainer>
          </PillTabsContent>

          {/* Tab 3: Rankings + Heatmap */}
          <PillTabsContent value="rankings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Cost by Transporter"
                subtitle="Ranked by total platform cost"
                chartClassName="max-h-[350px] overflow-y-auto"
              >
                <ProgressList
                  items={costByTransporter}
                  maxItems={10}
                  className="px-1 py-2"
                />
              </ChartContainer>

              <ChartContainer
                title="Cost by Site"
                subtitle="Regional cost distribution"
                chartClassName="max-h-[350px] overflow-y-auto"
              >
                <ProgressList
                  items={costBySite}
                  maxItems={10}
                  className="px-1 py-2"
                />
              </ChartContainer>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Margin Heatmap — Site x Waste Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-default">
                        <th className="pb-2 pr-3 text-left font-medium text-text-muted sticky left-0 bg-bg-card min-w-[120px]">
                          Waste Type
                        </th>
                        {heatmapData.sites.map((site) => (
                          <th key={site} className="pb-2 px-1 text-center font-medium text-text-muted min-w-[80px]">
                            {site}
                          </th>
                        ))}
                        <th className="pb-2 pl-3 text-right font-medium text-text-primary min-w-[80px]">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.rows.map((row) => (
                        <tr key={row.waste as string} className="border-b border-border-default last:border-0">
                          <td className="py-1.5 pr-3 text-text-primary font-medium sticky left-0 bg-bg-card">
                            {row.waste as string}
                          </td>
                          {heatmapData.sites.map((site) => (
                            <td key={site} className="py-1.5 px-1">
                              <HeatmapCell value={row[site] as number} min={heatmapData.min} max={heatmapData.max} />
                            </td>
                          ))}
                          <td className="py-1.5 pl-3 text-right font-semibold tabular-nums text-text-primary">
                            <Badge variant={(row._total as number) >= 0 ? "success" : "error"}>
                              ${Math.abs(row._total as number).toLocaleString()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </PillTabsContent>

          {/* Tab 4: Transactions Table */}
          <PillTabsContent value="transactions">
            <DataTable
              columns={txnColumns}
              data={shipments.slice((txnPage - 1) * PAGE_SIZE, txnPage * PAGE_SIZE)}
              pagination={{ page: txnPage, pageSize: PAGE_SIZE, total: shipments.length }}
              onPaginationChange={setTxnPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No transactions found
                </div>
              }
            />
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
