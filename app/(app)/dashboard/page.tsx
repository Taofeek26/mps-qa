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
  ArrowRight,
  Truck,
  BarChart3,
  Receipt,
  Scale,
  ArrowLeftRight,
  Maximize2,
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
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import {
  ChartContainer,
  DonutChart,
  CATEGORY_COLORS,
  TOOLTIP_STYLE,
  ParetoChart,
  TimelineHeatmap,
} from "@/components/charts";
import { useDashboardData, useAuditLog } from "@/lib/hooks/use-api-data";
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
      <span>{(row.original.weightValue ?? 0).toLocaleString()} lbs</span>
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

/* ─── Regional Chart (reused in card + dialog) ─── */

function RegionalChart({ data }: { data: { state: string; revenue: number; cost: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
        <XAxis dataKey="state" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
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
        <Bar dataKey="revenue" fill={CATEGORY_COLORS[1]} radius={[4, 4, 0, 0]} />
        <Bar dataKey="cost" fill={CATEGORY_COLORS[3]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Activity Feed Item ─── */

function ActivityItem({ entry }: { entry: AuditLogEntry }) {
  const actorName = entry.actor?.name ?? "Unknown";
  const initials = actorName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";


  const timeAgo = getRelativeTime(entry.timestamp);

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-400/20 text-xs font-bold text-success-600">
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

function getMonthKey(dateStr: string | undefined | null): string {
  if (!dateStr) return "unknown";
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
    if (!s.shipmentDate) return false;
    const d = new Date(s.shipmentDate + "T00:00:00");
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

/* ─── Dashboard Page ─── */

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isLimitedRole = user?.role !== "admin";
  const assignedSiteIds = user?.assignedSiteIds;

  const [selectedClientId, setSelectedClientId] = React.useState<string>("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [regionalOpen, setRegionalOpen] = React.useState(false);

  // Fetch data from API
  const { shipments: allShipmentsRaw, sites: allSites, clients, vendors, loading: dataLoading } = useDashboardData();
  const { logs: auditLogs } = useAuditLog();

  // Filter shipments based on site access and client selection
  const filteredShipmentsRaw = React.useMemo(() => {
    let filtered = allShipmentsRaw;
    if (isLimitedRole && assignedSiteIds) {
      filtered = filtered.filter((s) => assignedSiteIds.includes(s.siteId));
    }
    if (selectedClientId) {
      filtered = filtered.filter((s) => s.clientId === selectedClientId);
    }
    return filtered;
  }, [allShipmentsRaw, isLimitedRole, assignedSiteIds, selectedClientId]);

  // Current-period shipments (filtered by date range)
  const allShipments = React.useMemo(
    () => filterByDateRange(filteredShipmentsRaw, dateRange?.from, dateRange?.to),
    [filteredShipmentsRaw, dateRange?.from, dateRange?.to]
  );

  // Filter sites based on access
  const sites = React.useMemo(() => {
    if (isLimitedRole && assignedSiteIds) {
      return allSites.filter((s) => assignedSiteIds.includes(s.id));
    }
    if (selectedClientId) {
      return allSites.filter((s) => s.clientId === selectedClientId);
    }
    return allSites;
  }, [allSites, isLimitedRole, assignedSiteIds, selectedClientId]);

  // Recent shipments (sorted by date, limited to 10)
  const recentShipments = React.useMemo(() => {
    const sorted = [...filteredShipmentsRaw]
      .filter((s) => s.shipmentDate) // Filter out shipments without dates for sorting
      .sort(
        (a, b) => new Date(b.shipmentDate).getTime() - new Date(a.shipmentDate).getTime()
      );
    return { data: sorted.slice(0, 10), total: filteredShipmentsRaw.length, page: 1, pageSize: 10 };
  }, [filteredShipmentsRaw]);

  const recentActivity = React.useMemo(
    () => ({ data: auditLogs.slice(0, 10), total: auditLogs.length, page: 1, pageSize: 10 }),
    [auditLogs]
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

  const costPerTon = totalVolumeLbs > 0 ? Math.round((totalMpsCost / (totalVolumeLbs / 2000)) * 100) / 100 : 0;
  const marginSpread = totalCustCost - totalMpsCost;

  // Vendors with upcoming expirations (within 90 days)
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 86400000);
  const expiringVendors = vendors.filter((v) => {
    if (!v.expirationDate) return false;
    const exp = new Date(v.expirationDate);
    return exp <= in90Days && exp >= now;
  });

  const voidedShipments = allShipments.filter((s) => s.status === "void");

  /* ─── Monthly Trend Data ─── */

  const monthlyData = React.useMemo(() => {
    const byMonth = new Map<
      string,
      { volume: number; mpsCost: number; custCost: number; shipments: number }
    >();

    allShipments.forEach((s) => {
      // Skip shipments without a valid date
      if (!s.shipmentDate) return;
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) || {
        volume: 0,
        mpsCost: 0,
        custCost: 0,
        shipments: 0,
      };
      existing.volume += s.weightValue ?? 0;
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

  const canViewAuditLog = hasRole(["admin", "manager"]);

  const hasData = allShipments.length > 0;

  return (
    <div className="space-y-6">
      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 pb-4">
        <DateRangePicker
          from={dateRange?.from}
          to={dateRange?.to}
          onChange={setDateRange}
          presets={DASHBOARD_DATE_PRESETS}
          placeholder="All time"
          className="w-full sm:w-[220px]"
        />
        {!isLimitedRole && (
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

      <div className="space-y-6">
            {/* ─── KPI Cards — 3×3 grid (3 columns, 2 rows of 6 cards) ─── */}
            <div className="kpi-grid grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard
                title="Total Shipments"
                value={totalShipments.toLocaleString()}
                subtitle="Active manifests"
                icon={Package}
              />
              <KpiCard
                title="Total Revenue"
                value={fmtDollar(totalCustCost)}
                subtitle="Customer billed"
                icon={DollarSign}
                variant="success"
              />
              <KpiCard
                title="Total MPS Cost"
                value={fmtDollar(totalMpsCost)}
                subtitle="Platform payable"
                icon={Receipt}
                variant="error"
              />
              <KpiCard
                title="Cost Per Ton"
                value={`$${costPerTon.toLocaleString()}`}
                subtitle="Blended average"
                icon={Scale}
              />
              <KpiCard
                title="Margin Spread"
                value={fmtDollar(marginSpread)}
                subtitle={marginSpread < 0 ? "Negative" : "Positive"}
                icon={ArrowLeftRight}
                variant={marginSpread >= 0 ? "success" : "error"}
              />
              <KpiCard
                title="Diversion Rate"
                value={`${diversionRate}%`}
                subtitle="Non-landfill"
                icon={Recycle}
                variant="success"
              />
            </div>

            {/* ─── Contextual Alerts (compact inline banners; no pending-shipments banner — see Overview activity) ─── */}
            {(expiringVendors.length > 0 || voidedShipments.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                {expiringVendors.length > 0 && (
                  <Link
                    href="/admin/vendors"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-warning-400/30 bg-warning-100 px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-warning-400/20"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-warning-600" />
                    {expiringVendors.length} vendor{expiringVendors.length > 1 ? "s" : ""} expiring within 90 days
                    <ArrowRight className="h-3 w-3 text-text-muted" />
                  </Link>
                )}
                {voidedShipments.length > 0 && (
                  <Link
                    href="/shipments"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-error-400/30 bg-error-100 px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-error-400/20"
                  >
                    <BarChart3 className="h-3.5 w-3.5 text-error-600" />
                    {voidedShipments.length} voided shipment{voidedShipments.length > 1 ? "s" : ""} — review for corrections
                    <ArrowRight className="h-3 w-3 text-text-muted" />
                  </Link>
                )}
              </div>
            )}

            {/* ─── Charts ─── */}
            {hasData ? (
              <div className="space-y-4">
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

          {hasData && (
            <>
              {/* ─── Analytics row: 3-column ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartContainer
                  title="Waste Category Revenue Split"
                  subtitle="Revenue distribution by waste category"
                  chartClassName="h-[260px] sm:h-[300px] lg:h-[320px]"
                >
                  <DonutChart
                    data={revenueByCategoryData}
                    valueFormatter={(v) => `$${v.toLocaleString()}`}
                  />
                </ChartContainer>

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
                  action={
                    <button
                      onClick={() => setRegionalOpen(true)}
                      className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-surface hover:text-text-primary transition-colors cursor-pointer focus-ring"
                      aria-label="Expand chart"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  }
                >
                  <RegionalChart data={regionalData} />
                </ChartContainer>

                <Dialog open={regionalOpen} onOpenChange={setRegionalOpen}>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Regional Performance</DialogTitle>
                    </DialogHeader>
                    <div className="h-[500px]">
                      <RegionalChart data={regionalData} />
                    </div>
                  </DialogContent>
                </Dialog>
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

                <Card className="flex min-h-0 flex-col">
                  <CardHeader className="min-w-0 shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning-500" />
                      Vendor Expirations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="min-w-0 w-full">
                    <TimelineHeatmap
                      data={vendorExpirationTimeline}
                      maxMonths={6}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* ─── Recent Shipments + Recent Activity ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
            <section className="lg:col-span-2 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h2 className="text-base font-semibold tracking-tight text-text-primary">
                  Recent Shipments
                </h2>
                <Link
                  href="/shipments"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-500 transition-colors"
                >
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {recentShipments.data.length > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <DataTable
                    columns={recentShipmentColumns}
                    data={recentShipments.data}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-border-default bg-bg-card">
                  <EmptyState
                    icon={<Truck className="h-8 w-8" />}
                    title="No recent shipments"
                    description="Shipments will appear here once they are entered."
                    className="py-10"
                  />
                </div>
              )}
            </section>

            <section className="flex flex-col min-h-0 lg:min-h-[320px]">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h2 className="text-base font-semibold tracking-tight text-text-primary">
                  Recent Activity
                </h2>
                {canViewAuditLog && (
                  <Link
                    href="/admin/audit-log"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-500 transition-colors"
                  >
                    View All <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              {recentActivity.data.length > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-border-default bg-bg-card overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border-default px-4 py-2">
                    {recentActivity.data.map((entry) => (
                      <ActivityItem key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 rounded-lg border border-border-default bg-bg-card flex items-center justify-center">
                  <EmptyState
                    icon={<TrendingUp className="h-8 w-8" />}
                    title="No recent activity"
                    description="Activity will appear here as actions are taken."
                    className="py-10"
                  />
                </div>
              )}
            </section>
          </div>
    </div>
  );
}
