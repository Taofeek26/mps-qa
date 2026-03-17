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
  MapPin,
  RotateCcw,
  Target,
  Trophy,
  Truck,
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
import {
  ChartContainer,
  CATEGORY_COLORS,
  TOOLTIP_STYLE,
  DonutChart,
} from "@/components/charts";
import {
  getMonthKey,
  formatMonthLabel,
  totalMpsCost,
  totalCustomerCost,
  downloadCsv,
} from "@/lib/report-utils";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/lib/types";
import { useFacilityCapacities, useCollectionEvents } from "@/lib/hooks/use-api-data";
import { CLIENT_INDUSTRY_CODES } from "@/lib/mock-kpi-data";

import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";



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

/* ─── Industry Code row type ─── */

interface IndustryCodeRow {
  clientName: string;
  naics: string;
  description: string;
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
    transporterName,
    setTransporterName,
    transporterOptions,
    serviceFrequency,
    setServiceFrequency,
    serviceFrequencyOptions,
  } = useReportFilters();

  const { facilityCapacities } = useFacilityCapacities();
  const { collectionEvents } = useCollectionEvents();

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [leaderboardPage, setLeaderboardPage] = React.useState(1);
  const [transporterPage, setTransporterPage] = React.useState(1);
  const [industryCodePage, setIndustryCodePage] = React.useState(1);

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

    // Avg Miles/Shipment
    const milesShipments = shipments.filter(
      (s) => s.milesFromFacility != null && s.milesFromFacility > 0
    );
    const avgMiles =
      milesShipments.length > 0
        ? Math.round(
            milesShipments.reduce((sum, s) => sum + (s.milesFromFacility ?? 0), 0) /
              milesShipments.length
          )
        : 0;

    // Target vs Actual %
    const targetShipments = shipments.filter(
      (s) =>
        s.standardizedVolumeLbs != null &&
        s.standardizedVolumeLbs > 0 &&
        s.targetLoadWeight != null &&
        s.targetLoadWeight > 0
    );
    const targetVsActual =
      targetShipments.length > 0
        ? Math.round(
            (targetShipments.reduce(
              (sum, s) =>
                sum +
                ((s.standardizedVolumeLbs ?? 0) / (s.targetLoadWeight ?? 1)) * 100,
              0
            ) /
              targetShipments.length) *
              10
          ) / 10
        : 0;

    // Tons Per Route (unique site+date combo)
    const routeSet = new Set<string>();
    let totalTons = 0;
    shipments.forEach((s) => {
      const key = `${s.siteId}__${s.shipmentDate}`;
      routeSet.add(key);
      totalTons += s.weightValue / 2000;
    });
    const tonsPerRoute =
      routeSet.size > 0
        ? Math.round((totalTons / routeSet.size) * 10) / 10
        : 0;

    return {
      activeSites: activeSiteIds.size,
      avgVolumePerSite:
        activeSiteIds.size > 0
          ? Math.round(totalVolume / activeSiteIds.size)
          : 0,
      topSite,
      topMargin: Math.round(topMargin * 10) / 10,
      totalTransporters: transporterIds.size,
      avgMiles,
      targetVsActual,
      tonsPerRoute,
    };
  }, [shipments]);

  /* ─── Facility Utilization Data ─── */

  const facilityUtilization = React.useMemo(() => {
    return facilityCapacities
      .map((f) => ({
        name: f.facilityName,
        utilization:
          f.monthlyCapacityTons > 0
            ? Math.round(
                (f.monthlyProcessedTons / f.monthlyCapacityTons) * 100 * 10
              ) / 10
            : 0,
        processed: Math.round(f.monthlyProcessedTons),
        capacity: Math.round(f.monthlyCapacityTons),
      }))
      .sort((a, b) => b.utilization - a.utilization);
  }, [facilityCapacities]);

  /* ─── Jobs/Stops per Day (monthly trend) ─── */

  const jobsPerDayTrend = React.useMemo(() => {
    const completed = collectionEvents.filter((e) => e.status === "completed");
    const byMonth = new Map<string, number>();
    completed.forEach((e) => {
      if (e.actualDate) {
        const mk = e.actualDate.slice(0, 7);
        byMonth.set(mk, (byMonth.get(mk) ?? 0) + 1);
      }
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: formatMonthLabel(month),
        completedJobs: count,
      }));
  }, [collectionEvents]);

  /* ─── Volume by Job Type (service frequency) ─── */

  const volumeByJobType = React.useMemo(() => {
    const byFreq = new Map<string, number>();
    shipments.forEach((s) => {
      const freq = s.serviceFrequency ?? "Other";
      const category =
        freq === "On Call"
          ? "On Call"
          : freq.includes("Week") || freq.includes("Month") || freq.includes("Bi")
          ? "Scheduled"
          : "Other";
      byFreq.set(category, (byFreq.get(category) ?? 0) + s.weightValue);
    });
    return Array.from(byFreq.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [shipments]);

  /* ─── Client Industry Codes ─── */

  const industryCodeData = React.useMemo(() => {
    return clients
      .map((c) => {
        const code = CLIENT_INDUSTRY_CODES[c.id];
        return {
          clientName: c.name,
          naics: code?.naics ?? "N/A",
          description: code?.description ?? "Not classified",
        };
      })
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [clients]);

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
          const rank = row.index + (leaderboardPage - 1) * pageSize + 1;
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
    [leaderboardPage, pageSize]
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

  /* ─── Industry Code Table Columns ─── */

  const industryCodeColumns: ColumnDef<IndustryCodeRow, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "clientName",
        header: "Client",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "naics",
        header: "NAICS Code",
        meta: { align: "center" },
        cell: ({ getValue }) => (
          <Badge variant="neutral">{getValue() as string}</Badge>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => getValue() as string,
      },
    ],
    []
  );

  /* ─── Reset pagination on filter change ─── */

  React.useEffect(() => {
    setLeaderboardPage(1);
    setTransporterPage(1);
    setIndustryCodePage(1);
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
            title="Avg Miles/Shipment"
            value={`${kpis.avgMiles} mi`}
            subtitle={`${shipments.filter((s) => s.milesFromFacility != null).length} shipments with data`}
            icon={MapPin}
          />
          <KpiCard
            title="Target vs Actual"
            value={`${kpis.targetVsActual}%`}
            subtitle="Avg load utilization"
            icon={Target}
            variant={kpis.targetVsActual >= 90 ? "success" : kpis.targetVsActual >= 75 ? "warning" : "error"}
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
              { value: "all", label: "All Frequencies" },
              ...serviceFrequencyOptions.map((f) => ({ value: f, label: f })),
            ]}
            value={serviceFrequency || "all"}
            onChange={setServiceFrequency}
            placeholder="All Frequencies"
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
        <PillTabs defaultValue="leaderboard">
          <PillTabsList>
            <PillTabsTrigger value="leaderboard">Site Leaderboard</PillTabsTrigger>
            <PillTabsTrigger value="composition">Waste Composition</PillTabsTrigger>
            <PillTabsTrigger value="transporters" count={transporterData.length}>Transporters</PillTabsTrigger>
            <PillTabsTrigger value="site-trends">Site Trends</PillTabsTrigger>
            <PillTabsTrigger value="operational-metrics">Operational Metrics</PillTabsTrigger>
          </PillTabsList>

          {/* Site Leaderboard */}
          <PillTabsContent value="leaderboard">
            <div ref={tableRef}>
            <DataTable
              columns={leaderboardColumns}
              data={siteLeaderboard.slice(
                (leaderboardPage - 1) * pageSize,
                leaderboardPage * pageSize
              )}
              pagination={{
                page: leaderboardPage,
                pageSize: pageSize,
                total: siteLeaderboard.length,
              }}
              onPaginationChange={setLeaderboardPage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No site data found
                </div>
              }
            />
            </div>
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
                    stroke="var(--color-border-default)"
                    isAnimationActive={false}
                    content={({ x, y, width, height, name, index }: { x: number; y: number; width: number; height: number; name: string; index: number }) => {
                      if (width < 2 || height < 2) return <g />;
                      const showBoth = width > 45 && height > 32;
                      const showName = width > 30 && height > 18;
                      const val = treemapData[index]?.size ?? 0;
                      return (
                        <g>
                          <rect x={x} y={y} width={width} height={height} rx={4} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} stroke="var(--color-bg-card)" strokeWidth={2} />
                          {showBoth ? (
                            <>
                              <text x={x + width / 2} y={y + height / 2 - 7} textAnchor="middle" fill="#fff" fontSize={Math.min(12, width / 6)} style={{ fontWeight: 400, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.03em", textRendering: "geometricPrecision" }}>{name}</text>
                              <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={Math.min(10, width / 7)} style={{ fontWeight: 400, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.03em", textRendering: "geometricPrecision" }}>{(val / 1000).toFixed(1)}k lbs</text>
                            </>
                          ) : showName ? (
                            <text x={x + width / 2} y={y + height / 2 + 1} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={Math.min(10, width / 5)} style={{ fontWeight: 400, fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.03em", textRendering: "geometricPrecision" }}>{name}</text>
                          ) : null}
                        </g>
                      );
                    }}
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
                    margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
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
                (transporterPage - 1) * pageSize,
                transporterPage * pageSize
              )}
              pagination={{
                page: transporterPage,
                pageSize: pageSize,
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

          {/* Operational Metrics Tab */}
          <PillTabsContent value="operational-metrics" className="space-y-4">
            {/* Workday Utilization — inline metric */}
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-default bg-bg-card px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]" style={{ backgroundColor: "color-mix(in srgb, var(--color-success-400) 20%, transparent)" }}>
                <Activity className="h-5 w-5" style={{ color: "var(--color-success-600)" }} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Workday Utilization</p>
                <p className="text-lg font-extrabold text-text-primary">91.2%</p>
              </div>
              <p className="ml-auto text-xs text-text-muted">Avg productive time across all sites</p>
            </div>

            {/* Charts row: Facility Utilization + Jobs/Stops trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Receiving Facility Utilization % */}
              <ChartContainer
                title="Receiving Facility Utilization"
                subtitle="Monthly processed vs capacity (%)"
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
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v}%`}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      width={115}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value, _name, entry) => {
                        const payload = entry?.payload as
                          | { processed: number; capacity: number }
                          | undefined;
                        return [
                          `${value}% (${payload?.processed?.toLocaleString() ?? 0} / ${payload?.capacity?.toLocaleString() ?? 0} tons)`,
                          "Utilization",
                        ];
                      }}
                    />
                    <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                      {facilityUtilization.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.utilization >= 90
                              ? "var(--color-error-400)"
                              : entry.utilization >= 70
                              ? "var(--color-warning-400)"
                              : "var(--color-success-400)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Jobs/Stops per Day — Monthly Trend */}
              <ChartContainer
                title="Completed Jobs per Month"
                subtitle="Collection events with status completed"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={jobsPerDayTrend}
                    margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
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
                      width={30}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `${Number(value).toLocaleString()} jobs`,
                        "Completed",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="completedJobs"
                      stroke={CATEGORY_COLORS[1]}
                      fill={CATEGORY_COLORS[1]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Second row: Volume by Job Type donut + Industry Codes table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Volume by Job Type */}
              <ChartContainer
                title="Volume by Job Type"
                subtitle="Shipment volume by service frequency category"
              >
                <DonutChart
                  data={volumeByJobType}
                  valueFormatter={(v) => `${(v / 1000).toFixed(1)}k lbs`}
                />
              </ChartContainer>

              {/* Client Industry Codes */}
              <Card className="p-4">
                <div className="mb-3">
                  <h3 className="text-[15px] font-bold text-text-primary">
                    Client Industry Codes
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    NAICS classification by client
                  </p>
                </div>
                <DataTable
                  columns={industryCodeColumns}
                  data={industryCodeData.slice(
                    (industryCodePage - 1) * pageSize,
                    industryCodePage * pageSize
                  )}
                  pagination={{
                    page: industryCodePage,
                    pageSize: pageSize,
                    total: industryCodeData.length,
                  }}
                  onPaginationChange={setIndustryCodePage}
                  emptyState={
                    <div className="flex items-center justify-center h-full text-sm text-text-muted">
                      No industry code data
                    </div>
                  }
                />
              </Card>
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
