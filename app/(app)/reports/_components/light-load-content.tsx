"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Scale,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  RotateCcw,
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
} from "@/components/charts";
import { loadEfficiency, downloadCsv } from "@/lib/report-utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";
import type { Shipment } from "@/lib/types";

const THRESHOLD = 80; // % — shipments below this are "light loads"
const PAGE_SIZE = 10;

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
    hasFilters,
    resetFilters,
    shipments,
  } = useReportFilters();

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
      onExport={handleExport}
      exportDisabled={!hasData}
      onExportPdf={handleExportPdf}
      isPdfExporting={isPdfExporting}
    >
      {hasData ? (
        <PillTabs defaultValue="analysis">
          <PillTabsList>
            <PillTabsTrigger value="analysis">Analysis</PillTabsTrigger>
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
                    margin={{ top: 5, right: 40, bottom: 5, left: 120 }}
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

          {/* Light Loads DataTable */}
          <PillTabsContent value="light-loads">
            <DataTable
              columns={lightLoadColumns}
              data={sortedLightLoads.slice(
                (lightLoadPage - 1) * PAGE_SIZE,
                lightLoadPage * PAGE_SIZE
              )}
              pagination={{
                page: lightLoadPage,
                pageSize: PAGE_SIZE,
                total: sortedLightLoads.length,
              }}
              onPaginationChange={setLightLoadPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No light load shipments found
                </div>
              }
            />
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
