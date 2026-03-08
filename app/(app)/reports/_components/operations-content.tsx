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
  Legend,
  Treemap,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  Building2,
  RotateCcw,
  Trophy,
  TrendingUp,
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
import { ChartContainer, CATEGORY_COLORS, TOOLTIP_STYLE } from "@/components/charts";
import {
  getMonthKey,
  formatMonthLabel,
  totalMpsCost,
  totalCustomerCost,
  downloadCsv,
} from "@/lib/report-utils";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/lib/types";

import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";

const PAGE_SIZE = 10;


/* ─── Sparkline (inline SVG mini chart) ─── */

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map(
      (v, i) =>
        `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * h}`
    )
    .join(" ");
  return (
    <svg width={w} height={h} className={cn("text-primary-400", className)}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ─── Star rating renderer ─── */

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full",
            i < rating ? "bg-warning-500" : "bg-bg-muted"
          )}
        />
      ))}
    </span>
  );
}

/* ─── Treemap custom content renderer ─── */

function TreemapContent(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  size?: number;
  color?: string;
  fill?: string;
}) {
  const { x, y, width, height, name, size, color, fill } = props;
  if (width < 40 || height < 24) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={color ?? fill ?? "var(--color-primary-400)"}
        style={{ stroke: "var(--color-bg-surface)", strokeWidth: 2 }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 6}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: Math.min(11, width / 8), fill: "#fff", fontWeight: 600 }}
      >
        {(name ?? "").length > width / 7 ? (name ?? "").slice(0, Math.floor(width / 7)) + "..." : name}
      </text>
      {height > 36 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 9, fill: "rgba(255,255,255,0.8)" }}
        >
          {(size ?? 0).toLocaleString()} lbs
        </text>
      )}
    </g>
  );
}

/* ─── Helpers ─── */

function getMonthKeys(shipments: Shipment[]): string[] {
  const set = new Set<string>();
  shipments.forEach((s) => set.add(getMonthKey(s.shipmentDate)));
  return Array.from(set).sort();
}

/* ─── Leaderboard row type ─── */

interface LeaderboardRow {
  id: string;
  name: string;
  volume: number;
  shipments: number;
  mps: number;
  cust: number;
  margin: number;
  sparkData: number[];
}

/* ─── Transporter row type ─── */

interface TransporterRow {
  name: string;
  shipments: number;
  volume: number;
  totalMiles: number;
  totalCost: number;
  avgMiles: number;
  rating: number;
}

/* ─── Rank badge helpers ─── */

const rankBadgeVariant = (rank: number) => {
  if (rank === 1) return "warning" as const;
  return "neutral" as const;
};

const rankLabel = (rank: number) => {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
};

/* ════════════════════════════════════════════
   Operational Intelligence Content
   ════════════════════════════════════════════ */

