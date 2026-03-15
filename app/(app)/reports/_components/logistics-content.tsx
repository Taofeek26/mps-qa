"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
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
  Navigation,
  CalendarCheck,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DataTable } from "@/components/ui/data-table";
import { ProgressBar } from "@/components/ui/progress-bar";
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
import {
  getFuelRecords,
  getRouteSchedules,
  getTruckLoads,
} from "@/lib/mock-kpi-data";
import { cn } from "@/lib/utils";
import { USStateMap } from "@/components/charts/us-state-map";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
import { getSites, getReceivingFacilities } from "@/lib/mock-data";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";


/* ---- Sparkline ---- */

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

/* ---- Facility Summary Row Type ---- */

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

/* ---- Content ---- */

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
    transporterName,
    setTransporterName,
    transporterOptions,
    receivingState,
    setReceivingState,
    receivingStateOptions,
    receivingCompany,
    setReceivingCompany,
    receivingCompanyOptions,
  } = useReportFilters();

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [facilityPage, setFacilityPage] = React.useState(1);
  const hasData = shipments.length > 0;

  const filterSummary = [clientId && "Customer filtered", siteId && "Site filtered", transporterName && "Transporter filtered", receivingState && "State filtered", receivingCompany && "Company filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("logistics", shipments, filterSummary);

  /* ---- KPIs ---- */

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
      totalMiles: Math.round(totalMiles),
      totalShipments: shipments.length,
    };
  }, [shipments]);

  /* ---- State Choropleth Data ---- */

  const stateMapData = React.useMemo(() => {
    const byState = new Map<string, { volume: number; shipments: number; cost: number }>();
    shipments.forEach((s) => {
      const st = s.receivingState;
      if (!st) return;
      const existing = byState.get(st) ?? { volume: 0, shipments: 0, cost: 0 };
      existing.volume += s.weightValue;
      existing.shipments += 1;
      existing.cost += totalMpsCost(s);
      byState.set(st, existing);
    });
    return Array.from(byState.entries()).map(([state, d]) => ({
      state,
      value: Math.round(d.volume / 2000),
      label: `${d.shipments} shipments · $${(d.cost / 1000).toFixed(0)}k cost`,
    }));
  }, [shipments]);

  const siteMarkers = React.useMemo(() => {
    const STATE_COORDS: Record<string, [number, number]> = {
      TN: [-86.58, 35.86], OH: [-82.76, 40.39], IL: [-89.20, 40.06],
      MI: [-84.54, 43.33], NC: [-79.80, 35.63], TX: [-99.36, 31.05],
      SC: [-80.95, 33.86],
    };
    const sites = getSites();
    const facilities = getReceivingFacilities();

    // Group by state: 1 site marker + 1 facility marker per state
    const bySite = new Map<string, string[]>();
    sites.forEach((s) => {
      if (!s.state) return;
      const list = bySite.get(s.state) ?? [];
      list.push(s.name);
      bySite.set(s.state, list);
    });

    const byFac = new Map<string, string[]>();
    facilities.forEach((f) => {
      const st = f.state;
      if (!st) return;
      const list = byFac.get(st) ?? [];
      list.push(f.facilityName);
      byFac.set(st, list);
    });

    const markers: Array<{ name: string; coordinates: [number, number]; type: "site" | "facility" }> = [];

    bySite.forEach((names, st) => {
      const base = STATE_COORDS[st];
      if (!base) return;
      markers.push({
        name: names.join(", "),
        coordinates: [base[0] - 0.3, base[1] + 0.25],
        type: "site",
      });
    });

    byFac.forEach((names, st) => {
      const base = STATE_COORDS[st];
      if (!base) return;
      markers.push({
        name: names.join(", "),
        coordinates: [base[0] + 0.3, base[1] - 0.25],
        type: "facility",
      });
    });

    return markers;
  }, []);

  /* ---- Distance Distribution Histogram ---- */

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

  /* ---- Facility Summary ---- */

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

  /* ---- Waste Flow: Site -> Facility ---- */

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

  /* ---- Facility Utilization ---- */

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

  /* ---- Fleet & Efficiency: Fuel Records ---- */

  const fuelData = React.useMemo(() => {
    const records = getFuelRecords();
    return records
      .map((r) => ({
        transporter: r.transporterName,
        mpg: Math.round(r.mpg * 10) / 10,
        costPerMile: Math.round(r.fuelCostPerMile * 100) / 100,
      }))
      .sort((a, b) => b.mpg - a.mpg);
  }, []);

  /* ---- Fleet & Efficiency: Route Schedule Adherence ---- */

  const routeAdherence = React.useMemo(() => {
    const schedules = getRouteSchedules();
    const total = schedules.length;
    const onTimeCount = schedules.filter((s) => s.onTime).length;
    const onTimePct = total > 0 ? Math.round((onTimeCount / total) * 100) : 0;

    const bySite = new Map<string, { total: number; onTime: number }>();
    schedules.forEach((s) => {
      const existing = bySite.get(s.siteName) ?? { total: 0, onTime: 0 };
      existing.total++;
      if (s.onTime) existing.onTime++;
      bySite.set(s.siteName, existing);
    });

    const siteBreakdown = Array.from(bySite.entries())
      .map(([siteName, d]) => ({
        siteName,
        total: d.total,
        onTime: d.onTime,
        pct: d.total > 0 ? Math.round((d.onTime / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct);

    return { onTimePct, totalRoutes: total, onTimeCount, siteBreakdown };
  }, []);

  /* ---- Fleet & Efficiency: Truck Capacity Utilization ---- */

  const truckCapacity = React.useMemo(() => {
    const loads = getTruckLoads();

    // Group by transporter, then list trucks
    const byTransporter = new Map<
      string,
      Array<{ truckId: string; utilization: number; loaded: number; max: number }>
    >();

    loads.forEach((t) => {
      const group = byTransporter.get(t.transporterName) ?? [];
      const utilization = Math.round((t.loadedWeightLbs / t.maxWeightLbs) * 100);
      group.push({
        truckId: t.truckId,
        utilization,
        loaded: t.loadedWeightLbs,
        max: t.maxWeightLbs,
      });
      byTransporter.set(t.transporterName, group);
    });

    // Flatten for horizontal bar chart: label = "Transporter - TruckId"
    const chartData = loads
      .map((t) => ({
        label: `${t.transporterName.split(" ").slice(0, 2).join(" ")} - ${t.truckId}`,
        transporter: t.transporterName,
        utilization: Math.round((t.loadedWeightLbs / t.maxWeightLbs) * 100),
      }))
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 15);

    const avgUtil =
      loads.length > 0
        ? Math.round(
            loads.reduce(
              (sum, t) => sum + (t.loadedWeightLbs / t.maxWeightLbs) * 100,
              0
            ) / loads.length
          )
        : 0;

    return { chartData, avgUtil, totalTrucks: loads.length };
  }, []);

  /* ---- CSV Export ---- */

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

  /* ---- Facility Table Columns ---- */

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
          <Badge variant="neutral">{STATE_NAMES[getValue() as string] ?? getValue() as string}</Badge>
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

  /* ---- Reset pagination on filter change ---- */

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
            title="Total Miles"
            value={kpis.totalMiles.toLocaleString()}
            subtitle="All shipments combined"
            icon={Navigation}
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
              { value: "all", label: "All States" },
              ...receivingStateOptions.map((s) => ({ value: s, label: STATE_NAMES[s] ?? s })),
            ]}
            value={receivingState || "all"}
            onChange={setReceivingState}
            placeholder="All States"
            className="w-full sm:w-[200px]"
          />
          <SearchableSelect
            options={[
              { value: "all", label: "All Receiving Co." },
              ...receivingCompanyOptions.map((c) => ({ value: c, label: c })),
            ]}
            value={receivingCompany || "all"}
            onChange={setReceivingCompany}
            placeholder="All Receiving Co."
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
        <PillTabs defaultValue="distribution">
          <PillTabsList>
            <PillTabsTrigger value="distribution">Distribution</PillTabsTrigger>
            <PillTabsTrigger value="flows">Waste Flows</PillTabsTrigger>
            <PillTabsTrigger value="fleet">Fleet & Efficiency</PillTabsTrigger>
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
                      width={30}
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
                    margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v}%`}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      width={95}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
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
                              ? "var(--color-error-400)"
                              : entry.utilization > 80
                                ? "var(--color-warning-400)"
                                : "var(--color-success-400)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <ChartContainer
              title="Shipment Volume by State"
              subtitle="Receiving facility states — colored by waste tonnage, with site and facility markers"
              chartClassName="h-auto"
            >
              <USStateMap
                data={stateMapData}
                markers={siteMarkers}
                valueFormatter={(v) => `${v.toLocaleString()} tons`}
              />
            </ChartContainer>
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
                        className="grid items-center gap-2 sm:gap-3" style={{ gridTemplateColumns: "100px 1fr 120px 80px" }}
                      >
                        <span className="text-xs font-medium text-text-primary truncate text-right">
                          {flow.source}
                        </span>
                        <div className="relative h-5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all"
                            style={{ width: `${widthPct}%`, backgroundColor: "var(--color-primary-300)" }}
                          />
                        </div>
                        <span className="text-xs text-text-muted truncate">
                          {flow.target}
                        </span>
                        <span className="text-xs tabular-nums text-text-primary text-right">
                          {(flow.volume / 1000).toFixed(1)}k lbs
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </PillTabsContent>

          {/* Fleet & Efficiency */}
          <PillTabsContent value="fleet" className="space-y-4">
            {/* Fuel Efficiency Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Fuel Efficiency by Transporter"
                subtitle="Miles per gallon (MPG) — higher is better"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fuelData}
                    margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      dataKey="transporter"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v} mpg`}
                      width={45}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [`${value} MPG`, "Fuel Efficiency"]}
                    />
                    <Bar dataKey="mpg" name="MPG" radius={[4, 4, 0, 0]}>
                      {fuelData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.mpg >= 7
                              ? "var(--color-success-400)"
                              : entry.mpg >= 5.5
                                ? "var(--color-warning-400)"
                                : "var(--color-error-400)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Route Schedule Adherence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-text-muted" />
                    Route Schedule Adherence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Overall KPI */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[26px] sm:text-[32px] font-extrabold text-text-primary leading-tight">
                        {routeAdherence.onTimePct}%
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-muted">
                        On-Time
                      </p>
                    </div>
                    <div className="flex-1 text-xs text-text-muted space-y-1">
                      <p>{routeAdherence.onTimeCount} of {routeAdherence.totalRoutes} routes on schedule</p>
                      <ProgressBar value={routeAdherence.onTimePct} max={100} />
                    </div>
                  </div>
                  {/* Per-site breakdown */}
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      By Site
                    </p>
                    {routeAdherence.siteBreakdown.map((site) => (
                      <div key={site.siteName} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-text-primary truncate">
                            {site.siteName}
                          </span>
                          <span className="tabular-nums text-text-muted whitespace-nowrap ml-2">
                            {site.pct}% ({site.onTime}/{site.total})
                          </span>
                        </div>
                        <ProgressBar value={site.pct} max={100} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Truck Capacity Utilization */}
            <ChartContainer
              title="Truck Capacity Utilization"
              subtitle={`Average ${truckCapacity.avgUtil}% across ${truckCapacity.totalTrucks} trucks — loaded weight vs max weight`}
            >
              <ResponsiveContainer width="100%" height={Math.min(truckCapacity.chartData.length * 28 + 40, 350)}>
                <BarChart
                  data={truckCapacity.chartData}
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
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
                    width={120}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value) => [`${value}%`, "Utilization"]}
                  />
                  <Bar
                    dataKey="utilization"
                    name="Capacity %"
                    radius={[0, 4, 4, 0]}
                  >
                    {truckCapacity.chartData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          entry.utilization >= 90
                            ? "var(--color-success-400)"
                            : entry.utilization >= 75
                              ? "var(--color-warning-400)"
                              : "var(--color-error-400)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </PillTabsContent>

          {/* Facilities Data Table */}
          <PillTabsContent value="facilities">
            <div ref={tableRef}>
            <DataTable
              columns={facilityColumns}
              data={facilitySummary.slice(
                (facilityPage - 1) * pageSize,
                facilityPage * pageSize
              )}
              pagination={{
                page: facilityPage,
                pageSize: pageSize,
                total: facilitySummary.length,
              }}
              onPaginationChange={setFacilityPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No facility data found
                </div>
              }
            />
            </div>
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
