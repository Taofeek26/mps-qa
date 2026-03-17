"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Scale,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  RotateCcw,
  Clock,
  CalendarX,
  Timer,
  Container,
  MapPin,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
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
  ScatterQuadrant,
  DonutChart,
} from "@/components/charts";
import { loadEfficiency, downloadCsv } from "@/lib/report-utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";
import { useCollectionEvents, useContainerPlacements } from "@/lib/hooks/use-api-data";
import type { Shipment } from "@/lib/types";

const THRESHOLD = 80; // % — shipments below this are "light loads"

type ShipmentWithEfficiency = Shipment & { efficiency: number };

export function LightLoadContent() {
  const {
    clients,
    filteredSites,
    dateRange,
    setDateRange,
    clientId,
    setClientId,
    siteId,
    setSiteId,
    containerType,
    setContainerType,
    containerTypeOptions,
    hasFilters,
    resetFilters,
    shipments,
  } = useReportFilters();

  const { collectionEvents } = useCollectionEvents();
  const { containerPlacements } = useContainerPlacements();

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [lightLoadPage, setLightLoadPage] = React.useState(1);
  const hasData = shipments.length > 0;

  const filterSummary = [clientId && "Customer filtered", siteId && "Site filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("light-load", shipments, filterSummary);

  /* ─── Compute efficiency for shipments that have target load data ─── */

  const shipmentsWithEfficiency = React.useMemo(() => {
    return shipments
      .map((s) => ({
        ...s,
        efficiency: loadEfficiency(s),
      }))
      .filter(
        (s): s is typeof s & { efficiency: number } => s.efficiency !== null
      );
  }, [shipments]);

  const lightLoads = React.useMemo(
    () => shipmentsWithEfficiency.filter((s) => s.efficiency < THRESHOLD),
    [shipmentsWithEfficiency]
  );

  const totalAnalyzed = shipmentsWithEfficiency.length;
  const lightLoadCount = lightLoads.length;
  const lightLoadPct =
    totalAnalyzed > 0
      ? Math.round((lightLoadCount / totalAnalyzed) * 100)
      : 0;
  const avgEfficiency =
    totalAnalyzed > 0
      ? Math.round(
          shipmentsWithEfficiency.reduce((sum, s) => sum + s.efficiency, 0) /
            totalAnalyzed
        )
      : 0;

  /* ─── Potential savings ─── */

  const potentialSavings = React.useMemo(() => {
    let savings = 0;
    lightLoads.forEach((s) => {
      const haulCost = s.mpsCost?.haulCharge ?? 0;
      if (haulCost > 0 && s.efficiency > 0) {
        const currentTrips = 1;
        const consolidatedTrips = s.efficiency / THRESHOLD;
        savings += haulCost * (currentTrips - consolidatedTrips);
      }
    });
    return Math.round(savings);
  }, [lightLoads]);

  /* ─── Efficiency distribution histogram ─── */

  const histogram = React.useMemo(() => {
    const buckets: Record<string, number> = {
      "0-20%": 0,
      "20-40%": 0,
      "40-60%": 0,
      "60-80%": 0,
      "80-100%": 0,
      "100%+": 0,
    };
    shipmentsWithEfficiency.forEach((s) => {
      if (s.efficiency < 20) buckets["0-20%"]++;
      else if (s.efficiency < 40) buckets["20-40%"]++;
      else if (s.efficiency < 60) buckets["40-60%"]++;
      else if (s.efficiency < 80) buckets["60-80%"]++;
      else if (s.efficiency <= 100) buckets["80-100%"]++;
      else buckets["100%+"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [shipmentsWithEfficiency]);

  /* ─── Worst offenders by waste stream ─── */

  const worstByStream = React.useMemo(() => {
    const byType = new Map<
      string,
      { count: number; avgEff: number; totalEff: number }
    >();
    lightLoads.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? {
        count: 0,
        avgEff: 0,
        totalEff: 0,
      };
      existing.count++;
      existing.totalEff += s.efficiency;
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name,
        count: d.count,
        avgEfficiency: Math.round(d.totalEff / d.count),
      }))
      .sort((a, b) => a.avgEfficiency - b.avgEfficiency)
      .slice(0, 8);
  }, [lightLoads]);

  /* ─── Scatter data ─── */

  const scatterData = React.useMemo(() => {
    return shipmentsWithEfficiency.map((s) => ({
      x: s.standardizedVolumeLbs ?? s.weightValue,
      y: s.targetLoadWeight ?? 0,
      label: `${s.siteName} - ${s.wasteTypeName}`,
      category: s.wasteCategory ?? "Non Haz",
    }));
  }, [shipmentsWithEfficiency]);

  /* ─── Sorted light loads for table ─── */

  const sortedLightLoads = React.useMemo(
    () => [...lightLoads].sort((a, b) => a.efficiency - b.efficiency),
    [lightLoads]
  );

  /* ─── CSV export ─── */

  const handleExport = () => {
    const headers = [
      "Date",
      "Site",
      "Waste Type",
      "Actual (lbs)",
      "Target (lbs)",
      "Efficiency %",
      "Container",
      "Vendor",
    ];
    const rows = sortedLightLoads.map((s) => [
      s.shipmentDate,
      s.siteName,
      s.wasteTypeName,
      String(s.standardizedVolumeLbs ?? s.weightValue),
      String(s.targetLoadWeight ?? ""),
      `${s.efficiency}%`,
      s.containerType ?? "",
      s.vendorName,
    ]);
    downloadCsv("Light_Load_Report.csv", headers, rows);
  };

  /* ─── DataTable column definitions ─── */

  const lightLoadColumns: ColumnDef<ShipmentWithEfficiency, unknown>[] =
    React.useMemo(
      () => [
        {
          accessorKey: "shipmentDate",
          header: "Date",
          cell: ({ getValue }) =>
            new Date((getValue() as string) + "T00:00:00").toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            ),
        },
        {
          accessorKey: "siteName",
          header: "Site",
        },
        {
          accessorKey: "wasteTypeName",
          header: "Waste Type",
        },
        {
          id: "actualLbs",
          header: "Actual (lbs)",
          meta: { align: "center" as const },
          accessorFn: (row) =>
            row.standardizedVolumeLbs ?? row.weightValue,
          cell: ({ getValue }) =>
            (getValue() as number).toLocaleString(),
        },
        {
          id: "targetLbs",
          header: "Target (lbs)",
          meta: { align: "center" as const },
          accessorFn: (row) => row.targetLoadWeight ?? 0,
          cell: ({ getValue }) =>
            (getValue() as number).toLocaleString(),
        },
        {
          accessorKey: "efficiency",
          header: "Efficiency",
          cell: ({ getValue }) => {
            const eff = getValue() as number;
            return (
              <Badge variant={eff < 50 ? "error" : "warning"}>
                {eff}%
              </Badge>
            );
          },
        },
        {
          accessorKey: "containerType",
          header: "Container",
        },
      ],
      []
    );

  /* ════════════════════════════════════════════
     DOMAIN 2: Collection & Containers Data
     ════════════════════════════════════════════ */


  /* ─── Filter container placements by containerType if set ─── */

  const filteredPlacements = React.useMemo(() => {
    if (!containerType) return containerPlacements;
    return containerPlacements.filter((p) => p.containerType === containerType);
  }, [containerPlacements, containerType]);

  /* ─── KPI 1: On-Time Collection Rate ─── */

  const collectionRateData = React.useMemo(() => {
    const total = collectionEvents.length;
    const completed = collectionEvents.filter((e) => e.status === "completed").length;
    const late = collectionEvents.filter((e) => e.status === "late").length;
    const missed = collectionEvents.filter((e) => e.status === "missed").length;
    const onTimeRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      late,
      missed,
      onTimeRate,
      donutData: [
        { name: "On Time", value: completed, color: CATEGORY_COLORS[7] },
        { name: "Late", value: late, color: CATEGORY_COLORS[2] },
        { name: "Missed", value: missed, color: CATEGORY_COLORS[3] },
      ],
    };
  }, [collectionEvents]);

  /* ─── KPI 2: Missed Pickup Frequency by Month ─── */

  const missedByMonth = React.useMemo(() => {
    const monthMap = new Map<string, number>();
    collectionEvents
      .filter((e) => e.status === "missed")
      .forEach((e) => {
        const month = e.scheduledDate.slice(0, 7); // YYYY-MM
        monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
      });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: new Date(month + "-01T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        count,
      }));
  }, [collectionEvents]);

  /* ─── KPI 3: Container Days on Site ─── */

  const containerDaysData = React.useMemo(() => {
    const daysArr: number[] = [];
    filteredPlacements.forEach((p) => {
      if (p.removedDate) {
        const placed = new Date(p.placedDate + "T00:00:00").getTime();
        const removed = new Date(p.removedDate + "T00:00:00").getTime();
        const days = Math.round((removed - placed) / (1000 * 60 * 60 * 24));
        if (days >= 0) daysArr.push(days);
      }
    });
    const avgDays =
      daysArr.length > 0
        ? Math.round(daysArr.reduce((s, d) => s + d, 0) / daysArr.length)
        : 0;

    const buckets: Record<string, number> = {
      "0-7": 0,
      "8-14": 0,
      "15-21": 0,
      "22-30": 0,
      "30+": 0,
    };
    daysArr.forEach((d) => {
      if (d <= 7) buckets["0-7"]++;
      else if (d <= 14) buckets["8-14"]++;
      else if (d <= 21) buckets["15-21"]++;
      else if (d <= 30) buckets["22-30"]++;
      else buckets["30+"]++;
    });
    const histogram = Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));

    return { avgDays, totalMeasured: daysArr.length, histogram };
  }, [filteredPlacements]);

  /* ─── KPI 4: Container Fill Level by Type ─── */

  const fillLevelData = React.useMemo(() => {
    const byType = new Map<string, { total: number; count: number }>();
    filteredPlacements.forEach((p) => {
      const existing = byType.get(p.containerType) ?? { total: 0, count: 0 };
      existing.total += p.fillPercentage;
      existing.count++;
      byType.set(p.containerType, existing);
    });
    return Array.from(byType.entries())
      .map(([type, d]) => ({
        type,
        avgFill: Math.round(d.total / d.count),
      }))
      .sort((a, b) => b.avgFill - a.avgFill);
  }, [filteredPlacements]);

  /* ─── KPI 5: Sites with Active Rentals ─── */

  const activeRentalsData = React.useMemo(() => {
    const activePlacements = filteredPlacements.filter(
      (p) => p.removedDate === undefined
    );
    const siteSet = new Set<string>();
    activePlacements.forEach((p) => siteSet.add(p.siteId));
    return {
      activePlacementCount: activePlacements.length,
      siteCount: siteSet.size,
    };
  }, [filteredPlacements]);

  /* Reset pagination when data changes */
  React.useEffect(() => {
    setLightLoadPage(1);
  }, [shipments]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Light Loads"
            value={lightLoadCount}
            subtitle="Below threshold"
            icon={AlertTriangle}
            variant="warning"
          />
          <KpiCard
            title="Light Load %"
            value={`${lightLoadPct}%`}
            subtitle="Of analyzed loads"
            icon={Scale}
            variant={lightLoadPct > 30 ? "error" : "warning"}
          />
          <KpiCard
            title="Avg Efficiency"
            value={`${avgEfficiency}%`}
            subtitle="Across all loads"
            icon={TrendingDown}
            variant={avgEfficiency < 70 ? "error" : "success"}
          />
          <KpiCard
            title="Potential Savings"
            value={`$${potentialSavings.toLocaleString()}`}
            subtitle="Via consolidation"
            icon={DollarSign}
            variant="success"
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
        <SearchableSelect
          options={[
            { value: "all", label: "All Container Types" },
            ...containerTypeOptions.map((ct) => ({
              value: ct,
              label: ct,
            })),
          ]}
          value={containerType || "all"}
          onChange={setContainerType}
          placeholder="All Container Types"
          className="w-full sm:w-[200px]"
        />
      }
      onExport={handleExport}
      exportDisabled={!hasData}
      onExportPdf={handleExportPdf}
      isPdfExporting={isPdfExporting}
      onResetFilters={resetFilters}
      hasFilters={hasFilters}
    >
      {hasData ? (
        <PillTabs defaultValue="analysis">
          <PillTabsList>
            <PillTabsTrigger value="analysis">Analysis</PillTabsTrigger>
            <PillTabsTrigger value="collection">
              Collection & Containers
            </PillTabsTrigger>
            <PillTabsTrigger value="light-loads" count={lightLoadCount}>
              Light Loads
            </PillTabsTrigger>
          </PillTabsList>

          {/* Analysis: Scatter + Histogram + Worst Offenders */}
          <PillTabsContent value="analysis" className="space-y-4">
            <ChartContainer
              title="Load Efficiency Scatter"
              subtitle="Actual weight vs target — points below diagonal are underfilled"
              chartClassName="h-[250px] sm:h-[300px] lg:h-[350px]"
            >
              <ScatterQuadrant
                data={scatterData}
                xLabel="Actual Weight (lbs)"
                yLabel="Target Weight (lbs)"
                showDiagonal={true}
                categoryColors={{
                  "Non Haz": "var(--color-primary-400)",
                  "Hazardous Waste": "var(--color-error-500)",
                  "Recycling": "var(--color-success-500)",
                  "Medical": "var(--color-warning-500)",
                }}
                xFormatter={(v) => `${v.toLocaleString()} lbs`}
                yFormatter={(v) => `${v.toLocaleString()} lbs`}
              />
            </ChartContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Load Efficiency Distribution"
                subtitle="Number of shipments by efficiency range"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={histogram}
                    margin={{ top: 5, right: 40, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <ReferenceLine
                      x="80-100%"
                      stroke={CATEGORY_COLORS[1]}
                      strokeDasharray="3 3"
                      label={{
                        value: "Target",
                        fontSize: 10,
                        fill: "var(--color-text-muted)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Shipments"
                      fill={CATEGORY_COLORS[2]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer
                title="Worst Offenders by Waste Stream"
                subtitle="Waste types with lowest avg load efficiency"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={worstByStream}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      width={115}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [`${value}%`, "Avg Efficiency"]}
                    />
                    <ReferenceLine
                      x={THRESHOLD}
                      stroke={CATEGORY_COLORS[3]}
                      strokeDasharray="3 3"
                    />
                    <Bar
                      dataKey="avgEfficiency"
                      name="Avg Efficiency"
                      fill={CATEGORY_COLORS[0]}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Collection & Containers Tab */}
          <PillTabsContent value="collection" className="space-y-4">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <KpiCard
                title="On-Time Rate"
                value={`${collectionRateData.onTimeRate}%`}
                subtitle={`${collectionRateData.completed} of ${collectionRateData.total} events`}
                icon={Clock}
                variant={collectionRateData.onTimeRate >= 95 ? "success" : "warning"}
              />
              <KpiCard
                title="Missed Pickups"
                value={collectionRateData.missed}
                subtitle="Total missed events"
                icon={CalendarX}
                variant={collectionRateData.missed > 10 ? "error" : "warning"}
              />
              <KpiCard
                title="Avg Days on Site"
                value={containerDaysData.avgDays}
                subtitle={`${containerDaysData.totalMeasured} containers measured`}
                icon={Timer}
                variant={containerDaysData.avgDays > 21 ? "warning" : "success"}
              />
              <KpiCard
                title="Avg Fill Level"
                value={`${fillLevelData.length > 0 ? Math.round(fillLevelData.reduce((s, d) => s + d.avgFill, 0) / fillLevelData.length) : 0}%`}
                subtitle="Across all container types"
                icon={Container}
                variant="default"
              />
              <KpiCard
                title="Active Rentals"
                value={activeRentalsData.activePlacementCount}
                subtitle={`Across ${activeRentalsData.siteCount} sites`}
                icon={MapPin}
                variant="default"
              />
            </div>

            {/* Row 1: Donut + Missed by Month */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="On-Time Collection Rate"
                subtitle="Breakdown of collection event outcomes"
              >
                <DonutChart
                  data={collectionRateData.donutData}
                  valueFormatter={(v) => `${v} events`}
                />
              </ChartContainer>

              <ChartContainer
                title="Missed Pickup Frequency"
                subtitle="Missed collection events by month"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={missedByMonth}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="missedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-error-400)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--color-error-400)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [`${value}`, "Missed Pickups"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Missed Pickups"
                      stroke="var(--color-error-400)"
                      fill="url(#missedGradient)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "var(--color-error-400)", stroke: "var(--color-bg-card)", strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Row 2: Days on Site Histogram + Fill Level by Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Container Days on Site"
                subtitle="Distribution of time containers remain on site"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={containerDaysData.histogram}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      label={{
                        value: "Days",
                        position: "insideBottomRight",
                        offset: -5,
                        fontSize: 11,
                        fill: "var(--color-text-muted)",
                      }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      width={30}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [`${value}`, "Containers"]}
                    />
                    <Bar
                      dataKey="count"
                      name="Containers"
                      fill={CATEGORY_COLORS[1]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer
                title="Avg Container Fill Level"
                subtitle="Average fill percentage by container type"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fillLevelData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v}%`}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      width={95}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <ReferenceLine x={80} stroke="var(--color-text-muted)" strokeDasharray="3 3" label={{ value: "80% target", fontSize: 10, fill: "var(--color-text-muted)", position: "top" }} />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [`${value}%`, "Avg Fill"]}
                    />
                    <Bar
                      dataKey="avgFill"
                      name="Avg Fill %"
                      radius={[0, 4, 4, 0]}
                    >
                      {fillLevelData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={
                            d.avgFill >= 80
                              ? "var(--color-success-400)"
                              : d.avgFill >= 60
                                ? "var(--color-warning-400)"
                                : "var(--color-error-400)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Light Loads DataTable */}
          <PillTabsContent value="light-loads">
            <div ref={tableRef}>
            <DataTable
              columns={lightLoadColumns}
              data={sortedLightLoads.slice(
                (lightLoadPage - 1) * pageSize,
                lightLoadPage * pageSize
              )}
              pagination={{
                page: lightLoadPage,
                pageSize: pageSize,
                total: sortedLightLoads.length,
              }}
              onPaginationChange={setLightLoadPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No light load shipments found
                </div>
              }
            />
            </div>
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<AlertTriangle className="h-10 w-10" />}
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
