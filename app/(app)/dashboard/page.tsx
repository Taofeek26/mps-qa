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
  Plus,
  Download,
  ArrowRight,
  FileText,
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
import { PageHeader } from "@/components/ui/page-header";
import { ScorecardCard } from "@/components/ui/scorecard-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  ChartContainer,
  CATEGORY_COLORS,
  TOOLTIP_STYLE,
  ParetoChart,
  TimelineHeatmap,
} from "@/components/charts";
import { getShipments, getAllShipments, getSites, getClients, getVendors, getAuditLog } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import type { Shipment, ShipmentStatus, AuditLogEntry } from "@/lib/types";

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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-500">
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

/* ─── Quick Action Card ─── */

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const quickActions: QuickAction[] = [
  {
    title: "New Shipment",
    description: "Enter new waste shipment records",
    href: "/shipments/new",
    icon: Plus,
  },
  {
    title: "Reports",
    description: "View waste trends and cost analysis",
    href: "/reports",
    icon: FileText,
  },
  {
    title: "Export Data",
    description: "Download shipment reports",
    href: "/shipments",
    icon: Download,
  },
  {
    title: "Manage Vendors",
    description: "Add or update vendor information",
    href: "/admin/vendors",
    icon: Building2,
    roles: ["system_admin"],
  },
];

/* ─── Data Aggregation Helpers ─── */

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

function computeTotalMpsCost(s: Shipment): number {
  if (!s.mpsCost) return 0;
  return s.mpsCost.haulCharge + s.mpsCost.disposalFeeTotal + s.mpsCost.fuelFee + s.mpsCost.environmentalFee + s.mpsCost.otherFees;
}

function computeTotalCustomerCost(s: Shipment): number {
  if (!s.customerCost) return 0;
  return s.customerCost.haulCharge + s.customerCost.disposalFeeTotal + s.customerCost.fuelFee + s.customerCost.environmentalFee + s.customerCost.otherFees - s.customerCost.rebate;
}

