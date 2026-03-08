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
  Cell,
} from "recharts";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Route,
  Building2,
  MapPin,
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
} from "@/components/charts";
import { totalMpsCost, downloadCsv } from "@/lib/report-utils";
import { cn } from "@/lib/utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";

const PAGE_SIZE = 10;

/* ─── Sparkline ─── */

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`
    )
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      className={cn("text-primary-400", className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ─── Facility Summary Row Type ─── */

interface FacilityRow {
  name: string;
  company: string;
  state: string;
  epaId: string;
  shipments: number;
  volume: number;
  avgMiles: number;
  cost: number;
  sparkline: number[];
}

/* ─── Content ─── */

export function LogisticsContent() {
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

  const [facilityPage, setFacilityPage] = React.useState(1);
  const hasData = shipments.length > 0;

  const filterSummary = [clientId && "Customer filtered", siteId && "Site filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("logistics", shipments, filterSummary);

  /* ─── KPIs ─── */

  const kpis = React.useMemo(() => {
    const facilitySet = new Set<string>();
    const transporterSet = new Set<string>();
    let totalMiles = 0;
    let milesCount = 0;

    shipments.forEach((s) => {
      if (s.receivingFacility) facilitySet.add(s.receivingFacility);
      if (s.transporterName) transporterSet.add(s.transporterName);
      if (s.milesFromFacility && s.milesFromFacility > 0) {
        totalMiles += s.milesFromFacility;
        milesCount++;
      }
    });

    return {
      facilitiesUsed: facilitySet.size,
      transportersUsed: transporterSet.size,
      avgMiles: milesCount > 0 ? Math.round(totalMiles / milesCount) : 0,
      totalShipments: shipments.length,
    };
  }, [shipments]);

  /* ─── Distance Distribution Histogram ─── */

  const distanceHistogram = React.useMemo(() => {
    const buckets: Record<string, number> = {
      "0-25 mi": 0,
      "25-50 mi": 0,
      "50-100 mi": 0,
      "100-200 mi": 0,
      "200+ mi": 0,
    };
    shipments.forEach((s) => {
      const miles = s.milesFromFacility ?? 0;
      if (miles <= 0) return;
      if (miles <= 25) buckets["0-25 mi"]++;
      else if (miles <= 50) buckets["25-50 mi"]++;
      else if (miles <= 100) buckets["50-100 mi"]++;
      else if (miles <= 200) buckets["100-200 mi"]++;
      else buckets["200+ mi"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));
  }, [shipments]);

  const distanceBucketColors = [
    CATEGORY_COLORS[1], // green
    CATEGORY_COLORS[0], // blue
    CATEGORY_COLORS[2], // amber
    CATEGORY_COLORS[3], // red
    CATEGORY_COLORS[4], // violet
  ];

  /* ─── Facility Summary ─── */

  const facilitySummary = React.useMemo(() => {
    const byFacility = new Map<
      string,
      {
        company: string;
        state: string;
        epaId: string;
        shipments: number;
        volume: number;
        totalMiles: number;
        milesCount: number;
        cost: number;
        monthlyVolume: Map<string, number>;
      }
    >();

    shipments.forEach((s) => {
      const fname = s.receivingFacility ?? "Unknown";
      const existing = byFacility.get(fname) ?? {
        company: s.receivingCompany ?? "",
        state: s.receivingState ?? "",
        epaId: s.receivingEpaId ?? "",
        shipments: 0,
        volume: 0,
        totalMiles: 0,
        milesCount: 0,
        cost: 0,
        monthlyVolume: new Map(),
      };
      existing.shipments++;
      existing.volume += s.weightValue;
      existing.cost += totalMpsCost(s);
      if (s.milesFromFacility && s.milesFromFacility > 0) {
        existing.totalMiles += s.milesFromFacility;
        existing.milesCount++;
      }
      const monthKey = s.shipmentDate.slice(0, 7);
      existing.monthlyVolume.set(
        monthKey,
        (existing.monthlyVolume.get(monthKey) ?? 0) + s.weightValue
      );
      byFacility.set(fname, existing);
    });

    return Array.from(byFacility.entries())
      .map(([name, d]) => {
        const months = Array.from(d.monthlyVolume.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, v]) => v);
        return {
          name,
          company: d.company,
          state: d.state,
          epaId: d.epaId,
          shipments: d.shipments,
          volume: Math.round(d.volume),
          avgMiles:
            d.milesCount > 0
              ? Math.round(d.totalMiles / d.milesCount)
              : 0,
          cost: Math.round(d.cost),
          sparkline: months,
        };
      })
      .sort((a, b) => b.volume - a.volume);
  }, [shipments]);

  /* ─── Waste Flow: Site -> Facility ─── */

  const wasteFlows = React.useMemo(() => {
    const flows = new Map<string, { volume: number; shipments: number }>();
    shipments.forEach((s) => {
      const key = `${s.siteName}\u2192${s.receivingFacility ?? "Unknown"}`;
      const existing = flows.get(key) ?? { volume: 0, shipments: 0 };
      existing.volume += s.weightValue;
      existing.shipments++;
      flows.set(key, existing);
    });
    return Array.from(flows.entries())
      .map(([key, d]) => {
        const [source, target] = key.split("\u2192");
        return {
          source,
          target,
          volume: Math.round(d.volume),
          shipments: d.shipments,
        };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 15);
  }, [shipments]);

  const maxFlowVolume = Math.max(
    ...wasteFlows.map((f) => f.volume),
    1
  );

  /* ─── Facility Utilization ─── */

  const facilityUtilization = React.useMemo(() => {
    return facilitySummary
      .filter((f) => f.sparkline.length >= 2)
      .map((f) => {
        const avg =
          f.sparkline.reduce((sum, v) => sum + v, 0) / f.sparkline.length;
        const latest = f.sparkline[f.sparkline.length - 1] ?? 0;
        const utilization = avg > 0 ? Math.round((latest / avg) * 100) : 0;
        return {
          name: f.name,
          utilization,
          latest: Math.round(latest),
          avg: Math.round(avg),
        };
      })
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 8);
  }, [facilitySummary]);

  /* ─── CSV Export ─── */

  const handleExport = () => {
    const headers = [
      "Facility",
      "Company",
      "State",
      "EPA ID",
      "Shipments",
      "Volume (lbs)",
      "Avg Miles",
      "Total Cost",
    ];
    const rows = facilitySummary.map((f) => [
      f.name,
      f.company,
      f.state,
      f.epaId,
      String(f.shipments),
      String(f.volume),
      String(f.avgMiles),
      `$${f.cost}`,
    ]);
    downloadCsv("Logistics_Facilities_Report.csv", headers, rows);
  };

  /* ─── Facility Table Columns ─── */

  const facilityColumns: ColumnDef<FacilityRow, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Facility",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ getValue }) => (
          <span className="text-xs text-text-muted">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ getValue }) => (
          <Badge variant="neutral">{getValue() as string}</Badge>
        ),
      },
      {
        accessorKey: "shipments",
        header: "Shipments",
        meta: { align: "center" },
        cell: ({ getValue }) => (getValue() as number).toLocaleString(),
      },
      {
        accessorKey: "volume",
        header: "Volume",
        meta: { align: "center" },
        cell: ({ getValue }) =>
          `${(getValue() as number).toLocaleString()} lbs`,
      },
      {
        accessorKey: "avgMiles",
        header: "Avg Miles",
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const v = getValue() as number;
          return v > 0 ? `${v} mi` : "\u2014";
        },
      },
      {
        accessorKey: "cost",
        header: "Cost",
        meta: { align: "center" },
        cell: ({ getValue }) =>
          `$${(getValue() as number).toLocaleString()}`,
      },
      {
        id: "trend",
        header: "Trend",
        meta: { align: "center" },
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Sparkline data={row.original.sparkline} />
          </div>
        ),
      },
    ],
    []
  );

  /* ─── Reset pagination on filter change ─── */

  React.useEffect(() => {
    setFacilityPage(1);
  }, [shipments]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Facilities Used"
            value={kpis.facilitiesUsed}
            subtitle="Receiving locations"
            icon={Building2}
          />
          <KpiCard
            title="Transporters"
            value={kpis.transportersUsed}
            subtitle="Unique carriers"
            icon={Truck}
          />
          <KpiCard
            title="Avg Distance"
            value={`${kpis.avgMiles} mi`}
            subtitle="Per shipment"
            icon={MapPin}
          />
          <KpiCard
            title="Total Shipments"
            value={kpis.totalShipments}
            subtitle="All routes"
            icon={Route}
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
        <PillTabs defaultValue="distribution">
          <PillTabsList>
            <PillTabsTrigger value="distribution">Distribution</PillTabsTrigger>
            <PillTabsTrigger value="flows">Waste Flows</PillTabsTrigger>
            <PillTabsTrigger value="facilities" count={facilitySummary.length}>
              Facilities
            </PillTabsTrigger>
          </PillTabsList>

          {/* Distribution: Distance Histogram + Facility Utilization */}
          <PillTabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Distance Distribution"
                subtitle="Shipments by distance to receiving facility"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distanceHistogram}
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
                    <Bar dataKey="count" name="Shipments" radius={[4, 4, 0, 0]}>
                      {distanceHistogram.map((_, idx) => (
                        <Cell key={idx} fill={distanceBucketColors[idx]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer
                title="Facility Utilization"
                subtitle="Current period vs historical average (% of avg)"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={facilityUtilization}
                    layout="vertical"
                    margin={{ top: 5, right: 40, bottom: 5, left: 100 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      width={95}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [`${value}%`, "Utilization"]}
                    />
                    <Bar
                      dataKey="utilization"
                      name="Utilization %"
                      radius={[0, 4, 4, 0]}
                    >
                      {facilityUtilization.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.utilization > 120
                              ? CATEGORY_COLORS[3]
                              : entry.utilization > 80
                                ? CATEGORY_COLORS[1]
                                : CATEGORY_COLORS[2]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Waste Flows: Site -> Facility */}
          <PillTabsContent value="flows">
            <Card>
              <CardHeader>
                <CardTitle>Waste Flow — Site to Facility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {wasteFlows.map((flow) => {
                    const widthPct = (flow.volume / maxFlowVolume) * 100;
                    return (
                      <div
                        key={`${flow.source}-${flow.target}`}
                        className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr_auto] items-center gap-2 sm:gap-3"
                      >
                        <span className="text-xs font-medium text-text-primary truncate text-right">
                          {flow.source}
                        </span>
                        <div className="relative h-5 w-32 sm:w-48 rounded-full bg-bg-subtle overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-primary-300 transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted truncate">
                          {flow.target}
                        </span>
                        <span className="text-xs tabular-nums text-text-primary whitespace-nowrap">
                          {(flow.volume / 1000).toFixed(1)}k lbs
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </PillTabsContent>

          {/* Facilities Data Table */}
          <PillTabsContent value="facilities">
            <DataTable
              columns={facilityColumns}
              data={facilitySummary.slice(
                (facilityPage - 1) * PAGE_SIZE,
                facilityPage * PAGE_SIZE
              )}
              pagination={{
                page: facilityPage,
                pageSize: PAGE_SIZE,
                total: facilitySummary.length,
              }}
              onPaginationChange={setFacilityPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No facility data found
                </div>
              }
            />
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<Route className="h-10 w-10" />}
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
