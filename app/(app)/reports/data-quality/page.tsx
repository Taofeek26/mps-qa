"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { ChartContainer, CATEGORY_COLORS, TOOLTIP_STYLE } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllShipments } from "@/lib/mock-data";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileWarning,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Quality Gauge ─── */

function QualityGauge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "text-success-600"
      : score >= 70
        ? "text-warning-500"
        : "text-error-600";
  const ringColor =
    score >= 90
      ? "border-success-500"
      : score >= 70
        ? "border-warning-500"
        : "border-error-500";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "relative flex items-center justify-center w-32 h-32 rounded-full border-8 border-bg-subtle"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full border-8 border-t-transparent border-r-transparent",
            ringColor
          )}
          style={{ transform: `rotate(${(score / 100) * 360}deg)` }}
        />
        <div className="text-center">
          <p className={cn("text-3xl font-bold", color)}>{score}%</p>
          <p className="text-[10px] text-text-muted">Quality</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function isMissing(val: string | null | undefined): boolean {
  return val == null || val === "" || val === "N/A";
}

interface QualityMetric {
  label: string;
  icon: React.ElementType;
  count: number;
  total: number;
}

function getVariantForPct(pct: number): "success" | "warning" | "error" {
  if (pct < 5) return "success";
  if (pct <= 15) return "warning";
  return "error";
}

function getVariantLabel(variant: "success" | "warning" | "error"): string {
  if (variant === "success") return "Good";
  if (variant === "warning") return "Needs Attention";
  return "Critical";
}

/* ─── Page Component ─── */