/* ─── Dashboard Page ─── */

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isSiteUser = user?.role === "site_user";
  const assignedSiteIds = user?.assignedSiteIds;

  const [selectedClientId, setSelectedClientId] = React.useState<string>("");

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

  const allShipments = React.useMemo(
    () => getAllShipments(siteFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, selectedClientId]
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

  /* ─── KPI Computations ─── */

  const totalShipments = allShipments.length;
  const totalVolumeLbs = allShipments.reduce((sum, s) => sum + s.weightValue, 0);
  const totalMpsCost = allShipments.reduce((sum, s) => sum + computeTotalMpsCost(s), 0);
  const totalCustCost = allShipments.reduce((sum, s) => sum + computeTotalCustomerCost(s), 0);

  // Diversion rate: recycling + reuse / total
  const divertedVolume = allShipments
    .filter((s) => s.treatmentMethod === "Recycling" || s.treatmentMethod === "Reuse")
    .reduce((sum, s) => sum + s.weightValue, 0);
  const diversionRate = totalVolumeLbs > 0 ? Math.round((divertedVolume / totalVolumeLbs) * 100) : 0;

  // Hazardous %
  const hazVolume = allShipments
    .filter((s) => s.wasteCategory === "Hazardous Waste")
    .reduce((sum, s) => sum + s.weightValue, 0);
  const hazPercent = totalVolumeLbs > 0 ? Math.round((hazVolume / totalVolumeLbs) * 100) : 0;

  // Margin
  const marginPct = totalCustCost > 0 ? Math.round(((totalCustCost - totalMpsCost) / totalCustCost) * 100) : 0;

  // Vendors with upcoming expirations (within 90 days)
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 86400000);
  const expiringVendors = vendors.filter((v) => {
    if (!v.expirationDate) return false;
    const exp = new Date(v.expirationDate);
    return exp <= in90Days && exp >= now;
  });

  const activeSites = sites.filter((s) => s.active).length;

  /* ─── Simulated prior-period data for trend arrows ─── */
  // Use a deterministic "prior period" by taking ~85% of current values
  const priorShipments = Math.round(totalShipments * 0.88);
  const priorVolume = Math.round(totalVolumeLbs * 0.92);
  const priorMpsCost = Math.round(totalMpsCost * 0.95);
  const priorDiversion = Math.max(diversionRate - 3, 0);
  const priorHaz = Math.min(hazPercent + 2, 100);
  const priorMargin = Math.max(marginPct - 2, 0);

  function pctChange(current: number, prior: number): number {
    if (prior === 0) return 0;
    return Math.round(((current - prior) / prior) * 100);
  }

  /* ─── Monthly Trend Data ─── */

  const monthlyData = React.useMemo(() => {
    const byMonth = new Map<string, { volume: number; mpsCost: number; custCost: number; shipments: number }>();

    allShipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) || { volume: 0, mpsCost: 0, custCost: 0, shipments: 0 };
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

    // Build next 6 months
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

  /* ─── Cost Comparison — Mirrored Bar Data ─── */

  const mirroredCostData = React.useMemo(() => {
    return monthlyData.map((d) => ({
      month: d.month,
      mpsCost: -d.mpsCost, // negative for left-side rendering
      custCost: d.custCost,
      margin: d.margin,
    }));
  }, [monthlyData]);

  /* Filter quick actions by role */
  const visibleActions = quickActions.filter(
    (a) => !a.roles || (user && a.roles.includes(user.role))
  );

  const canViewAuditLog = hasRole(["admin", "system_admin"]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Dashboard"
          subtitle="Overview of waste shipment activity and platform metrics"
        />
        {/* Client filter */}
        {!isSiteUser && (
          <Select value={selectedClientId || "all"} onValueChange={(val) => setSelectedClientId(val === "all" ? "" : val)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* KPI Row — 6 Scorecard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ScorecardCard
          title="Total Volume"
          value={`${(totalVolumeLbs / 1000).toFixed(0)}k lbs`}
          icon={Package}
          trend={{
            value: Math.abs(pctChange(totalVolumeLbs, priorVolume)),
            direction: totalVolumeLbs >= priorVolume ? "up" : "down",
            label: "vs prior",
          }}
          goal={{ target: `${Math.round(totalVolumeLbs * 1.1 / 1000)}k`, met: true }}
          status="on-track"
        />
        <ScorecardCard
          title="Total Shipments"
          value={totalShipments}
          icon={TrendingUp}
          variant="success"
          trend={{
            value: Math.abs(pctChange(totalShipments, priorShipments)),
            direction: totalShipments >= priorShipments ? "up" : "down",
            label: "vs prior",
          }}
          goal={{ target: priorShipments, met: totalShipments >= priorShipments }}
          status={totalShipments >= priorShipments ? "on-track" : "at-risk"}
        />
        <ScorecardCard
          title="Diversion Rate"
          value={`${diversionRate}%`}
          icon={Recycle}
          variant={diversionRate >= 30 ? "success" : "warning"}
          trend={{
            value: Math.abs(diversionRate - priorDiversion),
            direction: diversionRate >= priorDiversion ? "up" : "down",
            label: "vs prior",
          }}
          goal={{ target: "30%", met: diversionRate >= 30 }}
          status={diversionRate >= 30 ? "on-track" : diversionRate >= 20 ? "at-risk" : "behind"}
        />
        <ScorecardCard
          title="Margin"
          value={`${marginPct}%`}
          icon={DollarSign}
          variant={marginPct > 0 ? "success" : "error"}
          trend={{
            value: Math.abs(marginPct - priorMargin),
            direction: marginPct >= priorMargin ? "up" : "down",
            label: "vs prior",
          }}
          goal={{ target: "15%", met: marginPct >= 15 }}
          status={marginPct >= 15 ? "on-track" : marginPct >= 10 ? "at-risk" : "behind"}
        />
        <ScorecardCard
          title="Hazardous %"
          value={`${hazPercent}%`}
          icon={AlertTriangle}
          variant={hazPercent > 20 ? "error" : "warning"}
          trend={{
            value: Math.abs(hazPercent - priorHaz),
            direction: hazPercent <= priorHaz ? "down" : "up",
            invertColor: true,
            label: "vs prior",
          }}
          goal={{ target: "<20%", met: hazPercent < 20 }}
          status={hazPercent < 20 ? "on-track" : hazPercent < 25 ? "at-risk" : "behind"}
        />
        <ScorecardCard
          title="Active Sites"
          value={activeSites}
          icon={Building2}
          trend={expiringVendors.length > 0 ? {
            value: expiringVendors.length,
            direction: "down",
            invertColor: true,
            label: "vendors expiring",
          } : undefined}
          status="on-track"
        />
      </div>

      {/* Charts Row 1: Dual-Layer Volume Trend + Mirrored Cost Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer title="Waste Volume Trend" subtitle="Shipment count vs. standardized weight">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value, name) => {
                  if (name === "shipments") return [value, "Shipments"];
                  return [`${Number(value).toLocaleString()} lbs`, "Volume"];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="volume"
                name="Volume (lbs)"
                stroke={CATEGORY_COLORS[0]}
                fill={CATEGORY_COLORS[0]}
                fillOpacity={0.12}
                strokeWidth={2}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="shipments"
                name="Shipments"
                stroke={CATEGORY_COLORS[1]}
                fill={CATEGORY_COLORS[1]}
                fillOpacity={0.08}
                strokeWidth={2}
                strokeDasharray="6 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Cost Comparison" subtitle="MPS cost (left) vs customer cost (right) — gap = margin">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mirroredCostData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                tickFormatter={(v) => `$${Math.abs(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value, name) => {
                  const absVal = Math.abs(Number(value));
                  if (name === "mpsCost") return [`$${absVal.toLocaleString()}`, "MPS Cost"];
                  if (name === "custCost") return [`$${absVal.toLocaleString()}`, "Customer Cost"];
                  return [`$${Number(value).toLocaleString()}`, "Margin"];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => {
                  if (value === "mpsCost") return "MPS Cost";
                  if (value === "custCost") return "Customer Cost";
                  return value;
                }}
              />
              <Bar dataKey="mpsCost" fill={CATEGORY_COLORS[3]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="custCost" fill={CATEGORY_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts Row 2: Pareto Waste Streams + Vendor Expiration Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartContainer title="Top Waste Streams — Pareto" subtitle="80/20 analysis: which streams drive most volume" className="lg:col-span-2">
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

      {/* Recent Shipments + Activity Feed */}
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
            <DataTable
              columns={recentShipmentColumns}
              data={recentShipments.data}
            />
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
            <div className="divide-y divide-border-default">
              {recentActivity.data.map((entry) => (
                <ActivityItem key={entry.id} entry={entry} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card interactive className="h-full">
                <CardContent className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-50 text-primary-400">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {action.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
