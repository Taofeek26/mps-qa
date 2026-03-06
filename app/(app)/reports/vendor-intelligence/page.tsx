"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { ChartContainer, CATEGORY_COLORS, TOOLTIP_STYLE } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllShipments, getVendors } from "@/lib/mock-data";
import { totalMpsCost } from "@/lib/report-utils";
import { ShieldAlert, Users, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorIntelligencePage() {
  const vendors = React.useMemo(() => getVendors(), []);
  const shipments = React.useMemo(() => getAllShipments(), []);

  /* ── Vendor-to-shipment mapping ── */
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

    const total = dbeCost + nonDbeCost;
    const dbePct = total > 0 ? ((dbeCost / total) * 100).toFixed(1) : "0.0";
    const nonDbePct = total > 0 ? ((nonDbeCost / total) * 100).toFixed(1) : "0.0";

    return {
      data: [
        { name: "DBE Vendors", value: Math.round(dbeCost) },
        { name: "Non-DBE Vendors", value: Math.round(nonDbeCost) },
      ],
      dbeCost,
      nonDbeCost,
      total,
      dbePct,
      nonDbePct,
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
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Intelligence"
        subtitle="Risk analysis, diversity spend tracking, and compliance monitoring"
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-primary-100 p-3">
              <Users className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Vendors</p>
              <p className="text-2xl font-bold text-text-primary">
                {totalVendors}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-error-100 p-3">
              <ShieldAlert className="h-5 w-5 text-error-500" />
            </div>
            <div>
              <p className="text-sm text-text-muted">High Risk Vendors</p>
              <p className="text-2xl font-bold text-error-600">
                {highRiskVendors}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-warning-100 p-3">
              <Clock className="h-5 w-5 text-warning-500" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Expiring &lt; 90 Days</p>
              <p className="text-2xl font-bold text-warning-600">
                {expiringCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-teal-100 p-3">
              <Award className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <p className="text-sm text-text-muted">DBE Vendors</p>
              <p className="text-2xl font-bold text-teal-600">{dbeCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Risk Pyramid + DBE Spend ── */}
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

      {/* ── Vendor Expiration Timeline ── */}
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

      {/* ── Vendor Compliance Status Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left">
                  <th className="pb-2 font-medium text-text-muted">Vendor</th>
                  <th className="pb-2 font-medium text-text-muted">Status</th>
                  <th className="pb-2 font-medium text-text-muted">
                    Risk Level
                  </th>
                  <th className="pb-2 font-medium text-text-muted">
                    Last Reviewed
                  </th>
                  <th className="pb-2 font-medium text-text-muted">
                    Expiration
                  </th>
                  <th className="pb-2 font-medium text-text-muted">
                    Completion
                  </th>
                </tr>
              </thead>
              <tbody>
                {complianceData.map((v) => (
                  <tr
                    key={v.id}
                    className={cn(
                      "border-b border-border-default last:border-0",
                      v.completionStatus === "Incomplete" &&
                        "bg-warning-50"
                    )}
                  >
                    <td className="py-2.5 text-text-primary font-medium">
                      {v.name}
                    </td>
                    <td className="py-2.5">
                      <Badge variant={statusVariant(v.vendorStatus)}>
                        {v.vendorStatus ?? "Unknown"}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <Badge variant={riskVariant(v.riskLevel)}>
                        {riskLabel(v.riskLevel)}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-text-primary">
                      {formatDate(v.dateReviewed)}
                    </td>
                    <td className="py-2.5 text-text-primary">
                      {formatDate(v.expirationDate)}
                    </td>
                    <td className="py-2.5">
                      <Badge
                        variant={
                          v.completionStatus === "Complete"
                            ? "success"
                            : "warning"
                        }
                      >
                        {v.completionStatus ?? "Unknown"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