export default function DataQualityPage() {
  const shipments = React.useMemo(() => getAllShipments(), []);
  const total = shipments.length;

  /* ── Section 2: Quality breakdown metrics ── */
  const metrics: QualityMetric[] = React.useMemo(() => {
    let missingSource = 0;
    let missingForm = 0;
    let missingTreatment = 0;
    let nullTransporters = 0;
    let missingManifests = 0;
    let invalidReturnDates = 0;

    for (const s of shipments) {
      if (isMissing(s.sourceCode)) missingSource++;
      if (isMissing(s.formCode)) missingForm++;
      if (isMissing(s.treatmentCode)) missingTreatment++;
      if (isMissing(s.transporterName)) nullTransporters++;
      if (isMissing(s.manifestNumber)) missingManifests++;
      if (
        s.returnManifestDate &&
        s.shipmentDate &&
        new Date(s.returnManifestDate) < new Date(s.shipmentDate)
      ) {
        invalidReturnDates++;
      }
    }

    return [
      { label: "Missing Source Codes", icon: FileWarning, count: missingSource, total },
      { label: "Missing Form Codes", icon: FileWarning, count: missingForm, total },
      { label: "Missing Treatment Codes", icon: FileWarning, count: missingTreatment, total },
      { label: "Null Transporters", icon: Truck, count: nullTransporters, total },
      { label: "Missing Manifests", icon: AlertTriangle, count: missingManifests, total },
      { label: "Invalid Return Dates", icon: XCircle, count: invalidReturnDates, total },
    ];
  }, [shipments, total]);

  /* ── Section 1: Overall quality score ── */
  const overallScore = React.useMemo(() => {
    // Average of (1 - issue_rate) across all metrics
    const totalIssues = metrics.reduce((sum, m) => sum + m.count, 0);
    const totalChecks = metrics.length * total;
    if (totalChecks === 0) return 100;
    return Math.round((1 - totalIssues / totalChecks) * 100);
  }, [metrics, total]);

  /* ── Section 3: Profile coverage donut ── */
  const profileData = React.useMemo(() => {
    let withProfile = 0;
    let hazNoProfile = 0;
    let nonHazNoProfile = 0;

    for (const s of shipments) {
      if (!isMissing(s.profileNumber)) {
        withProfile++;
      } else if (s.wasteCategory === "Hazardous Waste") {
        hazNoProfile++;
      } else {
        nonHazNoProfile++;
      }
    }

    return [
      { name: "Has Profile", value: withProfile },
      { name: "No Profile", value: nonHazNoProfile },
      { name: "Haz - No Profile", value: hazNoProfile },
    ].filter((d) => d.value > 0);
  }, [shipments]);

  const PROFILE_COLORS = [CATEGORY_COLORS[1], CATEGORY_COLORS[5], CATEGORY_COLORS[3]];

  /* ── Section 4: Manifest return lag histogram ── */
  const lagHistogram = React.useMemo(() => {
    const buckets = [
      { label: "0-7d", min: 0, max: 7, count: 0 },
      { label: "7-14d", min: 7, max: 14, count: 0 },
      { label: "14-30d", min: 14, max: 30, count: 0 },
      { label: "30-60d", min: 30, max: 60, count: 0 },
      { label: "60+d", min: 60, max: Infinity, count: 0 },
    ];

    for (const s of shipments) {
      if (!s.returnManifestDate || !s.shipmentDate) continue;
      const shipDate = new Date(s.shipmentDate);
      const retDate = new Date(s.returnManifestDate);
      const diffDays = Math.round(
        (retDate.getTime() - shipDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 0) continue; // invalid dates handled elsewhere
      for (const b of buckets) {
        if (diffDays >= b.min && diffDays < b.max) {
          b.count++;
          break;
        }
      }
    }

    return buckets.map((b) => ({ name: b.label, count: b.count }));
  }, [shipments]);

  const lagBarColors = [
    CATEGORY_COLORS[1], // green-ish (teal)
    CATEGORY_COLORS[1],
    CATEGORY_COLORS[2], // yellow
    CATEGORY_COLORS[2],
    CATEGORY_COLORS[3], // red
  ];

  /* ── Section 5: Duplicate manifests ── */
  const duplicateManifests = React.useMemo(() => {
    const manifestMap = new Map<
      string,
      { count: number; dates: string[]; sites: Set<string>; wasteTypes: Set<string> }
    >();

    for (const s of shipments) {
      if (isMissing(s.manifestNumber)) continue;
      const key = s.manifestNumber!;
      if (!manifestMap.has(key)) {
        manifestMap.set(key, { count: 0, dates: [], sites: new Set(), wasteTypes: new Set() });
      }
      const entry = manifestMap.get(key)!;
      entry.count++;
      entry.dates.push(s.shipmentDate);
      entry.sites.add(s.siteName);
      entry.wasteTypes.add(s.wasteTypeName);
    }

    return Array.from(manifestMap.entries())
      .filter(([, v]) => v.count >= 2)
      .map(([manifest, v]) => {
        const sorted = [...v.dates].sort();
        const first = new Date(sorted[0]);
        const last = new Date(sorted[sorted.length - 1]);
        const daySpan = Math.round(
          (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          manifest,
          occurrences: v.count,
          dateRange: `${sorted[0]} - ${sorted[sorted.length - 1]}`,
          daySpan,
          sites: Array.from(v.sites).join(", "),
          wasteTypes: Array.from(v.wasteTypes).join(", "),
        };
      })
      .sort((a, b) => b.occurrences - a.occurrences);
  }, [shipments]);

  /* ── Section 6: Container fill rate ── */
  const fillRateData = React.useMemo(() => {
    const byContainer = new Map<string, { totalRate: number; count: number }>();

    for (const s of shipments) {
      const cType = s.containerType ?? "Unknown";
      if (!s.targetLoadWeight || s.targetLoadWeight === 0) continue;
      const fillRate = Math.min((s.weightValue / s.targetLoadWeight) * 100, 150); // cap at 150%
      if (!byContainer.has(cType)) {
        byContainer.set(cType, { totalRate: 0, count: 0 });
      }
      const entry = byContainer.get(cType)!;
      entry.totalRate += fillRate;
      entry.count++;
    }

    return Array.from(byContainer.entries())
      .map(([name, v]) => ({
        name,
        avgFill: Math.round(v.totalRate / v.count),
      }))
      .sort((a, b) => b.avgFill - a.avgFill);
  }, [shipments]);

  function fillColor(pct: number): string {
    if (pct >= 80) return CATEGORY_COLORS[1]; // teal/green
    if (pct >= 60) return CATEGORY_COLORS[2]; // amber
    return CATEGORY_COLORS[3]; // red
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Quality"
        subtitle="Data health scorecard showing completeness, quality scores, duplicates, and compliance gaps"
      />

      {/* ── Section 1: Overall Score + Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary-400" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-4">
            <QualityGauge score={overallScore} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-[var(--radius-sm)] bg-bg-subtle">
                <p className="text-2xl font-bold text-text-primary">{total}</p>
                <p className="text-xs text-text-muted">Total Shipments</p>
              </div>
              <div className="text-center p-3 rounded-[var(--radius-sm)] bg-bg-subtle">
                <p className="text-2xl font-bold text-success-600">
                  {metrics.reduce((sum, m) => sum + (m.total - m.count), 0)}
                </p>
                <p className="text-xs text-text-muted">Fields Complete</p>
              </div>
              <div className="text-center p-3 rounded-[var(--radius-sm)] bg-bg-subtle">
                <p className="text-2xl font-bold text-error-600">
                  {metrics.reduce((sum, m) => sum + m.count, 0)}
                </p>
                <p className="text-xs text-text-muted">Fields Missing</p>
              </div>
              <div className="text-center p-3 rounded-[var(--radius-sm)] bg-bg-subtle">
                <p className="text-2xl font-bold text-text-primary">
                  {profileData.find((d) => d.name === "Has Profile")?.value ?? 0}
                </p>
                <p className="text-xs text-text-muted">With Profile</p>
              </div>
              <div className="text-center p-3 rounded-[var(--radius-sm)] bg-bg-subtle">
                <p className="text-2xl font-bold text-warning-500">
                  {duplicateManifests.length}
                </p>
                <p className="text-xs text-text-muted">Duplicate Manifests</p>
              </div>
              <div className="text-center p-3 rounded-[var(--radius-sm)] bg-bg-subtle">
                <p className="text-2xl font-bold text-text-primary">
                  {fillRateData.length}
                </p>
                <p className="text-xs text-text-muted">Container Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 2: Quality Breakdown Cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Quality Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m) => {
            const pct = total > 0 ? Math.round((m.count / m.total) * 100) : 0;
            const variant = getVariantForPct(pct);
            const Icon = m.icon;
            return (
              <Card key={m.label}>
                <CardContent className="flex items-start gap-3 pt-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                      variant === "success"
                        ? "bg-success-100 text-success-600"
                        : variant === "warning"
                          ? "bg-warning-100 text-warning-600"
                          : "bg-error-100 text-error-600"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{m.label}</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">
                      {m.count}{" "}
                      <span className="text-sm font-normal text-text-muted">
                        / {m.total}
                      </span>
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-text-muted">
                        {pct}% of shipments
                      </p>
                      <Badge variant={variant}>{getVariantLabel(variant)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Section 3 & 4: Profile Coverage + Manifest Lag ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="Profile Coverage"
          subtitle="Shipments with vs without waste profile assignment"
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={profileData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {profileData.map((_, i) => (
                  <Cell key={i} fill={PROFILE_COLORS[i % PROFILE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value) => [Number(value).toLocaleString(), "Shipments"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {profileData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PROFILE_COLORS[i % PROFILE_COLORS.length] }}
                />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer
          title="Manifest Return Lag"
          subtitle="Days between shipment date and manifest return"
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lagHistogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                allowDecimals={false}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value) => [value, "Shipments"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {lagHistogram.map((_, i) => (
                  <Cell key={i} fill={lagBarColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* ── Section 5: Duplicate Manifests ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning-500" />
            Duplicate Manifest Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {duplicateManifests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              <CheckCircle2 className="h-8 w-8 mb-2 text-success-500" />
              <p className="text-sm font-medium">No duplicate manifests detected</p>
              <p className="text-xs mt-1">All manifest numbers are unique across shipments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-muted">
                      Manifest #
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-text-muted">
                      Occurrences
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-muted">
                      Date Range
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-muted">
                      Sites
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-text-muted">
                      Waste Types
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {duplicateManifests.map((d) => (
                    <tr
                      key={d.manifest}
                      className={cn(
                        "border-b border-border-default last:border-b-0",
                        d.daySpan > 30 ? "bg-error-100/30" : ""
                      )}
                    >
                      <td className="py-2 px-3 font-mono text-text-primary">
                        {d.manifest}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant={d.occurrences >= 3 ? "error" : "warning"}>
                          {d.occurrences}x
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-text-muted">
                        {d.dateRange}
                        {d.daySpan > 30 && (
                          <span className="ml-1 text-error-600 text-xs font-medium">
                            ({d.daySpan}d span)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-text-muted truncate max-w-[200px]">
                        {d.sites}
                      </td>
                      <td className="py-2 px-3 text-text-muted truncate max-w-[200px]">
                        {d.wasteTypes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 6: Container Fill Rate ── */}
      <ChartContainer
        title="Container Fill Rate by Type"
        subtitle="Average actual weight vs target load weight per container type"
        height={Math.max(200, fillRateData.length * 40 + 40)}
      >
        {fillRateData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <CheckCircle2 className="h-8 w-8 mb-2 text-text-muted" />
            <p className="text-sm">No container fill data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fillRateData}
              layout="vertical"
              margin={{ left: 20, right: 30 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-default)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 120]}
                tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                width={120}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value) => [`${value}%`, "Avg Fill Rate"]}
              />
              <Bar dataKey="avgFill" radius={[0, 4, 4, 0]}>
                {fillRateData.map((d, i) => (
                  <Cell key={i} fill={fillColor(d.avgFill)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  );
}