export function OperationsContent() {
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

  const [leaderboardPage, setLeaderboardPage] = React.useState(1);
  const [transporterPage, setTransporterPage] = React.useState(1);

  const hasData = shipments.length > 0;

  const filterSummary = [clientId && "Customer filtered", siteId && "Site filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("operations", shipments, filterSummary);

  const monthKeys = React.useMemo(() => getMonthKeys(shipments), [shipments]);

  /* ─── KPI Data ─── */

  const kpis = React.useMemo(() => {
    const activeSiteIds = new Set(shipments.map((s) => s.siteId));
    const totalVolume = shipments.reduce((sum, s) => sum + s.weightValue, 0);
    const transporterIds = new Set(
      shipments.map((s) => s.vendorId).filter(Boolean)
    );

    // Per-site margin
    const siteMap = new Map<
      string,
      { mps: number; cust: number; volume: number }
    >();
    shipments.forEach((s) => {
      const existing = siteMap.get(s.siteId) ?? { mps: 0, cust: 0, volume: 0 };
      existing.mps += totalMpsCost(s);
      existing.cust += totalCustomerCost(s);
      existing.volume += s.weightValue;
      siteMap.set(s.siteId, existing);
    });

    let topSite = "";
    let topMargin = -Infinity;
    siteMap.forEach((data, sid) => {
      const margin =
        data.cust > 0 ? ((data.cust - data.mps) / data.cust) * 100 : 0;
      if (margin > topMargin) {
        topMargin = margin;
        topSite =
          shipments.find((s) => s.siteId === sid)?.siteName ?? sid;
      }
    });

    return {
      activeSites: activeSiteIds.size,
      avgVolumePerSite:
        activeSiteIds.size > 0
          ? Math.round(totalVolume / activeSiteIds.size)
          : 0,
      topSite,
      topMargin: Math.round(topMargin * 10) / 10,
      totalTransporters: transporterIds.size,
    };
  }, [shipments]);

  /* ─── Site Leaderboard ─── */

  const siteLeaderboard = React.useMemo(() => {
    const siteMap = new Map<
      string,
      {
        name: string;
        volume: number;
        shipments: number;
        mps: number;
        cust: number;
        monthly: Map<string, number>;
      }
    >();

    shipments.forEach((s) => {
      const existing = siteMap.get(s.siteId) ?? {
        name: s.siteName,
        volume: 0,
        shipments: 0,
        mps: 0,
        cust: 0,
        monthly: new Map<string, number>(),
      };
      existing.volume += s.weightValue;
      existing.shipments += 1;
      existing.mps += totalMpsCost(s);
      existing.cust += totalCustomerCost(s);
      const mk = getMonthKey(s.shipmentDate);
      existing.monthly.set(mk, (existing.monthly.get(mk) ?? 0) + s.weightValue);
      siteMap.set(s.siteId, existing);
    });

    return Array.from(siteMap.entries())
      .map(([id, d]) => {
        const margin =
          d.cust > 0 ? ((d.cust - d.mps) / d.cust) * 100 : 0;
        const sparkData = monthKeys.map((k) => d.monthly.get(k) ?? 0);
        return {
          id,
          name: d.name,
          volume: Math.round(d.volume),
          shipments: d.shipments,
          mps: Math.round(d.mps),
          cust: Math.round(d.cust),
          margin: Math.round(margin * 10) / 10,
          sparkData,
        };
      })
      .sort((a, b) => b.margin - a.margin);
  }, [shipments, monthKeys]);

  /* ─── Waste Type Treemap ─── */

  const wasteTypeData = React.useMemo(() => {
    const byType = new Map<string, { volume: number; cost: number }>();
    shipments.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? {
        volume: 0,
        cost: 0,
      };
      existing.volume += s.weightValue;
      existing.cost += totalMpsCost(s);
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name,
        volume: Math.round(d.volume),
        cost: Math.round(d.cost),
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [shipments]);

  const treemapData = React.useMemo(
    () =>
      wasteTypeData.map((d, idx) => ({
        name: d.name,
        size: d.volume,
        cost: d.cost,
        fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      })),
    [wasteTypeData]
  );

  /* ─── Hazardous vs Non-Hazardous Diverging Bar ─── */

  const hazDivergingData = React.useMemo(() => {
    const bySite = new Map<
      string,
      { name: string; haz: number; nonHaz: number }
    >();
    shipments.forEach((s) => {
      const existing = bySite.get(s.siteId) ?? {
        name: s.siteName,
        haz: 0,
        nonHaz: 0,
      };
      if (s.wasteCategory === "Hazardous Waste") {
        existing.haz += s.weightValue;
      } else {
        existing.nonHaz += s.weightValue;
      }
      bySite.set(s.siteId, existing);
    });
    return Array.from(bySite.values())
      .map((d) => ({
        name: d.name,
        Hazardous: Math.round(d.haz),
        "Non-Hazardous": -Math.round(d.nonHaz),
      }))
      .sort(
        (a, b) =>
          b.Hazardous + Math.abs(b["Non-Hazardous"]) -
          (a.Hazardous + Math.abs(a["Non-Hazardous"]))
      );
  }, [shipments]);

  /* ─── Transporter Performance ─── */

  const transporterData = React.useMemo(() => {
    const byTransporter = new Map<
      string,
      {
        name: string;
        shipments: number;
        volume: number;
        totalMiles: number;
        totalCost: number;
      }
    >();
    shipments.forEach((s) => {
      const name = s.transporterName ?? s.vendorName;
      const existing = byTransporter.get(name) ?? {
        name,
        shipments: 0,
        volume: 0,
        totalMiles: 0,
        totalCost: 0,
      };
      existing.shipments += 1;
      existing.volume += s.weightValue;
      existing.totalMiles += s.milesFromFacility ?? 0;
      existing.totalCost += totalMpsCost(s);
      byTransporter.set(name, existing);
    });

    const entries = Array.from(byTransporter.values()).sort(
      (a, b) => b.volume - a.volume
    );

    // Rating based on volume efficiency (volume per shipment)
    const efficiencies = entries.map(
      (e) => (e.shipments > 0 ? e.volume / e.shipments : 0)
    );
    const maxEff = Math.max(...efficiencies, 1);

    return entries.map((e, i) => ({
      ...e,
      avgMiles:
        e.shipments > 0 ? Math.round(e.totalMiles / e.shipments) : 0,
      rating: Math.max(
        1,
        Math.min(5, Math.round((efficiencies[i] / maxEff) * 5))
      ),
    }));
  }, [shipments]);

  /* ─── Small Multiples (per-site mini charts) ─── */

  const smallMultiples = React.useMemo(() => {
    const bySite = new Map<string, { name: string; monthly: Map<string, number> }>();
    shipments.forEach((s) => {
      const existing = bySite.get(s.siteId) ?? {
        name: s.siteName,
        monthly: new Map<string, number>(),
      };
      const mk = getMonthKey(s.shipmentDate);
      existing.monthly.set(mk, (existing.monthly.get(mk) ?? 0) + s.weightValue);
      bySite.set(s.siteId, existing);
    });

    let maxMoMChange = 0;
    let highlightSiteId = "";

    const sites = Array.from(bySite.entries()).map(([id, d]) => {
      const data = monthKeys.map((k) => ({
        month: formatMonthLabel(k),
        volume: Math.round(d.monthly.get(k) ?? 0),
      }));

      // Calculate max month-over-month change
      let biggestChange = 0;
      for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1].volume;
        const curr = data[i].volume;
        const change = prev > 0 ? Math.abs((curr - prev) / prev) * 100 : 0;
        if (change > biggestChange) biggestChange = change;
      }

      if (biggestChange > maxMoMChange) {
        maxMoMChange = biggestChange;
        highlightSiteId = id;
      }

      return { id, name: d.name, data };
    });

    return { sites, highlightSiteId };
  }, [shipments, monthKeys]);

  /* ─── CSV Export ─── */

  const handleExport = () => {
    const headers = [
      "Site",
      "Volume (lbs)",
      "Shipments",
      "MPS Cost",
      "Customer Cost",
      "Margin %",
    ];
    const rows = siteLeaderboard.map((s) => [
      s.name,
      String(s.volume),
      String(s.shipments),
      `$${s.mps}`,
      `$${s.cust}`,
      `${s.margin}%`,
    ]);
    downloadCsv("Operational_Intelligence_Report.csv", headers, rows);
  };

  /* ─── Leaderboard Table Columns ─── */

  const leaderboardColumns: ColumnDef<LeaderboardRow, unknown>[] = React.useMemo(
    () => [
      {
        id: "rank",
        header: "Rank",
        cell: ({ row }) => {
          const rank = row.index + (leaderboardPage - 1) * PAGE_SIZE + 1;
          return (
            <Badge
              variant={rankBadgeVariant(rank)}
              className={cn(
                rank === 1 && "bg-warning-100 text-warning-700",
                rank === 2 && "bg-neutral-200 text-neutral-700",
                rank === 3 && "bg-warning-50 text-warning-600"
              )}
            >
              {rankLabel(rank)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Site",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "volume",
        header: "Volume (lbs)",
        meta: { align: "center" },
        cell: ({ getValue }) => (getValue() as number).toLocaleString(),
      },
      {
        accessorKey: "shipments",
        header: "Shipments",
        meta: { align: "center" },
        cell: ({ getValue }) => getValue() as number,
      },
      {
        accessorKey: "mps",
        header: "MPS Cost",
        meta: { align: "center" },
        cell: ({ getValue }) => `$${(getValue() as number).toLocaleString()}`,
      },
      {
        accessorKey: "cust",
        header: "Customer Cost",
        meta: { align: "center" },
        cell: ({ getValue }) => `$${(getValue() as number).toLocaleString()}`,
      },
      {
        accessorKey: "margin",
        header: "Margin %",
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const margin = getValue() as number;
          return (
            <span
              className={cn(
                "font-semibold",
                margin >= 0 ? "text-success-600" : "text-error-600"
              )}
            >
              {margin}%
            </span>
          );
        },
      },
      {
        id: "trend",
        header: "Trend",
        meta: { align: "center" },
        cell: ({ row }) => <Sparkline data={row.original.sparkData} />,
      },
    ],
    [leaderboardPage]
  );

  /* ─── Transporter Table Columns ─── */

  const transporterColumns: ColumnDef<TransporterRow, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Transporter",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "shipments",
        header: "Shipments",
        meta: { align: "center" },
        cell: ({ getValue }) => getValue() as number,
      },
      {
        accessorKey: "volume",
        header: "Volume (lbs)",
        meta: { align: "center" },
        cell: ({ getValue }) => Math.round(getValue() as number).toLocaleString(),
      },
      {
        accessorKey: "avgMiles",
        header: "Avg Miles",
        meta: { align: "center" },
        cell: ({ getValue }) => getValue() as number,
      },
      {
        accessorKey: "totalCost",
        header: "Total Cost",
        meta: { align: "center" },
        cell: ({ getValue }) => `$${Math.round(getValue() as number).toLocaleString()}`,
      },
      {
        id: "rating",
        header: "Rating",
        meta: { align: "center" },
        cell: ({ row }) => <StarRating rating={row.original.rating} />,
      },
    ],
    []
  );

  /* ─── Reset pagination on filter change ─── */

  React.useEffect(() => {
    setLeaderboardPage(1);
    setTransporterPage(1);
  }, [shipments]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Total Sites Active"
            value={kpis.activeSites}
            subtitle="With shipments"
            icon={Building2}
          />
          <KpiCard
            title="Avg Volume per Site"
            value={`${(kpis.avgVolumePerSite / 1000).toFixed(1)}k lbs`}
            subtitle="Across all sites"
            icon={Activity}
          />
          <KpiCard
            title="Top Site (by Margin)"
            value={kpis.topSite}
            subtitle={`${kpis.topMargin}% margin`}
            icon={Trophy}
            variant="success"
          />
          <KpiCard
            title="Total Transporters Used"
            value={kpis.totalTransporters}
            subtitle="Unique carriers"
            icon={TrendingUp}
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
        <PillTabs defaultValue="leaderboard">
          <PillTabsList>
            <PillTabsTrigger value="leaderboard">Site Leaderboard</PillTabsTrigger>
            <PillTabsTrigger value="composition">Waste Composition</PillTabsTrigger>
            <PillTabsTrigger value="transporters" count={transporterData.length}>Transporters</PillTabsTrigger>
            <PillTabsTrigger value="site-trends">Site Trends</PillTabsTrigger>
          </PillTabsList>

          {/* Site Leaderboard */}
          <PillTabsContent value="leaderboard">
            <DataTable
              columns={leaderboardColumns}
              data={siteLeaderboard.slice(
                (leaderboardPage - 1) * PAGE_SIZE,
                leaderboardPage * PAGE_SIZE
              )}
              pagination={{
                page: leaderboardPage,
                pageSize: PAGE_SIZE,
                total: siteLeaderboard.length,
              }}
              onPaginationChange={setLeaderboardPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No site data found
                </div>
              }
            />
          </PillTabsContent>

          {/* Waste Composition: Treemap + Haz Diverging Bar */}
          <PillTabsContent value="composition" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Treemap */}
              <ChartContainer
                title="Waste Type Composition"
                subtitle="Volume distribution by waste type"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    nameKey="name"
                    stroke="var(--color-bg-surface)"
                    content={<TreemapContent x={0} y={0} width={0} height={0} />}
                  />
                </ResponsiveContainer>
              </ChartContainer>

              {/* Hazardous vs Non-Hazardous Diverging Bar */}
              <ChartContainer
                title="Hazardous vs Non-Hazardous"
                subtitle="Diverging volume by site (lbs)"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hazDivergingData}
                    layout="vertical"
                    stackOffset="sign"
                    margin={{ top: 5, right: 40, bottom: 5, left: 100 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) =>
                        `${Math.abs(v / 1000).toFixed(0)}k`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      width={95}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `${Math.abs(Number(value)).toLocaleString()} lbs`,
                        "",
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="Non-Hazardous"
                      stackId="a"
                      fill={CATEGORY_COLORS[1]}
                      name="Non-Hazardous"
                    />
                    <Bar
                      dataKey="Hazardous"
                      stackId="a"
                      fill={CATEGORY_COLORS[3]}
                      name="Hazardous"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Transporter Performance */}
          <PillTabsContent value="transporters">
            <DataTable
              columns={transporterColumns}
              data={transporterData.slice(
                (transporterPage - 1) * PAGE_SIZE,
                transporterPage * PAGE_SIZE
              )}
              pagination={{
                page: transporterPage,
                pageSize: PAGE_SIZE,
                total: transporterData.length,
              }}
              onPaginationChange={setTransporterPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No transporter data found
                </div>
              }
            />
          </PillTabsContent>

          {/* Small Multiples — Mini Charts per Site */}
          <PillTabsContent value="site-trends">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {smallMultiples.sites.map((site) => {
                const isHighlighted =
                  site.id === smallMultiples.highlightSiteId;
                return (
                  <div
                    key={site.id}
                    className={cn(
                      "rounded-[var(--radius-sm)] border p-2",
                      isHighlighted
                        ? "border-primary-400 bg-primary-50"
                        : "border-border-default bg-bg-card"
                    )}
                  >
                    <div className="h-[60px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={site.data}
                          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
                        >
                          <Area
                            type="monotone"
                            dataKey="volume"
                            stroke={
                              isHighlighted
                                ? CATEGORY_COLORS[3]
                                : CATEGORY_COLORS[0]
                            }
                            fill={
                              isHighlighted
                                ? CATEGORY_COLORS[3]
                                : CATEGORY_COLORS[0]
                            }
                            fillOpacity={0.15}
                            strokeWidth={1.5}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-xs font-medium truncate text-center",
                        isHighlighted
                          ? "text-primary-600"
                          : "text-text-muted"
                      )}
                    >
                      {site.name}
                    </p>
                    {isHighlighted && (
                      <p className="text-[10px] text-primary-500 text-center">
                        Biggest MoM change
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<Activity className="h-10 w-10" />}
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
