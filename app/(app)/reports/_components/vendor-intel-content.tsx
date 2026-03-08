"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ShieldAlert,
  Users,
  Clock,
  Award,
  RotateCcw,
} from "lucide-react";

import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
import { getVendors } from "@/lib/mock-data";
import { totalMpsCost, downloadCsv } from "@/lib/report-utils";
import { cn } from "@/lib/utils";
import type { Vendor } from "@/lib/types";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";

const PAGE_SIZE = 10;

export function VendorIntelContent() {
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

  const vendors = React.useMemo(() => getVendors(), []);
  const [compliancePage, setCompliancePage] = React.useState(1);

  /* ── Vendor-to-shipment mapping (uses filtered shipments) ── */
  const vendorShipmentMap = React.useMemo(() => {
    const map = new Map<string, { count: number; volume: number; cost: number }>();
    shipments.forEach((s) => {
      const key = s.vendorName;
      const existing = map.get(key) ?? { count: 0, volume: 0, cost: 0 };
      existing.count += 1;
      existing.volume += s.weightValue;
      existing.cost += totalMpsCost(s);
      map.set(key, existing);
    });
    return map;
  }, [shipments]);

  const hasData = shipments.length > 0;

  /* ── KPI computations ── */
  const now = Date.now();

  const totalVendors = vendors.length;

  const highRiskVendors = vendors.filter(
    (v) => v.riskLevel?.includes("High")
  ).length;

  const expiringCount = vendors.filter((v) => {
    if (!v.expirationDate) return false;
    const exp = new Date(v.expirationDate).getTime();
    const daysUntil = Math.floor((exp - now) / 86400000);
    return daysUntil > 0 && daysUntil <= 90;
  }).length;

  const dbeCount = vendors.filter((v) => v.dbeFlag === true).length;

  /* ── Risk pyramid data ── */
  const riskCounts = React.useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    let highVol = 0;
    let medVol = 0;
    let lowVol = 0;

    vendors.forEach((v) => {
      const vol = vendorShipmentMap.get(v.name)?.count ?? 0;
      if (v.riskLevel?.includes("High")) {
        high++;
        highVol += vol;
      } else if (v.riskLevel?.includes("Medium")) {
        medium++;
        medVol += vol;
      } else {
        low++;
        lowVol += vol;
      }
    });
    return { high, medium, low, highVol, medVol, lowVol };
  }, [vendors, vendorShipmentMap]);

  /* ── DBE / Diversity spend donut ── */
  const dbeSpendData = React.useMemo(() => {
    let dbeCost = 0;
    let nonDbeCost = 0;
    const dbeVendorNames = new Set(
      vendors.filter((v) => v.dbeFlag === true).map((v) => v.name)
    );

    shipments.forEach((s) => {
      const cost = totalMpsCost(s);
      if (dbeVendorNames.has(s.vendorName)) {
        dbeCost += cost;
      } else {
        nonDbeCost += cost;
      }
    });

    return {
      data: [
        { name: "DBE Vendors", value: Math.round(dbeCost) },
        { name: "Non-DBE Vendors", value: Math.round(nonDbeCost) },
      ],
      dbeCost,
      nonDbeCost,
    };
  }, [vendors, shipments]);

  /* ── Vendor Expiration Gantt ── */
  const ganttData = React.useMemo(() => {
    const items = vendors
      .filter((v) => v.expirationDate && v.dateEntered)
      .map((v) => {
        const start = new Date(v.dateEntered!).getTime();
        const end = new Date(v.expirationDate!).getTime();
        const daysUntilExp = Math.floor((end - now) / 86400000);
        return {
          name: v.name,
          start,
          end,
          daysUntilExp,
          status:
            daysUntilExp <= 0
              ? ("expired" as const)
              : daysUntilExp <= 90
                ? ("warning" as const)
                : ("active" as const),
        };
      })
      .sort((a, b) => a.end - b.end);

    if (items.length === 0) return { items, minTime: 0, maxTime: 1 };

    const minTime = Math.min(...items.map((i) => i.start));
    const maxTime = Math.max(...items.map((i) => i.end));

    return { items, minTime, maxTime };
  }, [vendors, now]);

  /* ── Compliance table data ── */
  const complianceData = React.useMemo(
    () =>
      [...vendors].sort((a, b) => {
        const aInc = a.completionStatus === "Incomplete" ? 0 : 1;
        const bInc = b.completionStatus === "Incomplete" ? 0 : 1;
        return aInc - bInc;
      }),
    [vendors]
  );

  /* ── Helper functions ── */

  const statusVariant = (status?: string) => {
    switch (status) {
      case "Active":
        return "success" as const;
      case "Temporary":
        return "warning" as const;
      case "Inactive":
        return "error" as const;
      default:
        return "neutral" as const;
    }
  };

  const riskVariant = (risk?: string) => {
    if (risk?.includes("High")) return "error" as const;
    if (risk?.includes("Medium")) return "warning" as const;
    return "success" as const;
  };

  const riskLabel = (risk?: string) => {
    if (risk?.includes("High")) return "High";
    if (risk?.includes("Medium")) return "Medium";
    return "Low";
  };

  const formatDate = (d?: string) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /* ── Compliance table columns ── */
  const complianceColumns: ColumnDef<Vendor, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Vendor",
        cell: ({ getValue }) => (
          <span className="font-medium text-text-primary">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "vendorStatus",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.vendorStatus)}>
            {row.original.vendorStatus ?? "Unknown"}
          </Badge>
        ),
      },
      {
        accessorKey: "riskLevel",
        header: "Risk Level",
        cell: ({ row }) => (
          <Badge variant={riskVariant(row.original.riskLevel)}>
            {riskLabel(row.original.riskLevel)}
          </Badge>
        ),
      },
      {
        accessorKey: "dateReviewed",
        header: "Last Reviewed",
        cell: ({ getValue }) => formatDate(getValue() as string | undefined),
      },
      {
        accessorKey: "expirationDate",
        header: "Expiration",
        cell: ({ getValue }) => formatDate(getValue() as string | undefined),
      },
      {
        accessorKey: "completionStatus",
        header: "Completion",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.completionStatus === "Complete"
                ? "success"
                : "warning"
            }
          >
            {row.original.completionStatus ?? "Unknown"}
          </Badge>
        ),
      },
    ],
    []
  );

  /* ── CSV export ── */
  const handleExport = () => {
    const headers = ["Vendor", "Status", "Risk Level", "Expiration", "Completion"];
    const rows = complianceData.map((v) => [
      v.name,
      v.vendorStatus ?? "Unknown",
      riskLabel(v.riskLevel),
      v.expirationDate ?? "",
      v.completionStatus ?? "Unknown",
    ]);
    downloadCsv("Vendor_Intelligence_Report.csv", headers, rows);
  };

  /* Reset pagination when data changes */
  React.useEffect(() => {
    setCompliancePage(1);
  }, [shipments]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard title="Total Vendors" value={totalVendors} icon={Users} />
          <KpiCard title="High Risk" value={highRiskVendors} icon={ShieldAlert} variant="error" />
          <KpiCard title="Expiring < 90d" value={expiringCount} icon={Clock} variant="warning" />
          <KpiCard title="DBE Vendors" value={dbeCount} icon={Award} variant="success" />
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
        <PillTabs defaultValue="risk">
          <PillTabsList>
            <PillTabsTrigger value="risk">Risk & Diversity</PillTabsTrigger>
            <PillTabsTrigger value="timeline">Expiration Timeline</PillTabsTrigger>
            <PillTabsTrigger value="compliance" count={complianceData.length}>
              Compliance
            </PillTabsTrigger>
          </PillTabsList>

          {/* Risk Pyramid + DBE Spend */}
          <PillTabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Risk Pyramid */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Risk Pyramid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-1">
                    {/* High Risk - narrow */}
                    <div className="w-[40%] bg-error-200 rounded-sm px-3 py-2 text-center">
                      <span className="text-xs font-semibold text-error-700">
                        {riskCounts.high} vendors
                      </span>
                      <span className="text-xs text-error-600 ml-2">
                        ({riskCounts.highVol} shipments)
                      </span>
                    </div>
                    {/* Medium Risk - medium */}
                    <div className="w-[65%] bg-warning-200 rounded-sm px-3 py-2 text-center">
                      <span className="text-xs font-semibold text-warning-700">
                        {riskCounts.medium} vendors
                      </span>
                      <span className="text-xs text-warning-600 ml-2">
                        ({riskCounts.medVol} shipments)
                      </span>
                    </div>
                    {/* Low Risk - wide */}
                    <div className="w-full bg-success-200 rounded-sm px-3 py-2 text-center">
                      <span className="text-xs font-semibold text-success-700">
                        {riskCounts.low} vendors
                      </span>
                      <span className="text-xs text-success-600 ml-2">
                        ({riskCounts.lowVol} shipments)
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between text-xs text-text-muted px-2">
                    <span>High Risk (top)</span>
                    <span>Low Risk (bottom)</span>
                  </div>
                </CardContent>
              </Card>

              {/* DBE / Diversity Spend Donut */}
              <ChartContainer
                title="DBE / Diversity Spend"
                subtitle="Cost allocation by DBE status"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dbeSpendData.data}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(1)}%`
                      }
                      labelLine={{ stroke: "var(--color-text-muted)" }}
                      style={{ fontSize: 11 }}
                    >
                      <Cell fill={CATEGORY_COLORS[1]} />
                      <Cell fill={CATEGORY_COLORS[6]} />
                    </Pie>
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Expiration Timeline */}
          <PillTabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Expiration Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {ganttData.items.length === 0 ? (
                  <p className="text-sm text-text-muted py-4 text-center">
                    No vendor expiration data available.
                  </p>
                ) : (
                  <div className="space-y-1.5 overflow-x-auto">
                    {ganttData.items.map((item) => {
                      const totalRange = ganttData.maxTime - ganttData.minTime;
                      const leftPct =
                        totalRange > 0
                          ? ((item.start - ganttData.minTime) / totalRange) * 100
                          : 0;
                      const widthPct =
                        totalRange > 0
                          ? ((item.end - item.start) / totalRange) * 100
                          : 100;

                      const barColor =
                        item.status === "expired"
                          ? "bg-error-400"
                          : item.status === "warning"
                            ? "bg-warning-400"
                            : "bg-success-400";

                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="text-xs text-text-muted w-36 min-w-[9rem] truncate text-right">
                            {item.name}
                          </span>
                          <div className="relative flex-1 h-5 bg-surface-secondary rounded-sm min-w-[200px]">
                            <div
                              className={cn("absolute h-full rounded-sm", barColor)}
                              style={{
                                left: `${leftPct}%`,
                                width: `${Math.max(widthPct, 1)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-xs w-20 min-w-[5rem] text-right",
                              item.status === "expired"
                                ? "text-error-600"
                                : item.status === "warning"
                                  ? "text-warning-600"
                                  : "text-success-600"
                            )}
                          >
                            {item.status === "expired"
                              ? "Expired"
                              : `${item.daysUntilExp}d left`}
                          </span>
                        </div>
                      );
                    })}

                    {/* Timeline legend */}
                    <div className="flex justify-between text-xs text-text-muted pt-2 border-t border-border-default mt-2">
                      <span>
                        {new Date(ganttData.minTime).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 h-2 rounded-sm bg-success-400" />
                          Active
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 h-2 rounded-sm bg-warning-400" />
                          &lt;90 days
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 h-2 rounded-sm bg-error-400" />
                          Expired
                        </span>
                      </div>
                      <span>
                        {new Date(ganttData.maxTime).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </PillTabsContent>

          {/* Compliance Data Table */}
          <PillTabsContent value="compliance">
            <DataTable
              columns={complianceColumns}
              data={complianceData.slice(
                (compliancePage - 1) * PAGE_SIZE,
                compliancePage * PAGE_SIZE
              )}
              pagination={{
                page: compliancePage,
                pageSize: PAGE_SIZE,
                total: complianceData.length,
              }}
              onPaginationChange={setCompliancePage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No vendor compliance data found
                </div>
              }
            />
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<Users className="h-10 w-10" />}
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
