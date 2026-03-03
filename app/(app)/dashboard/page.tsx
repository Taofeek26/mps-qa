"use client";

import * as React from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Package,
  TrendingUp,
  MapPin,
  Clock,
  Plus,
  Download,
  Building2,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatRow } from "@/components/ui/stat-row";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { getShipments, getSites, getAuditLog } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import type { Shipment, ShipmentStatus, AuditLogEntry } from "@/lib/types";

/* ─── Status badge mapping ─── */

const statusVariant: Record<ShipmentStatus, BadgeVariant> = {
  submitted: "success",
  pending: "warning",
  void: "error",
};

/* ─── Recent Shipments columns (compact) ─── */

const recentShipmentColumns: ColumnDef<Shipment, unknown>[] = [
  {
    accessorKey: "shipmentDate",
    header: "Date",
    size: 100,
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
    size: 180,
  },
  {
    accessorKey: "vendorName",
    header: "Vendor",
    size: 160,
  },
  {
    accessorKey: "weightValue",
    header: "Weight",
    size: 110,
    cell: ({ row }) => (
      <span>
        {row.original.weightValue.toLocaleString()} {row.original.weightUnit}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 90,
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

/* ─── Dashboard Page ─── */

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isSiteUser = user?.role === "site_user";
  const assignedSiteIds = user?.assignedSiteIds;

  /* Compute KPI metrics — scoped by role */
  const siteFilter = isSiteUser && assignedSiteIds
    ? { siteIds: assignedSiteIds }
    : undefined;

  const allShipments = React.useMemo(
    () => getShipments(siteFilter, 1, 9999),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );
  const sites = React.useMemo(() => {
    const all = getSites();
    if (isSiteUser && assignedSiteIds) {
      return all.filter((s) => assignedSiteIds.includes(s.id));
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const recentShipments = React.useMemo(
    () =>
      getShipments(siteFilter, 1, 10, {
        field: "shipmentDate",
        direction: "desc",
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );
  const recentActivity = React.useMemo(
    () => getAuditLog(undefined, 1, 5),
    []
  );

  const totalShipments = allShipments.total;

  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthCount = allShipments.data.filter((s) =>
    s.shipmentDate.startsWith(thisMonthStr)
  ).length;

  const activeSites = sites.filter((s) => s.active).length;
  const pendingCount = allShipments.data.filter(
    (s) => s.status === "pending"
  ).length;

  /* Filter quick actions by role */
  const visibleActions = quickActions.filter(
    (a) => !a.roles || (user && a.roles.includes(user.role))
  );

  const canViewAuditLog = hasRole(["admin", "system_admin"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of shipment activity and platform metrics"
      />

      {/* KPI Row */}
      <StatRow>
        <KpiCard
          title="Total Shipments"
          value={totalShipments}
          icon={Package}
        />
        <KpiCard
          title="This Month"
          value={thisMonthCount}
          icon={TrendingUp}
          variant="success"
          trend={{ value: 12, direction: "up" }}
        />
        <KpiCard title="Active Sites" value={activeSites} icon={MapPin} />
        <KpiCard
          title="Pending Entries"
          value={pendingCount}
          icon={Clock}
          variant="warning"
        />
      </StatRow>

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

        {/* Recent Activity — sidebar */}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
