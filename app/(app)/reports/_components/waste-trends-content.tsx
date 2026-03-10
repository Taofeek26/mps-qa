"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Package,
  Truck,
  RotateCcw,
  Weight,
  Container,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
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
  TOOLTIP_STYLE,
  CHART_COLORS,
  DonutChart,
  ProgressList,
} from "@/components/charts";
import { getMonthKey, formatMonthLabel, downloadCsv } from "@/lib/report-utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";


export function WasteTrendsContent() {
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

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [wasteTypePage, setWasteTypePage] = React.useState(1);
  const hasData = shipments.length > 0;

  const filterSummary = [clientId && `Customer filtered`, siteId && `Site filtered`, dateRange?.from && `Date range applied`].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("waste-trends", shipments, filterSummary);

  /* ─── KPI computations ─── */

  const totalTons = shipments.reduce((sum, s) => sum + s.weightValue, 0) / 2000;
  const totalShipments = shipments.length;
  const avgLoadLbs = totalShipments > 0
    ? Math.round((totalTons * 2000) / totalShipments)
    : 0;

  const containerUtilPct = React.useMemo(() => {
    let actualTotal = 0;
    let targetTotal = 0;
    shipments.forEach((s) => {
      if (!s.containerType || !s.targetLoadWeight) return;
      actualTotal += s.weightValue;
      targetTotal += s.targetLoadWeight;
    });
    return targetTotal > 0 ? (actualTotal / targetTotal) * 100 : 0;
  }, [shipments]);

  /* ─── Chart: Monthly Volume Trend ─── */

  const monthlyVolume = React.useMemo(() => {
    const byMonth = new Map<string, number>();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      byMonth.set(key, (byMonth.get(key) ?? 0) + s.weightValue / 2000);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, tons]) => ({ month: formatMonthLabel(key), tons: Math.round(tons * 10) / 10 }));
  }, [shipments]);

  /* ─── Chart: Treatment method donut ─── */

  const treatmentData = React.useMemo(() => {
    const byMethod = new Map<string, number>();
    shipments.forEach((s) => {
      const m = s.treatmentMethod ?? "Unknown";
      byMethod.set(m, (byMethod.get(m) ?? 0) + s.weightValue);
    });
    return Array.from(byMethod.entries())
      .map(([name, value]) => ({ name, value: Math.round(value / 2000) }))
      .sort((a, b) => b.value - a.value);
  }, [shipments]);

  /* ─── Waste Type Distribution (table + progress bars) ─── */

  const wasteTypeData = React.useMemo(() => {
    const byType = new Map<string, { tons: number; count: number }>();
    shipments.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? { tons: 0, count: 0 };
      existing.tons += s.weightValue / 2000;
      existing.count += 1;
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({ name, tons: Math.round(d.tons), count: d.count }))
      .sort((a, b) => b.tons - a.tons);
  }, [shipments]);

  /* ─── Chart: Container utilization ─── */

  const containerUtilData = React.useMemo(() => {
    const byContainer = new Map<string, { actualTotal: number; targetTotal: number; count: number }>();
    shipments.forEach((s) => {
      if (!s.containerType || !s.targetLoadWeight) return;
      const existing = byContainer.get(s.containerType) ?? { actualTotal: 0, targetTotal: 0, count: 0 };
      existing.actualTotal += s.weightValue;
      existing.targetTotal += s.targetLoadWeight;
      existing.count += 1;
      byContainer.set(s.containerType, existing);
    });
    return Array.from(byContainer.entries())
      .map(([name, d]) => ({
        name: name.length > 20 ? name.slice(0, 18) + "\u2026" : name,
        actual: Math.round(d.actualTotal / d.count),
        target: Math.round(d.targetTotal / d.count),
      }))
      .sort((a, b) => b.actual - a.actual);
  }, [shipments]);

  /* ─── CSV export ─── */

  const handleExport = () => {
    const headers = ["Waste Stream", "Volume (tons)", "Shipments"];
    const rows = wasteTypeData.map((s) => [s.name, String(s.tons), String(s.count)]);
    downloadCsv("Waste_Trends_Report.csv", headers, rows);
  };

  /* ─── Waste Type Table Columns ─── */

  const wasteTypeColumns: ColumnDef<{ name: string; tons: number; count: number }, unknown>[] = React.useMemo(
    () => [
      { accessorKey: "name", header: "Waste Type" },
      {
        accessorKey: "tons",
        header: "Volume (tons)",
        meta: { align: "center" },
        cell: ({ getValue }) => (getValue() as number).toLocaleString(),
      },
      {
        accessorKey: "count",
        header: "Shipments",
        meta: { align: "center" },
        cell: ({ getValue }) => (getValue() as number).toLocaleString(),
      },
    ],
    []
  );

  function fmtTons(v: number): string {
    if (v >= 1000) return `${Math.round(v / 1000)}k`;
    return v.toFixed(0);
  }

  React.useEffect(() => {
    setWasteTypePage(1);
  }, [shipments]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard title="Total Tons" value={`${fmtTons(totalTons)} t`} subtitle="Standardized weight" icon={Package} />
          <KpiCard title="Shipments" value={totalShipments.toLocaleString()} subtitle="All manifests" icon={Truck} variant="success" />
          <KpiCard title="Container Util" value={`${containerUtilPct.toFixed(1)}%`} subtitle="Avg fill rate" icon={Container} variant="warning" />
          <KpiCard title="Avg Load" value={`${avgLoadLbs.toLocaleString()} lbs`} subtitle="Per shipment" icon={Weight} />
        </>
      }
      filters={
        <>
          <DateRangePicker from={dateRange?.from} to={dateRange?.to} onChange={setDateRange} presets={REPORT_PRESETS} placeholder="All time" className="w-full sm:w-[220px]" />
          <SearchableSelect options={[{ value: "all", label: "All Customers" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} value={clientId || "all"} onChange={setClientId} placeholder="All Customers" className="w-full sm:w-[200px]" />
          <SearchableSelect options={[{ value: "all", label: "All Sites" }, ...filteredSites.map((s) => ({ value: s.id, label: s.name }))]} value={siteId || "all"} onChange={setSiteId} placeholder="All Sites" className="w-full sm:w-[200px]" />
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
        <PillTabs defaultValue="volume">
          <PillTabsList>
            <PillTabsTrigger value="volume">Volume & Containers</PillTabsTrigger>
            <PillTabsTrigger value="distribution">Waste Distribution</PillTabsTrigger>
            <PillTabsTrigger value="waste-streams" count={wasteTypeData.length}>Waste Streams</PillTabsTrigger>
          </PillTabsList>

          {/* Volume Trend + Container Utilization */}
          <PillTabsContent value="volume" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer title="Monthly Volume Trend" subtitle="Tonnage over time" chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyVolume} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => fmtTons(v)} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toLocaleString()} tons`, "Tons"]} />
                    <Line type="monotone" dataKey="tons" name="Tons" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.primary }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Container Utilization" subtitle="Actual load vs target capacity by container type" chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={containerUtilData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value, name) => [`${Number(value).toLocaleString()} lbs`, name === "actual" ? "Actual" : "Target"]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="actual" name="Actual (lbs)" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target (lbs)" fill={CHART_COLORS.primary} fillOpacity={0.25} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Treatment Distribution + Waste Type Breakdown */}
          <PillTabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer title="Waste Type Distribution" subtitle="Volume by waste stream (tons)" chartClassName="h-[220px] sm:h-[260px] lg:h-[300px] overflow-y-auto">
                <ProgressList
                  items={wasteTypeData.map((s) => ({ label: s.name, value: s.tons, displayValue: `${s.tons.toLocaleString()} tons \u00b7 ${s.count} shipments`, color: "var(--color-primary-400)" }))}
                  maxItems={10}
                  className="px-1 py-2"
                />
              </ChartContainer>

              <ChartContainer title="Treatment Method Distribution" subtitle="Landfill vs Recycling vs Incineration vs Fuel Blending" chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]">
                <DonutChart data={treatmentData} valueFormatter={(v) => `${v.toLocaleString()} tons`} />
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Waste Streams Data Table */}
          <PillTabsContent value="waste-streams">
            <div ref={tableRef}>
            <DataTable
              columns={wasteTypeColumns}
              data={wasteTypeData.slice((wasteTypePage - 1) * pageSize, wasteTypePage * pageSize)}
              pagination={{ page: wasteTypePage, pageSize: pageSize, total: wasteTypeData.length }}
              onPaginationChange={setWasteTypePage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No waste type data found
                </div>
              }
            />
            </div>
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title="No shipments found"
            description="No shipments match the current filters. Try adjusting the date range, customer, or site selection."
            action={hasFilters ? (<Button variant="secondary" size="sm" onClick={resetFilters}><RotateCcw className="h-3.5 w-3.5" />Reset Filters</Button>) : undefined}
          />
        </Card>
      )}
    </ReportContentLayout>
  );
}
