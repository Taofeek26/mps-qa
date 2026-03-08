"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Package,
  TrendingUp,
  Recycle,
  DollarSign,
  AlertTriangle,
  Building2,
  ArrowRight,
  Truck,
  BarChart3,
  Banknote,
  Receipt,
  Scale,
  ArrowLeftRight,
} from "lucide-react";
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
  Legend,
} from "recharts";
import { subDays, subMonths, startOfYear } from "date-fns";
import type { DateRange } from "react-day-picker";
import { PageHeader } from "@/components/ui/page-header";
import { ScorecardCard } from "@/components/ui/scorecard-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DateRangePicker,
  type DateRangePreset,
} from "@/components/ui/date-range-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  DonutChart,
  CATEGORY_COLORS,
  TOOLTIP_STYLE,
  ParetoChart,
  TimelineHeatmap,
} from "@/components/charts";
import {
  getShipments,
  getAllShipments,
  getSites,
  getClients,
  getVendors,
  getAuditLog,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import type { Shipment, ShipmentStatus, AuditLogEntry } from "@/lib/types";

/* ─── Date Range Presets ─── */

const DASHBOARD_DATE_PRESETS: DateRangePreset[] = [
  { label: "Last 30 days", range: { from: subDays(new Date(), 30), to: new Date() } },
  { label: "Last 90 days", range: { from: subDays(new Date(), 90), to: new Date() } },
  { label: "Last 6 months", range: { from: subMonths(new Date(), 6), to: new Date() } },
  { label: "Year to date", range: { from: startOfYear(new Date()), to: new Date() } },
];

/* ─── Dollar Formatting Helper ─── */

function fmtDollar(value: number): string {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

/* ─── Status badge mapping ─── */

const statusVariant: Record<ShipmentStatus, BadgeVariant> = {
  submitted: "success",
  pending: "warning",
  void: "error",
};

const wasteCategoryVariant: Record<string, BadgeVariant> = {
  "Non Haz": "neutral",
  "Hazardous Waste": "error",
  Recycling: "success",
  Medical: "warning",
};

/* ─── Recent Shipments columns ─── */

const recentShipmentColumns: ColumnDef<Shipment, unknown>[] = [
  {
    accessorKey: "shipmentDate",
    header: "Date",
    size: 90,
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return new Date(val + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    },
  },
  {
    accessorKey: "siteName",
    header: "Site",
    size: 140,
  },
  {
    accessorKey: "wasteTypeName",
    header: "Waste",
    size: 130,
  },
  {
    accessorKey: "wasteCategory",
    header: "Type",
    size: 110,
    cell: ({ getValue }) => {
      const cat = (getValue() as string) ?? "Non Haz";
      return (
        <Badge variant={wasteCategoryVariant[cat] ?? "neutral"}>
          {cat === "Hazardous Waste" ? "Haz" : cat}
        </Badge>
      );
    },
  },
  {
    accessorKey: "weightValue",
    header: "Weight",
    size: 100,
    cell: ({ row }) => (
      <span>{row.original.weightValue.toLocaleString()} lbs</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 80,
    meta: { align: "center" },
    cell: ({ getValue }) => {
      const status = getValue() as ShipmentStatus;
      return (
        <Badge variant={statusVariant[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
];

/* ─── Activity Feed Item ─── */

function ActivityItem({ entry }: { entry: AuditLogEntry }) {
  const initials = entry.actor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = getRelativeTime(entry.timestamp);

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-500">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary leading-snug">
          {entry.summary}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{timeAgo}</p>
      </div>
    </div>
  );
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Data Aggregation Helpers ─── */

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

function computeTotalMpsCost(s: Shipment): number {
  if (!s.mpsCost) return 0;
  return (
    s.mpsCost.haulCharge +
    s.mpsCost.disposalFeeTotal +
    s.mpsCost.fuelFee +
    s.mpsCost.environmentalFee +
    s.mpsCost.otherFees
  );
}

function computeTotalCustomerCost(s: Shipment): number {
  if (!s.customerCost) return 0;
  return (
    s.customerCost.haulCharge +
    s.customerCost.disposalFeeTotal +
    s.customerCost.fuelFee +
    s.customerCost.environmentalFee +
    s.customerCost.otherFees -
    s.customerCost.rebate
  );
}

/** Filter shipments by date range */
function filterByDateRange(shipments: Shipment[], from?: Date, to?: Date): Shipment[] {
  if (!from) return shipments;
  return shipments.filter((s) => {
    const d = new Date(s.shipmentDate + "T00:00:00");
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

/** Compute prior-period shipments for comparison (same-length window before current range) */
function getPriorPeriodShipments(
  allShipments: Shipment[],
  from?: Date,
  to?: Date
): Shipment[] {
  if (!from || !to) {
    // No range selected — compare last 6 months vs prior 6 months
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);
    const twelveMonthsAgo = subMonths(now, 12);
    return filterByDateRange(allShipments, twelveMonthsAgo, sixMonthsAgo);
  }

  const rangeMs = to.getTime() - from.getTime();
  const priorTo = new Date(from.getTime() - 1); // day before current range starts
  const priorFrom = new Date(priorTo.getTime() - rangeMs);
  return filterByDateRange(allShipments, priorFrom, priorTo);
}

/* ─── Dashboard Page ─── */

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isSiteUser = user?.role === "site_user";
  const assignedSiteIds = user?.assignedSiteIds;

  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const siteFilter = React.useMemo(() => {
    const f: { siteIds?: string[]; clientIds?: string[] } = {};
    if (isSiteUser && assignedSiteIds) {
      f.siteIds = assignedSiteIds;
    }
    if (selectedClientId) {
      f.clientIds = [selectedClientId];
    }
    return Object.keys(f).length > 0 ? f : undefined;
  }, [isSiteUser, assignedSiteIds, selectedClientId]);

  // All shipments (unfiltered by date — used for prior-period comparison)
  const allShipmentsRaw = React.useMemo(
    () => getAllShipments(siteFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, selectedClientId]
  );

  // Current-period shipments (filtered by date range)
  const allShipments = React.useMemo(
    () => filterByDateRange(allShipmentsRaw, dateRange?.from, dateRange?.to),
    [allShipmentsRaw, dateRange?.from, dateRange?.to]
  );

  // Prior-period shipments (for trend comparison)
  const priorShipments = React.useMemo(
    () => getPriorPeriodShipments(allShipmentsRaw, dateRange?.from, dateRange?.to),
    [allShipmentsRaw, dateRange?.from, dateRange?.to]
  );

  const clients = React.useMemo(() => getClients(), []);
  const vendors = React.useMemo(() => getVendors(), []);
  const sites = React.useMemo(() => {
    const all = getSites();
    if (isSiteUser && assignedSiteIds) {
      return all.filter((s) => assignedSiteIds.includes(s.id));
    }
    if (selectedClientId) {
      return all.filter((s) => s.clientId === selectedClientId);
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedClientId]);

  const recentShipments = React.useMemo(
    () =>
      getShipments(siteFilter, 1, 10, {
        field: "shipmentDate",
        direction: "desc",
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, selectedClientId]
  );
  const recentActivity = React.useMemo(
    () => getAuditLog(undefined, 1, 5),
    []
  );

  /* ─── KPI Computations (current period) ─── */

  const totalShipments = allShipments.length;
  const totalVolumeLbs = allShipments.reduce((sum, s) => sum + s.weightValue, 0);
  const totalMpsCost = allShipments.reduce((sum, s) => sum + computeTotalMpsCost(s), 0);
  const totalCustCost = allShipments.reduce((sum, s) => sum + computeTotalCustomerCost(s), 0);

  const divertedVolume = allShipments
    .filter((s) => s.treatmentMethod === "Recycling" || s.treatmentMethod === "Reuse")
    .reduce((sum, s) => sum + s.weightValue, 0);
  const diversionRate = totalVolumeLbs > 0 ? Math.round((divertedVolume / totalVolumeLbs) * 100) : 0;

  const hazVolume = allShipments
    .filter((s) => s.wasteCategory === "Hazardous Waste")
    .reduce((sum, s) => sum + s.weightValue, 0);
  const hazPercent = totalVolumeLbs > 0 ? Math.round((hazVolume / totalVolumeLbs) * 100) : 0;

  const marginPct = totalCustCost > 0 ? Math.round(((totalCustCost - totalMpsCost) / totalCustCost) * 100) : 0;

  // New KPIs
  const costPerTon = totalVolumeLbs > 0 ? Math.round((totalMpsCost / (totalVolumeLbs / 2000)) * 100) / 100 : 0;
  const marginSpread = totalCustCost - totalMpsCost;

  /* ─── Prior-Period KPIs (real comparison) ─── */

  const priorTotalShipments = priorShipments.length;
  const priorVolumeLbs = priorShipments.reduce((sum, s) => sum + s.weightValue, 0);
  const priorMpsCost = priorShipments.reduce((sum, s) => sum + computeTotalMpsCost(s), 0);
  const priorCustCost = priorShipments.reduce((sum, s) => sum + computeTotalCustomerCost(s), 0);
  const priorDiverted = priorShipments
    .filter((s) => s.treatmentMethod === "Recycling" || s.treatmentMethod === "Reuse")
    .reduce((sum, s) => sum + s.weightValue, 0);
  const priorDiversionRate = priorVolumeLbs > 0 ? Math.round((priorDiverted / priorVolumeLbs) * 100) : 0;
  const priorHazVol = priorShipments
    .filter((s) => s.wasteCategory === "Hazardous Waste")
    .reduce((sum, s) => sum + s.weightValue, 0);
  const priorHazPercent = priorVolumeLbs > 0 ? Math.round((priorHazVol / priorVolumeLbs) * 100) : 0;
  const priorMarginPct = priorCustCost > 0 ? Math.round(((priorCustCost - priorMpsCost) / priorCustCost) * 100) : 0;

  // Prior-period new KPIs
  const priorCostPerTon = priorVolumeLbs > 0 ? Math.round((priorMpsCost / (priorVolumeLbs / 2000)) * 100) / 100 : 0;
  const priorMarginSpread = priorCustCost - priorMpsCost;

  // Vendors with upcoming expirations (within 90 days)
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 86400000);
  const expiringVendors = vendors.filter((v) => {
    if (!v.expirationDate) return false;
    const exp = new Date(v.expirationDate);
    return exp <= in90Days && exp >= now;
  });

  const activeSites = sites.filter((s) => s.active).length;

  // Pending shipments for contextual alerts
  const pendingShipments = allShipments.filter((s) => s.status === "pending");
  const voidedShipments = allShipments.filter((s) => s.status === "void");

  function pctChange(current: number, prior: number): number {
    if (prior === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prior) / prior) * 100);
  }

  /* ─── Monthly Trend Data ─── */

  const monthlyData = React.useMemo(() => {
    const byMonth = new Map<
      string,
      { volume: number; mpsCost: number; custCost: number; shipments: number }
    >();

    allShipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) || {
        volume: 0,
        mpsCost: 0,
        custCost: 0,
        shipments: 0,
      };
      existing.volume += s.weightValue;
      existing.mpsCost += computeTotalMpsCost(s);
      existing.custCost += computeTotalCustomerCost(s);
      existing.shipments += 1;
      byMonth.set(key, existing);
    });

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        month: formatMonthLabel(key),
        volume: Math.round(data.volume),
        shipments: data.shipments,
        mpsCost: Math.round(data.mpsCost),
        custCost: Math.round(data.custCost),
        margin: Math.round(data.custCost - data.mpsCost),
      }));
  }, [allShipments]);

  /* ─── Top Waste Streams (for Pareto) ─── */

  const topWasteStreams = React.useMemo(() => {
    const byType = new Map<string, number>();
    allShipments.forEach((s) => {
      const name = s.wasteTypeName;
      byType.set(name, (byType.get(name) ?? 0) + s.weightValue);
    });
    return Array.from(byType.entries())
      .map(([name, volume]) => ({ name, value: Math.round(volume) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [allShipments]);

  /* ─── Vendor Expiration Timeline Heatmap ─── */

  const vendorExpirationTimeline = React.useMemo(() => {
    const monthMap = new Map<string, Array<{ id: string; label: string }>>();

    const months: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push(key);
      monthMap.set(key, []);
    }

    vendors.forEach((v) => {
      if (!v.expirationDate) return;
      const exp = new Date(v.expirationDate);
      const key = `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, "0")}`;
      if (monthMap.has(key)) {
        monthMap.get(key)!.push({ id: v.id, label: v.name });
      }
    });

    return months.map((key) => ({
      period: formatMonthLabel(key),
      count: monthMap.get(key)?.length ?? 0,
      items: monthMap.get(key) ?? [],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors]);

  /* ─── Revenue by Waste Category (for Donut) ─── */

  const revenueByCategoryData = React.useMemo(() => {
    const byCategory = new Map<string, number>();
    allShipments.forEach((s) => {
      const cat = s.wasteCategory ?? "Non Haz";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + computeTotalCustomerCost(s));
    });
    return Array.from(byCategory.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
  }, [allShipments]);

  /* ─── Cost Per Ton by Waste Type ─── */

  const costPerTonByType = React.useMemo(() => {
    const byType = new Map<string, { cost: number; lbs: number }>();
    allShipments.forEach((s) => {
      const name = s.wasteTypeName;
      const existing = byType.get(name) ?? { cost: 0, lbs: 0 };
      existing.cost += computeTotalMpsCost(s);
      existing.lbs += s.weightValue;
      byType.set(name, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name,
        costPerTon: d.lbs > 0 ? Math.round((d.cost / (d.lbs / 2000)) * 100) / 100 : 0,
      }))
      .filter((d) => d.costPerTon > 0)
      .sort((a, b) => b.costPerTon - a.costPerTon)
      .slice(0, 8);
  }, [allShipments]);

  /* ─── Regional Performance (by State) ─── */

  const regionalData = React.useMemo(() => {
    const siteStateMap = new Map(sites.map((s) => [s.id, s.state ?? "Unknown"]));
    const byState = new Map<string, { revenue: number; cost: number }>();
    allShipments.forEach((s) => {
      const state = siteStateMap.get(s.siteId) ?? "Unknown";
      const existing = byState.get(state) ?? { revenue: 0, cost: 0 };
      existing.revenue += computeTotalCustomerCost(s);
      existing.cost += computeTotalMpsCost(s);
      byState.set(state, existing);
    });
    return Array.from(byState.entries())
      .map(([state, d]) => ({
        state,
        revenue: Math.round(d.revenue),
        cost: Math.round(d.cost),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [allShipments, sites]);

  const canViewAuditLog = hasRole(["admin", "system_admin"]);

  const hasData = allShipments.length > 0;

  return (
    <div className="space-y-8">
      {/* ─── Header with filters ─── */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of waste shipment activity and platform metrics"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <DateRangePicker
              from={dateRange?.from}
              to={dateRange?.to}
              onChange={setDateRange}
              presets={DASHBOARD_DATE_PRESETS}
              placeholder="All time"
              className="w-full sm:w-[220px]"
            />
            {!isSiteUser && (
              <Select
                value={selectedClientId || "all"}
                onValueChange={(val) =>
                  setSelectedClientId(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        }
      />

      {/* ─── Tabs ─── */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* Tab: Overview                                               */}
        {/* ════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview">
          <div className="space-y-8">
            {/* ─── KPI Scorecards — 10 cards, 5 per row at desktop ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Link href="/shipments" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Total Volume"
                  value={totalVolumeLbs > 0 ? `${(totalVolumeLbs / 1000).toFixed(0)}k lbs` : "0 lbs"}
                  icon={Package}
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={priorVolumeLbs > 0 ? {
                    value: Math.abs(pctChange(totalVolumeLbs, priorVolumeLbs)),
                    direction: totalVolumeLbs >= priorVolumeLbs ? "up" : "down",
                    label: "vs prior period",
                  } : undefined}
                  status="on-track"
                />
              </Link>
              <Link href="/shipments" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Total Shipments"
                  value={totalShipments}
                  icon={TrendingUp}
                  variant="success"
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={priorTotalShipments > 0 ? {
                    value: Math.abs(pctChange(totalShipments, priorTotalShipments)),
                    direction: totalShipments >= priorTotalShipments ? "up" : "down",
                    label: "vs prior period",
                  } : undefined}
                  status={totalShipments >= priorTotalShipments ? "on-track" : "at-risk"}
                />
              </Link>
              <Link href="/reports/waste-trends" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Diversion Rate"
                  value={`${diversionRate}%`}
                  icon={Recycle}
                  variant={diversionRate >= 30 ? "success" : "warning"}
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={{
                    value: Math.abs(diversionRate - priorDiversionRate),
                    direction: diversionRate >= priorDiversionRate ? "up" : "down",
                    label: "vs prior period",
                  }}
                  goal={{ target: "30%", met: diversionRate >= 30 }}
                  status={diversionRate >= 30 ? "on-track" : diversionRate >= 20 ? "at-risk" : "behind"}
                />
              </Link>
              <Link href="/reports/cost-analysis" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Margin"
                  value={`${marginPct}%`}
                  icon={DollarSign}
                  variant={marginPct > 0 ? "success" : "error"}
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={{
                    value: Math.abs(marginPct - priorMarginPct),
                    direction: marginPct >= priorMarginPct ? "up" : "down",
                    label: "vs prior period",
                  }}
                  goal={{ target: "15%", met: marginPct >= 15 }}
                  status={marginPct >= 15 ? "on-track" : marginPct >= 10 ? "at-risk" : "behind"}
                />
              </Link>
              <Link href="/reports/regulatory" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Hazardous %"
                  value={`${hazPercent}%`}
                  icon={AlertTriangle}
                  variant={hazPercent > 20 ? "error" : "warning"}
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={{
                    value: Math.abs(hazPercent - priorHazPercent),
                    direction: hazPercent <= priorHazPercent ? "down" : "up",
                    invertColor: true,
                    label: "vs prior period",
                  }}
                  goal={{ target: "<20%", met: hazPercent < 20 }}
                  status={hazPercent < 20 ? "on-track" : hazPercent < 25 ? "at-risk" : "behind"}
                />
              </Link>
              <Link href="/reports/cost-analysis" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Total Revenue"
                  value={fmtDollar(totalCustCost)}
                  icon={Banknote}
                  variant="success"
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={priorCustCost > 0 ? {
                    value: Math.abs(pctChange(totalCustCost, priorCustCost)),
                    direction: totalCustCost >= priorCustCost ? "up" : "down",
                    label: "vs prior period",
                  } : undefined}
                  status={totalCustCost >= priorCustCost ? "on-track" : "at-risk"}
                />
              </Link>
              <Link href="/reports/cost-analysis" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Total MPS Cost"
                  value={fmtDollar(totalMpsCost)}
                  icon={Receipt}
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={priorMpsCost > 0 ? {
                    value: Math.abs(pctChange(totalMpsCost, priorMpsCost)),
                    direction: totalMpsCost >= priorMpsCost ? "up" : "down",
                    invertColor: true,
                    label: "vs prior period",
                  } : undefined}
                  status={totalMpsCost <= priorMpsCost ? "on-track" : "at-risk"}
                />
              </Link>
              <Link href="/reports/cost-analysis" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Cost Per Ton"
                  value={`$${costPerTon.toLocaleString()}`}
                  icon={Scale}
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={priorCostPerTon > 0 ? {
                    value: Math.abs(pctChange(costPerTon, priorCostPerTon)),
                    direction: costPerTon >= priorCostPerTon ? "up" : "down",
                    invertColor: true,
                    label: "vs prior period",
                  } : undefined}
                  status={costPerTon <= priorCostPerTon ? "on-track" : "at-risk"}
                />
              </Link>
              <Link href="/reports/cost-analysis" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Margin Spread"
                  value={fmtDollar(marginSpread)}
                  icon={ArrowLeftRight}
                  variant={marginSpread >= 0 ? "success" : "error"}
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={priorMarginSpread !== 0 ? {
                    value: Math.abs(pctChange(marginSpread, priorMarginSpread)),
                    direction: marginSpread >= priorMarginSpread ? "up" : "down",
                    label: "vs prior period",
                  } : undefined}
                  status={marginSpread >= 0 ? "on-track" : "behind"}
                />
              </Link>
              <Link href="/admin/sites" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-[var(--radius-lg)]">
                <ScorecardCard
                  title="Active Sites"
                  value={activeSites}
                  icon={Building2}
                  className="h-full cursor-pointer transition-shadow hover:shadow-md"
                  trend={
                    expiringVendors.length > 0
                      ? {
                          value: expiringVendors.length,
                          direction: "down",
                          invertColor: true,
                          label: "vendors expiring",
                        }
                      : undefined
                  }
                  status="on-track"
                />
              </Link>
            </div>

            {/* ─── Contextual Alerts ─── */}
            {(expiringVendors.length > 0 || pendingShipments.length > 0 || voidedShipments.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {expiringVendors.length > 0 && (
                  <Link href="/admin/vendors">
                    <Card interactive className="h-full border-warning-300 bg-warning-50">
                      <CardContent className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-warning-100 text-warning-600">
                          <AlertTriangle className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary">
                            {expiringVendors.length} vendor{expiringVendors.length > 1 ? "s" : ""} expiring
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            Within 90 days — review now
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-text-muted ml-auto" />
                      </CardContent>
                    </Card>
                  </Link>
                )}
                {pendingShipments.length > 0 && (
                  <Link href="/shipments">
                    <Card interactive className="h-full border-primary-200 bg-primary-50">
                      <CardContent className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-100 text-primary-500">
                          <Truck className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary">
                            {pendingShipments.length} pending shipment{pendingShipments.length > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            Awaiting review
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-text-muted ml-auto" />
                      </CardContent>
                    </Card>
                  </Link>
                )}
                {voidedShipments.length > 0 && (
                  <Link href="/shipments">
                    <Card interactive className="h-full border-error-200 bg-error-50">
                      <CardContent className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-error-100 text-error-600">
                          <BarChart3 className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary">
                            {voidedShipments.length} voided shipment{voidedShipments.length > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            Review for corrections
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-text-muted ml-auto" />
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>
            )}

            {/* ─── Charts: Revenue vs Cost Trend + Waste Category Revenue Donut ─── */}
            {hasData ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartContainer
                  title="Revenue vs Cost Trend"
                  subtitle="Monthly revenue and cost with margin visibility"
                  chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyData}
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
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        {...TOOLTIP_STYLE}
                        formatter={(value, name) => {
                          if (name === "custCost")
                            return [`$${Number(value).toLocaleString()}`, "Revenue"];
                          if (name === "mpsCost")
                            return [`$${Number(value).toLocaleString()}`, "MPS Cost"];
                          return [`$${Number(value).toLocaleString()}`, String(name)];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) => {
                          if (value === "custCost") return "Revenue";
                          if (value === "mpsCost") return "MPS Cost";
                          return value;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="custCost"
                        name="custCost"
                        stroke={CATEGORY_COLORS[1]}
                        fill={CATEGORY_COLORS[1]}
                        fillOpacity={0.08}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="mpsCost"
                        name="mpsCost"
                        stroke={CATEGORY_COLORS[3]}
                        fill={CATEGORY_COLORS[3]}
                        fillOpacity={0.08}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer
                  title="Waste Category Revenue Split"
                  subtitle="Revenue distribution by waste category"
                  chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
                >
                  <DonutChart
                    data={revenueByCategoryData}
                    valueFormatter={(v) => `$${v.toLocaleString()}`}
                  />
                </ChartContainer>
              </div>
            ) : (
              <Card variant="subtle" className="py-0">
                <EmptyState
                  icon={<Package className="h-10 w-10" />}
                  title="No shipments found"
                  description={
                    dateRange?.from
                      ? "No shipments match the selected date range and filters. Try adjusting your criteria."
                      : "No shipment data available for the current filters."
                  }
                />
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* Tab: Analytics                                              */}
        {/* ════════════════════════════════════════════════════════════ */}
        <TabsContent value="analytics">
          {hasData ? (
            <div className="space-y-8">
              <SectionHeader title="Analytics" className="mb-4" />

              {/* Charts Row 1: Cost Per Ton by Waste Type + Regional Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartContainer
                  title="Cost Per Ton by Waste Type"
                  subtitle="Top 8 waste types ranked by MPS cost per ton"
                  chartClassName="h-[260px] sm:h-[300px] lg:h-[320px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={costPerTonByType}
                      margin={{ top: 5, right: 10, bottom: 40, left: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border-default)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        {...TOOLTIP_STYLE}
                        formatter={(value) => [`$${Number(value).toLocaleString()}/ton`, "Cost Per Ton"]}
                      />
                      <Bar
                        dataKey="costPerTon"
                        fill={CATEGORY_COLORS[0]}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer
                  title="Regional Performance"
                  subtitle="Revenue vs cost by state"
                  chartClassName="h-[260px] sm:h-[300px] lg:h-[320px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionalData}
                      margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border-default)"
                      />
                      <XAxis
                        dataKey="state"
                        tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        {...TOOLTIP_STYLE}
                        formatter={(value, name) => {
                          const label = name === "revenue" ? "Revenue" : "Cost";
                          return [`$${Number(value).toLocaleString()}`, label];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) => {
                          if (value === "revenue") return "Revenue";
                          if (value === "cost") return "Cost";
                          return value;
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill={CATEGORY_COLORS[1]}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="cost"
                        fill={CATEGORY_COLORS[3]}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* Charts Row 2: Pareto + Vendor Expirations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartContainer
                  title="Top Waste Streams — Pareto"
                  subtitle="80/20 analysis: which streams drive most volume"
                  className="lg:col-span-2"
                  chartClassName="h-[260px] sm:h-[300px] lg:h-[320px]"
                >
                  <ParetoChart
                    data={topWasteStreams}
                    valueFormatter={(v) => `${(v / 1000).toFixed(1)}k lbs`}
                  />
                </ChartContainer>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning-500" />
                      Vendor Expirations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimelineHeatmap
                      data={vendorExpirationTimeline}
                      maxMonths={6}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card variant="subtle" className="py-0">
              <EmptyState
                icon={<Package className="h-10 w-10" />}
                title="No shipments found"
                description={
                  dateRange?.from
                    ? "No shipments match the selected date range and filters. Try adjusting your criteria."
                    : "No shipment data available for the current filters."
                }
              />
            </Card>
          )}
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* Tab: Activity                                               */}
        {/* ════════════════════════════════════════════════════════════ */}
        <TabsContent value="activity">
          <div className="space-y-8">
            <SectionHeader title="Activity" className="mb-4" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Recent Shipments — wider */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Shipments</CardTitle>
                  <Link
                    href="/shipments"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-500 transition-colors"
                  >
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentShipments.data.length > 0 ? (
                    <DataTable
                      columns={recentShipmentColumns}
                      data={recentShipments.data}
                    />
                  ) : (
                    <EmptyState
                      icon={<Truck className="h-8 w-8" />}
                      title="No recent shipments"
                      description="Shipments will appear here once they are entered."
                      className="py-10"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Sidebar: Activity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  {canViewAuditLog && (
                    <Link
                      href="/admin/audit-log"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-500 transition-colors"
                    >
                      View All <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </CardHeader>
                <CardContent>
                  {recentActivity.data.length > 0 ? (
                    <div className="divide-y divide-border-default">
                      {recentActivity.data.map((entry) => (
                        <ActivityItem key={entry.id} entry={entry} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<TrendingUp className="h-8 w-8" />}
                      title="No recent activity"
                      description="Activity will appear here as actions are taken."
                      className="py-10"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
