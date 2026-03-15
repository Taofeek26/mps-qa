"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
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
import { ChartContainer, CATEGORY_COLORS, CHART_COLORS, TOOLTIP_STYLE, DonutChart, ProgressList } from "@/components/charts";
import { getVendors } from "@/lib/mock-data";
import { getServiceVerifications, getRouteSchedules } from "@/lib/mock-kpi-data";
import { totalMpsCost, downloadCsv } from "@/lib/report-utils";
import { cn } from "@/lib/utils";
import type { Vendor } from "@/lib/types";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";


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

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

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

  const filterSummary = [clientId && "Customer filtered", siteId && "Site filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("vendor-intel", shipments, filterSummary);

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

  /* ── Service Quality KPIs (new) ── */
  const serviceVerifications = React.useMemo(() => getServiceVerifications(), []);
  const routeSchedules = React.useMemo(() => getRouteSchedules(), []);

  const verificationRate = React.useMemo(() => {
    if (serviceVerifications.length === 0) return 100;
    const verified = serviceVerifications.filter((sv) => sv.verified).length;
    return Math.round((verified / serviceVerifications.length) * 100);
  }, [serviceVerifications]);

  const goBackRate = React.useMemo(() => {
    if (serviceVerifications.length === 0) return 0;
    const gobacks = serviceVerifications.filter((sv) => sv.goBack).length;
    return Math.round((gobacks / serviceVerifications.length) * 1000) / 10;
  }, [serviceVerifications]);

  const goBackReasons = React.useMemo(() => {
    const byReason = new Map<string, number>();
    serviceVerifications.forEach((sv) => {
      if (sv.goBackReason) {
        byReason.set(sv.goBackReason, (byReason.get(sv.goBackReason) ?? 0) + 1);
      }
    });
    return Array.from(byReason.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [serviceVerifications]);

  const routeOptimization = React.useMemo(() => {
    const bySite = new Map<string, { onTime: number; total: number }>();
    routeSchedules.forEach((rs) => {
      const existing = bySite.get(rs.siteName) ?? { onTime: 0, total: 0 };
      if (rs.onTime) existing.onTime++;
      existing.total++;
      bySite.set(rs.siteName, existing);
    });
    return Array.from(bySite.entries())
      .map(([name, d]) => ({
        label: name,
        value: d.total > 0 ? (d.onTime / d.total) * 100 : 0,
        displayValue: `${Math.round(d.total > 0 ? (d.onTime / d.total) * 100 : 0)}%`,
        secondary: `${d.onTime}/${d.total} on-time`,
      }))
      .sort((a, b) => a.value - b.value);
  }, [routeSchedules]);

  /* Reset pagination when data changes */
  React.useEffect(() => {
    setCompliancePage(1);
  }, [shipments]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard title="Total Vendors" value={totalVendors} subtitle="All registered" icon={Users} />
          <KpiCard title="High Risk" value={highRiskVendors} subtitle="Requires review" icon={ShieldAlert} variant="error" />
          <KpiCard title="Expiring < 90d" value={expiringCount} subtitle="Action needed" icon={Clock} variant="warning" />
          <KpiCard title="DBE Vendors" value={dbeCount} subtitle="Diversity certified" icon={Award} variant="success" />
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
      onResetFilters={resetFilters}
      hasFilters={hasFilters}
    >
      {hasData ? (
        <PillTabs defaultValue="risk">
          <PillTabsList>
            <PillTabsTrigger value="risk">Risk & Diversity</PillTabsTrigger>
            <PillTabsTrigger value="timeline">Expiration Timeline</PillTabsTrigger>
            <PillTabsTrigger value="compliance" count={complianceData.length}>
              Compliance
            </PillTabsTrigger>
            <PillTabsTrigger value="service-quality">Service Quality</PillTabsTrigger>
          </PillTabsList>

          {/* Risk Matrix + DBE Spend */}
          <PillTabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-4">
              {/* Vendor Risk Matrix */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Vendor Risk Matrix</CardTitle>
                    <div className="flex items-center gap-3 text-[10px] text-text-muted">
                      {[
                        { label: "High", color: "var(--color-error-400)" },
                        { label: "Medium", color: "var(--color-warning-400)" },
                        { label: "Low", color: "var(--color-success-400)" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1">
                          <span className="shrink-0 rounded-sm" style={{ width: 10, height: 10, display: "block", backgroundColor: item.color }} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-border-default">
                          <th className="pb-2 pr-3 text-left font-semibold text-text-muted uppercase tracking-wider">Vendor</th>
                          <th className="pb-2 px-2 text-center font-semibold text-text-muted uppercase tracking-wider">Risk</th>
                          <th className="pb-2 px-2 text-right font-semibold text-text-muted uppercase tracking-wider">Shipments</th>
                          <th className="pb-2 px-2 text-left font-semibold text-text-muted uppercase tracking-wider w-28">Volume</th>
                          <th className="pb-2 px-2 text-right font-semibold text-text-muted uppercase tracking-wider">Cost</th>
                          <th className="pb-2 px-2 text-center font-semibold text-text-muted uppercase tracking-wider">DBE</th>
                          <th className="pb-2 pl-2 text-center font-semibold text-text-muted uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const maxVol = Math.max(...vendors.map((v) => vendorShipmentMap.get(v.name)?.count ?? 0), 1);
                          return [...vendors]
                            .sort((a, b) => {
                              const riskOrder = (r?: string) => r?.includes("High") ? 0 : r?.includes("Medium") ? 1 : 2;
                              const diff = riskOrder(a.riskLevel) - riskOrder(b.riskLevel);
                              if (diff !== 0) return diff;
                              return (vendorShipmentMap.get(b.name)?.count ?? 0) - (vendorShipmentMap.get(a.name)?.count ?? 0);
                            })
                            .map((v) => {
                              const data = vendorShipmentMap.get(v.name) ?? { count: 0, volume: 0, cost: 0 };
                              const riskColor = v.riskLevel?.includes("High")
                                ? "var(--color-error-400)"
                                : v.riskLevel?.includes("Medium")
                                  ? "var(--color-warning-400)"
                                  : "var(--color-success-400)";
                              const barPct = maxVol > 0 ? (data.count / maxVol) * 100 : 0;
                              return (
                                <tr key={v.id} className="border-b border-border-default last:border-0 hover:bg-surface-secondary/50 transition-colors">
                                  <td className="py-2 pr-3 font-medium text-text-primary truncate max-w-[140px]">{v.name}</td>
                                  <td className="py-2 px-2 text-center">
                                    <span
                                      className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                                      style={{ backgroundColor: riskColor }}
                                    >
                                      {riskLabel(v.riskLevel)}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-right tabular-nums font-mono text-text-secondary">{data.count}</td>
                                  <td className="py-2 px-2">
                                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${barPct}%`, backgroundColor: riskColor }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2 px-2 text-right tabular-nums font-mono text-text-secondary">
                                    {data.cost >= 1000 ? `$${(data.cost / 1000).toFixed(0)}k` : `$${Math.round(data.cost)}`}
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {v.dbeFlag ? (
                                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-success-400)" }} />
                                    ) : (
                                      <span className="text-text-muted">—</span>
                                    )}
                                  </td>
                                  <td className="py-2 pl-2 text-center">
                                    <Badge variant={statusVariant(v.vendorStatus)}>
                                      {v.vendorStatus ?? "Unknown"}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* DBE / Diversity Spend */}
              <Card>
                <CardHeader>
                  <CardTitle>DBE / Diversity Spend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Proportion bar */}
                  {(() => {
                    const total = dbeSpendData.dbeCost + dbeSpendData.nonDbeCost;
                    const dbePct = total > 0 ? Math.round((dbeSpendData.dbeCost / total) * 100) : 0;
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-text-primary">DBE: ${Math.round(dbeSpendData.dbeCost).toLocaleString()} ({dbePct}%)</span>
                          <span className="text-text-muted">Non-DBE: ${Math.round(dbeSpendData.nonDbeCost).toLocaleString()} ({100 - dbePct}%)</span>
                        </div>
                        <div className="flex h-4 rounded overflow-hidden">
                          <div
                            className="h-full rounded-l transition-all"
                            style={{ width: `${dbePct}%`, backgroundColor: "var(--color-primary-400)" }}
                          />
                          <div
                            className="h-full rounded-r flex-1"
                            style={{ backgroundColor: "var(--color-border-strong)" }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* DBE vendor breakdown */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">DBE Vendors</p>
                    {(() => {
                      const dbeVendorNames = new Set(vendors.filter((v) => v.dbeFlag).map((v) => v.name));
                      const dbeVendorSpend: Array<{ name: string; cost: number }> = [];
                      const byVendor = new Map<string, number>();
                      shipments.forEach((s) => {
                        if (dbeVendorNames.has(s.vendorName)) {
                          byVendor.set(s.vendorName, (byVendor.get(s.vendorName) ?? 0) + totalMpsCost(s));
                        }
                      });
                      byVendor.forEach((cost, name) => dbeVendorSpend.push({ name, cost }));
                      dbeVendorSpend.sort((a, b) => b.cost - a.cost);
                      const maxCost = Math.max(...dbeVendorSpend.map((d) => d.cost), 1);

                      if (dbeVendorSpend.length === 0) {
                        return <p className="text-xs text-text-muted">No DBE vendor spend in current filter</p>;
                      }

                      return (
                        <div className="space-y-2">
                          {dbeVendorSpend.map((d) => (
                            <div key={d.name} className="flex items-center gap-3">
                              <span className="text-xs text-text-primary w-28 truncate shrink-0">{d.name}</span>
                              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${(d.cost / maxCost) * 100}%`, backgroundColor: "var(--color-primary-400)" }}
                                />
                              </div>
                              <span className="text-xs text-text-muted tabular-nums font-mono shrink-0">
                                ${d.cost >= 1000 ? `${(d.cost / 1000).toFixed(0)}k` : Math.round(d.cost)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
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
                          ? "var(--color-error-400)"
                          : item.status === "warning"
                            ? "var(--color-warning-400)"
                            : "var(--color-success-400)";

                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="text-xs text-text-muted w-36 min-w-[9rem] truncate text-right">
                            {item.name}
                          </span>
                          <div className="relative flex-1 h-5 rounded-sm min-w-[200px]" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                            <div
                              className="absolute h-full rounded-sm"
                              style={{
                                left: `${leftPct}%`,
                                width: `${Math.max(widthPct, 1)}%`,
                                backgroundColor: barColor,
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
                          <span className="shrink-0 rounded-sm" style={{ width: 12, height: 8, display: "block", backgroundColor: "var(--color-success-400)" }} />
                          Active
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="shrink-0 rounded-sm" style={{ width: 12, height: 8, display: "block", backgroundColor: "var(--color-warning-400)" }} />
                          &lt;90 days
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="shrink-0 rounded-sm" style={{ width: 12, height: 8, display: "block", backgroundColor: "var(--color-error-400)" }} />
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
            <div ref={tableRef}>
            <DataTable
              columns={complianceColumns}
              data={complianceData.slice(
                (compliancePage - 1) * pageSize,
                compliancePage * pageSize
              )}
              pagination={{
                page: compliancePage,
                pageSize: pageSize,
                total: complianceData.length,
              }}
              onPaginationChange={setCompliancePage}
              emptyState={
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  No vendor compliance data found
                </div>
              }
            />
            </div>
          </PillTabsContent>
          {/* Service Quality */}
          <PillTabsContent value="service-quality" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard
                title="Verification Rate"
                value={`${verificationRate}%`}
                subtitle="Service confirmed"
                icon={Award}
                variant={verificationRate >= 95 ? "success" : "warning"}
              />
              <KpiCard
                title="Go-Back Rate"
                value={`${goBackRate}%`}
                subtitle="Return trips needed"
                icon={Clock}
                variant={goBackRate < 3 ? "success" : "warning"}
              />
              <KpiCard
                title="Missing Items"
                value={serviceVerifications.filter((sv) => !sv.verified && !sv.goBack).length}
                subtitle="Unresolved"
                icon={ShieldAlert}
                variant="warning"
              />
              <KpiCard
                title="Route Efficiency"
                value={`${Math.round(routeSchedules.filter((r) => r.onTime).length / Math.max(routeSchedules.length, 1) * 100)}%`}
                subtitle="On-time routes"
                icon={Users}
                variant="success"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Go-Back Reasons"
                subtitle="Why return trips were required"
              >
                {goBackReasons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={goBackReasons} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="reason" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} width={120} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Bar dataKey="count" fill={CHART_COLORS.warning} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-sm text-text-muted">
                    No go-back events in current data
                  </div>
                )}
              </ChartContainer>

              <ChartContainer
                title="Route Optimization by Site"
                subtitle="On-time route completion rate"
              >
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={routeOptimization.map((d) => ({ name: d.label, rate: Math.round(d.value) }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={100} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value}%`, "On-Time"]} />
                    <Bar dataKey="rate" name="On-Time %" radius={[0, 4, 4, 0]}>
                      {routeOptimization.map((d, i) => (
                        <Cell key={i} fill={d.value >= 90 ? "var(--color-success-400)" : d.value >= 70 ? "var(--color-warning-400)" : "var(--color-error-400)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
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
