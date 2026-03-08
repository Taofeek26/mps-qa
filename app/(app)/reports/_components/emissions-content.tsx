"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { type ColumnDef } from "@tanstack/react-table";
import { Leaf, RotateCcw, TrendingDown, Factory, Recycle } from "lucide-react";
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
} from "@/components/charts";
import { getMonthKey, formatMonthLabel, downloadCsv } from "@/lib/report-utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";

/* ─── Emissions Factors (kg CO2 per ton of waste by treatment method) ─── */

const EMISSIONS_FACTORS: Record<string, number> = {
  Incineration: 1200,
  "Energy Recovery": 800,
  Landfill: 500,
  Recycling: 50,
  Reuse: 20,
  "Wastewater Treatment": 150,
  "Fuel Blending": 600,
  Composting: 30,
  Unknown: 400,
};

function getEmissionsFactor(treatmentMethod: string | undefined): number {
  if (!treatmentMethod) return EMISSIONS_FACTORS.Unknown;
  return EMISSIONS_FACTORS[treatmentMethod] ?? EMISSIONS_FACTORS.Unknown;
}

const PAGE_SIZE = 10;

/* ─── Content ─── */

export function EmissionsContent() {
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

  const [sitePage, setSitePage] = React.useState(1);
  const hasData = shipments.length > 0;

  /* ─── KPI Computations ─── */

  const kpis = React.useMemo(() => {
    let totalWeightTons = 0;
    let totalCO2 = 0;
    let diverted = 0;

    shipments.forEach((s) => {
      const tons = s.weightValue / 2000;
      totalWeightTons += tons;
      totalCO2 += tons * getEmissionsFactor(s.treatmentMethod);
      if (
        s.treatmentMethod === "Recycling" ||
        s.treatmentMethod === "Reuse"
      ) {
        diverted += tons;
      }
    });

    const intensity =
      totalWeightTons > 0 ? Math.round(totalCO2 / totalWeightTons) : 0;
    const avoidedCO2 = Math.round(
      diverted * (EMISSIONS_FACTORS.Landfill - EMISSIONS_FACTORS.Recycling)
    );

    return {
      totalCO2: Math.round(totalCO2),
      intensity,
      avoidedCO2,
      totalWeightTons: Math.round(totalWeightTons),
    };
  }, [shipments]);

  /* ─── Monthly Emissions Trend ─── */

  const monthlyEmissions = React.useMemo(() => {
    const byMonth = new Map<string, { co2: number; tons: number }>();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) ?? { co2: 0, tons: 0 };
      const tons = s.weightValue / 2000;
      existing.co2 += tons * getEmissionsFactor(s.treatmentMethod);
      existing.tons += tons;
      byMonth.set(key, existing);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => ({
        month: formatMonthLabel(key),
        co2: Math.round(d.co2),
        intensity: d.tons > 0 ? Math.round(d.co2 / d.tons) : 0,
      }));
  }, [shipments]);

  /* ─── Emissions by Treatment Method ─── */

  const byTreatment = React.useMemo(() => {
    const byMethod = new Map<
      string,
      { co2: number; tons: number; shipments: number }
    >();
    shipments.forEach((s) => {
      const method = s.treatmentMethod ?? "Unknown";
      const existing = byMethod.get(method) ?? {
        co2: 0,
        tons: 0,
        shipments: 0,
      };
      const tons = s.weightValue / 2000;
      existing.co2 += tons * getEmissionsFactor(method);
      existing.tons += tons;
      existing.shipments++;
      byMethod.set(method, existing);
    });
    return Array.from(byMethod.entries())
      .map(([name, d]) => ({
        name,
        co2: Math.round(d.co2),
        tons: Math.round(d.tons),
        intensity: d.tons > 0 ? Math.round(d.co2 / d.tons) : 0,
        shipments: d.shipments,
      }))
      .sort((a, b) => b.co2 - a.co2);
  }, [shipments]);

  /* ─── Emissions by Site ─── */

  const bySite = React.useMemo(() => {
    const siteMap = new Map<string, { co2: number; tons: number }>();
    shipments.forEach((s) => {
      const existing = siteMap.get(s.siteName) ?? { co2: 0, tons: 0 };
      const tons = s.weightValue / 2000;
      existing.co2 += tons * getEmissionsFactor(s.treatmentMethod);
      existing.tons += tons;
      siteMap.set(s.siteName, existing);
    });
    return Array.from(siteMap.entries())
      .map(([name, d]) => ({
        name,
        co2: Math.round(d.co2),
        intensity: d.tons > 0 ? Math.round(d.co2 / d.tons) : 0,
      }))
      .sort((a, b) => b.co2 - a.co2);
  }, [shipments]);

  /* ─── CSV export ─── */

  const handleExport = () => {
    const headers = [
      "Treatment Method",
      "CO2 (kg)",
      "Weight (tons)",
      "Intensity (kg CO2/ton)",
      "Shipments",
    ];
    const rows = byTreatment.map((d) => [
      d.name,
      String(d.co2),
      String(d.tons),
      String(d.intensity),
      String(d.shipments),
    ]);
    downloadCsv("GHG_Emissions_Report.csv", headers, rows);
  };

  /* ─── Site Table Columns ─── */

  type SiteRow = { name: string; co2: number; intensity: number };

  const siteColumns: ColumnDef<SiteRow, unknown>[] = React.useMemo(
    () => [
      { accessorKey: "name", header: "Site" },
      {
        accessorKey: "co2",
        header: "Total CO2 (kg)",
        meta: { align: "center" },
        cell: ({ getValue }) => (getValue() as number).toLocaleString(),
      },
      {
        accessorKey: "intensity",
        header: "Intensity (kg/ton)",
        meta: { align: "center" },
        cell: ({ getValue }) => (getValue() as number).toLocaleString(),
      },
      {
        id: "rating",
        header: "Rating",
        meta: { align: "center" },
        cell: ({ row }) => {
          const intensity = row.original.intensity;
          const variant =
            intensity < 200
              ? "success"
              : intensity < 500
                ? "warning"
                : "error";
          const label =
            intensity < 200
              ? "Low"
              : intensity < 500
                ? "Medium"
                : "High";
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
    ],
    []
  );

  React.useEffect(() => {
    setSitePage(1);
  }, [shipments]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Total CO2"
            value={`${(kpis.totalCO2 / 1000).toFixed(1)}t`}
            icon={Factory}
            variant="warning"
          />
          <KpiCard
            title="Intensity"
            value={`${kpis.intensity} kg/ton`}
            icon={Leaf}
            variant={kpis.intensity < 400 ? "success" : "warning"}
          />
          <KpiCard
            title="CO2 Avoided"
            value={`${(kpis.avoidedCO2 / 1000).toFixed(1)}t`}
            icon={Recycle}
            variant="success"
          />
          <KpiCard
            title="Waste Processed"
            value={`${kpis.totalWeightTons.toLocaleString()} tons`}
            icon={TrendingDown}
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
            <PillTabsTrigger value="trends">Emission Trends</PillTabsTrigger>
            <PillTabsTrigger value="analysis">Analysis</PillTabsTrigger>
            <PillTabsTrigger value="reference">Reference</PillTabsTrigger>
          </PillTabsList>

          {/* Emission Trends: Monthly CO2 + Intensity side by side */}
          <PillTabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Monthly CO2 Emissions"
                subtitle="Estimated kg CO2 by month"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyEmissions}
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
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `${Number(value).toLocaleString()} kg CO2`,
                        "Emissions",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="co2"
                      stroke={CATEGORY_COLORS[2]}
                      fill={CATEGORY_COLORS[2]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer
                title="Emissions Intensity Trend"
                subtitle="kg CO2 per ton of waste processed"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyEmissions}
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
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `${value} kg CO2/ton`,
                        "Intensity",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="intensity"
                      stroke={CATEGORY_COLORS[1]}
                      fill={CATEGORY_COLORS[1]}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Analysis: Treatment Method bar chart + Site table */}
          <PillTabsContent value="analysis" className="space-y-4">
            <ChartContainer
              title="Emissions by Treatment Method"
              subtitle="Total CO2 and intensity per method"
              chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byTreatment}
                  layout="vertical"
                  margin={{ top: 5, right: 40, bottom: 5, left: 120 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-default)"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    width={115}
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} kg CO2`,
                      "",
                    ]}
                  />
                  <Bar dataKey="co2" name="CO2 (kg)" radius={[0, 4, 4, 0]}>
                    {byTreatment.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          entry.intensity > 800
                            ? CATEGORY_COLORS[3]
                            : entry.intensity > 300
                              ? CATEGORY_COLORS[2]
                              : CATEGORY_COLORS[1]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <DataTable
              columns={siteColumns}
              data={bySite.slice(
                (sitePage - 1) * PAGE_SIZE,
                sitePage * PAGE_SIZE
              )}
              pagination={{
                page: sitePage,
                pageSize: PAGE_SIZE,
                total: bySite.length,
              }}
              onPaginationChange={setSitePage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No site emissions data found
                </div>
              }
            />
          </PillTabsContent>

          {/* Reference: Emissions Factor Reference */}
          <PillTabsContent value="reference">
            <Card>
              <CardHeader>
                <CardTitle>Emissions Factor Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-text-muted mb-3">
                  Estimated kg CO2 per ton of waste by treatment method. These
                  are approximations for directional ESG reporting.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(EMISSIONS_FACTORS)
                    .sort(([, a], [, b]) => b - a)
                    .map(([method, factor]) => (
                      <div
                        key={method}
                        className="flex items-center justify-between rounded-sm bg-bg-subtle px-3 py-2"
                      >
                        <span className="text-xs text-text-primary">
                          {method}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-text-muted">
                          {factor}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<Factory className="h-10 w-10" />}
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
