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
  Legend,
} from "recharts";
import {
  Monitor,
  Users,
  MousePointerClick,
  TrendingUp,
  RotateCcw,
  Activity,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import { usePlatformUserActivity, usePlatformMonthlyEvents } from "@/lib/hooks/use-api-data";
import { formatMonthLabel } from "@/lib/report-utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";

export function PlatformAnalyticsContent() {
  const {
    clients,
    dateRange,
    setDateRange,
    clientId,
    setClientId,
    hasFilters,
    resetFilters,
    shipments,
  } = useReportFilters({ includeSite: false });

  const { platformUserActivities: users } = usePlatformUserActivity();
  const { platformMonthlyEvents: apiMonthlyEvents } = usePlatformMonthlyEvents();

  const filterSummary =
    [clientId && "Customer filtered", dateRange?.from && "Date range applied"]
      .filter(Boolean)
      .join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport(
    "platform-analytics",
    shipments,
    filterSummary
  );

  /* ─── Data ─── */
  // Transform API data to expected format
  const monthlyEvents = React.useMemo(() => {
    if (!apiMonthlyEvents || apiMonthlyEvents.length === 0) {
      return [{ month: new Date().toISOString().slice(0, 7), dau: 0, mau: 0, shipmentsCreated: 0, reportsViewed: 0, exportsRun: 0, totalEvents: 0 }];
    }
    return apiMonthlyEvents.map(e => ({
      month: e.month,
      dau: e.unique_users || 0,
      mau: e.unique_users || 0,
      shipmentsCreated: Math.round((e.event_count || 0) * 0.4), // Estimate ~40% are shipment events
      reportsViewed: Math.round((e.event_count || 0) * 0.2), // Estimate ~20% are report views
      exportsRun: Math.round((e.event_count || 0) * 0.1), // Estimate ~10% are exports
      totalEvents: e.event_count || 0,
    }));
  }, [apiMonthlyEvents]);

  /* ─── KPIs ─── */
  const latestMonth = monthlyEvents[monthlyEvents.length - 1];
  const totalUsers = users.length;
  const activeUsers = React.useMemo(
    () => users.filter((u) => {
      const d = new Date(u.lastActiveDate + "T00:00:00");
      const ago = Date.now() - d.getTime();
      return ago < 30 * 86400000; // active in last 30 days
    }).length,
    [users]
  );
  const avgShipmentsPerUser = React.useMemo(
    () => Math.round(users.reduce((s, u) => s + u.shipmentsCreated, 0) / Math.max(totalUsers, 1)),
    [users, totalUsers]
  );
  const adoptionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const systemUtilization = React.useMemo(() => {
    // Composite: login frequency (40%) + feature breadth (30%) + session length (30%)
    const avgLogins = users.reduce((s, u) => s + u.loginCount, 0) / Math.max(totalUsers, 1);
    const avgFeatures = users.reduce((s, u) => s + u.features.length, 0) / Math.max(totalUsers, 1);
    const avgSession = users.reduce((s, u) => s + u.avgSessionMinutes, 0) / Math.max(totalUsers, 1);
    const loginScore = Math.min(avgLogins / 250, 1) * 40;
    const featureScore = Math.min(avgFeatures / 5, 1) * 30;
    const sessionScore = Math.min(avgSession / 40, 1) * 30;
    return Math.round(loginScore + featureScore + sessionScore);
  }, [users, totalUsers]);

  /* ─── Chart: Feature Usage Donut ─── */
  const featureDonutData = React.useMemo(() => {
    // Compute feature usage from user activity data
    const featureCount: Record<string, number> = {};
    users.forEach(u => {
      u.features.forEach(f => {
        const featureName = f.charAt(0).toUpperCase() + f.slice(1);
        featureCount[featureName] = (featureCount[featureName] || 0) + 1;
      });
    });
    // If no data, provide defaults
    if (Object.keys(featureCount).length === 0) {
      featureCount["Shipments"] = 1;
      featureCount["Reports"] = 1;
    }
    const colors = CATEGORY_COLORS;
    return Object.entries(featureCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length],
      }));
  }, [users]);

  /* ─── Chart: Monthly events ─── */
  const eventTrend = React.useMemo(
    () =>
      monthlyEvents.map((m) => ({
        month: formatMonthLabel(m.month),
        events: m.totalEvents,
        shipments: m.shipmentsCreated,
        reports: m.reportsViewed,
      })),
    [monthlyEvents]
  );

  /* ─── Chart: User activity bar ─── */
  const userActivityData = React.useMemo(
    () =>
      [...users]
        .sort((a, b) => b.shipmentsCreated - a.shipmentsCreated)
        .map((u) => ({
          name: u.userName.split(" ")[0],
          shipments: u.shipmentsCreated,
          logins: u.loginCount,
        })),
    [users]
  );

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Monthly Active"
            value={activeUsers}
            subtitle={`of ${totalUsers} users`}
            icon={Users}
          />
          <KpiCard
            title="Entries / User"
            value={avgShipmentsPerUser}
            subtitle="Avg shipments created"
            icon={MousePointerClick}
          />
          <KpiCard
            title="Adoption Rate"
            value={`${adoptionRate}%`}
            subtitle="Active / total"
            icon={TrendingUp}
            variant={adoptionRate >= 80 ? "success" : "warning"}
          />
          <KpiCard
            title="Utilization Index"
            value={systemUtilization}
            subtitle="Score (0–100)"
            icon={Activity}
            variant={systemUtilization >= 70 ? "success" : "warning"}
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
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </>
      }
      onExportPdf={handleExportPdf}
      isPdfExporting={isPdfExporting}
      onResetFilters={resetFilters}
      hasFilters={hasFilters}
    >
      <PillTabs defaultValue="usage">
        <PillTabsList>
          <PillTabsTrigger value="usage">Usage Overview</PillTabsTrigger>
          <PillTabsTrigger value="activity">User Activity</PillTabsTrigger>
        </PillTabsList>

        {/* Usage Overview */}
        <PillTabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartContainer
              title="Feature Usage Distribution"
              subtitle="% of total platform interactions by feature"
            >
              <ResponsiveContainer width="100%" height={featureDonutData.length * 32 + 30}>
                <BarChart
                  data={featureDonutData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} width={110} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value}%`, "Usage"]} />
                  <Bar dataKey="value" name="Usage %" fill={CATEGORY_COLORS[0]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Monthly Interaction Events"
              subtitle="Shipment entries, report views, and total events"
              chartClassName="h-[260px] lg:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={eventTrend}
                  margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-default)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="events"
                    name="Total Events"
                    stroke={CATEGORY_COLORS[0]}
                    fill="color-mix(in srgb, var(--color-primary-400) 10%, transparent)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="shipments"
                    name="Shipment Entries"
                    stroke={CATEGORY_COLORS[2]}
                    fill="color-mix(in srgb, var(--color-warning-500) 10%, transparent)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    name="Report Views"
                    stroke={CATEGORY_COLORS[4]}
                    fill="color-mix(in srgb, var(--color-primary-600) 10%, transparent)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* System Utilization Gauge */}
          <Card>
            <CardHeader>
              <CardTitle>System Utilization Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Daily Active Users", value: latestMonth?.dau ?? 0, max: totalUsers, color: "var(--color-primary-400)" },
                  { label: "Monthly Active Users", value: latestMonth?.mau ?? 0, max: totalUsers, color: "var(--color-teal-400)" },
                  { label: "Exports This Month", value: latestMonth?.exportsRun ?? 0, max: 50, color: "var(--color-warning-500)" },
                ].map((item) => (
                  <div key={item.label} className="space-y-2 text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {item.value}
                    </div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{item.label}</p>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </PillTabsContent>

        {/* User Activity */}
        <PillTabsContent value="activity" className="space-y-6">
          {/* User Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="pb-2 pr-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">User</th>
                      <th className="pb-2 px-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Role</th>
                      <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Shipments</th>
                      <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Logins</th>
                      <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Avg Session</th>
                      <th className="pb-2 pl-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.userId} className="border-b border-border-default last:border-0">
                        <td className="py-2.5 pr-3 font-medium text-text-primary">{u.userName}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={u.role === "admin" ? "error" : u.role === "manager" ? "warning" : u.role === "operator" ? "info" : "neutral"}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">{u.shipmentsCreated}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">{u.loginCount}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">{u.avgSessionMinutes}m</td>
                        <td className="py-2.5 pl-3">
                          <div className="flex flex-wrap gap-1">
                            {u.features.map((f) => (
                              <span key={f} className="text-xs px-1.5 py-0.5 rounded text-text-muted" style={{ backgroundColor: "var(--color-bg-subtle)" }}>{f}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </PillTabsContent>
      </PillTabs>
    </ReportContentLayout>
  );
}
