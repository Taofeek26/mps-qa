"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileWarning,
  Truck,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
import { downloadCsv } from "@/lib/report-utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";

/* ─── Quality Gauge ─── */

function QualityGauge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "var(--color-success-500)"
      : score >= 70
        ? "var(--color-warning-500)"
        : "var(--color-error-500)";

  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-bg-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 14, fontWeight: 700, fontFamily: "Inter, system-ui, sans-serif", fill: color }}
        >
          {score}%
        </text>
      </svg>
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


/* ─── Duplicate Manifest Row Type ─── */

interface DuplicateManifestRow {
  manifest: string;
  occurrences: number;
  dateRange: string;
  daySpan: number;
  sites: string;
  wasteTypes: string;
}

/* ─── Content Component ─── */

export function DataQualityContent() {
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

  const [dupPage, setDupPage] = React.useState(1);
  const hasData = shipments.length > 0;

  const filterSummary = [clientId && "Customer filtered", siteId && "Site filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("data-quality", shipments, filterSummary);
  const total = shipments.length;

  /* ── Quality breakdown metrics ── */
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

  /* ── Overall quality score ── */
  const overallScore = React.useMemo(() => {
    const totalIssues = metrics.reduce((sum, m) => sum + m.count, 0);
    const totalChecks = metrics.length * total;
    if (totalChecks === 0) return 100;
    return Math.round((1 - totalIssues / totalChecks) * 100);
  }, [metrics, total]);

  /* ── Fields complete / missing ── */
  const fieldsComplete = React.useMemo(
    () => metrics.reduce((sum, m) => sum + (m.total - m.count), 0),
    [metrics]
  );
  const fieldsMissing = React.useMemo(
    () => metrics.reduce((sum, m) => sum + m.count, 0),
    [metrics]
  );

  /* ── Profile coverage donut ── */
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

  /* ── Manifest return lag histogram ── */
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
      if (diffDays < 0) continue;
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
    "var(--color-success-400)",
    "var(--color-success-400)",
    "var(--color-warning-400)",
    "var(--color-error-400)",
    "var(--color-error-600)",
  ];

  /* ── Duplicate manifests ── */
  const duplicateManifests: DuplicateManifestRow[] = React.useMemo(() => {
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

  /* ── Container fill rate ── */
  const fillRateData = React.useMemo(() => {
    const byContainer = new Map<string, { totalRate: number; count: number }>();

    for (const s of shipments) {
      const cType = s.containerType ?? "Unknown";
      if (!s.targetLoadWeight || s.targetLoadWeight === 0) continue;
      const fillRate = Math.min((s.weightValue / s.targetLoadWeight) * 100, 150);
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
    if (pct >= 80) return "var(--color-success-400)";
    if (pct >= 60) return "var(--color-warning-400)";
    return "var(--color-error-400)";
  }

  /* ── Duplicate manifest table columns ── */
  const dupColumns: ColumnDef<DuplicateManifestRow, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "manifest",
        header: "Manifest #",
        cell: ({ getValue }) => (
          <span className="font-mono text-text-primary">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "occurrences",
        header: "Occurrences",
        meta: { align: "center" },
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <Badge variant={val >= 3 ? "error" : "warning"}>
              {val}x
            </Badge>
          );
        },
      },
      {
        accessorKey: "dateRange",
        header: "Date Range",
        cell: ({ row }) => {
          const d = row.original;
          return (
            <span className="text-text-muted">
              {d.dateRange}
              {d.daySpan > 30 && (
                <span className="ml-1 text-error-600 text-xs font-medium">
                  ({d.daySpan}d span)
                </span>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "sites",
        header: "Sites",
        cell: ({ getValue }) => (
          <span className="text-text-muted truncate max-w-[200px] block">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "wasteTypes",
        header: "Waste Types",
        cell: ({ getValue }) => (
          <span className="text-text-muted truncate max-w-[200px] block">
            {getValue() as string}
          </span>
        ),
      },
    ],
    []
  );

  /* ── CSV export ── */
  const handleExport = () => {
    const headers = [
      "Metric",
      "Issues",
      "Total",
      "Issue Rate %",
      "Status",
    ];
    const rows = metrics.map((m) => {
      const pct = total > 0 ? Math.round((m.count / m.total) * 100) : 0;
      return [
        m.label,
        String(m.count),
        String(m.total),
        String(pct),
        getVariantLabel(getVariantForPct(pct)),
      ];
    });
    rows.push(["Overall Score", String(overallScore), "100", String(overallScore), ""]);
    rows.push(["Fields Complete", String(fieldsComplete), "", "", ""]);
    rows.push(["Fields Missing", String(fieldsMissing), "", "", ""]);
    rows.push(["Duplicate Manifests", String(duplicateManifests.length), "", "", ""]);
    downloadCsv("Data_Quality_Report.csv", headers, rows);
  };

  /* ── Reset page on filter change ── */
  React.useEffect(() => {
    setDupPage(1);
  }, [shipments]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Overall Score"
            value={`${overallScore}%`}
            subtitle="All checks"
            icon={ShieldCheck}
            variant={overallScore >= 90 ? "success" : overallScore >= 70 ? "warning" : "error"}
          />
          <KpiCard
            title="Fields Missing"
            value={fieldsMissing.toLocaleString()}
            subtitle="Needs attention"
            icon={XCircle}
            variant="error"
          />
          <KpiCard
            title="Duplicate Manifests"
            value={duplicateManifests.length.toLocaleString()}
            subtitle="Potential duplicates"
            icon={AlertTriangle}
            variant="warning"
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
      onExport={handleExport}
      exportDisabled={!hasData}
      onExportPdf={handleExportPdf}
      isPdfExporting={isPdfExporting}
      onResetFilters={resetFilters}
      hasFilters={hasFilters}
    >
      {hasData ? (
        <PillTabs defaultValue="breakdown">
          <PillTabsList>
            <PillTabsTrigger value="breakdown">Quality Breakdown</PillTabsTrigger>
            <PillTabsTrigger value="coverage">Coverage</PillTabsTrigger>
            <PillTabsTrigger value="issues" count={duplicateManifests.length}>
              Issues
            </PillTabsTrigger>
          </PillTabsList>

          {/* ── Tab 1: Quality Breakdown ── */}
          <PillTabsContent value="breakdown" className="space-y-4">
              <Card>
                {/* Header with inline gauge */}
                <div className="flex items-center gap-3 border-b border-border-default pb-3">
                  <QualityGauge score={overallScore} />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Data Quality Breakdown</p>
                    <p className="text-xs text-text-muted mt-0.5">{fieldsComplete.toLocaleString()} fields passed · {fieldsMissing.toLocaleString()} issues across {total.toLocaleString()} shipments</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-border-default">
                        <th className="pb-2 pr-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Check</th>
                        <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Issues</th>
                        <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Total</th>
                        <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Rate</th>
                        <th className="pb-2 px-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Coverage</th>
                        <th className="pb-2 pl-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m) => {
                        const pct = total > 0 ? Math.round((m.count / m.total) * 100) : 0;
                        const variant = getVariantForPct(pct);
                        const coveragePct = 100 - pct;
                        return (
                          <tr key={m.label} className="border-b border-border-default last:border-0 hover:bg-surface-secondary/50 transition-colors">
                            <td className="py-2.5 pr-3 font-medium text-text-primary">{m.label}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">{m.count.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-muted">{m.total.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">{pct}%</td>
                            <td className="py-2.5 px-3 w-32">
                              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${coveragePct}%`,
                                    backgroundColor: variant === "success" ? "var(--color-success-400)" : variant === "warning" ? "var(--color-warning-400)" : "var(--color-error-400)",
                                  }}
                                />
                              </div>
                            </td>
                            <td className="py-2.5 pl-3">
                              <Badge variant={variant}>{getVariantLabel(variant)}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
          </PillTabsContent>

          {/* ── Tab 2: Coverage ── */}
          <PillTabsContent value="coverage" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Profile Coverage Donut */}
              <ChartContainer
                title="Profile Coverage"
                subtitle="Shipments with vs without waste profile assignment"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[280px]"
              >
                {profileData.length > 0 ? (
                  <DonutChart
                    data={profileData}
                    colors={PROFILE_COLORS}
                    valueFormatter={(v) => `${v.toLocaleString()} shipments`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-text-muted">
                    No profile data available
                  </div>
                )}
              </ChartContainer>

              {/* Manifest Return Lag Histogram */}
              <ChartContainer
                title="Manifest Return Lag"
                subtitle="Days between shipment date and manifest return"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[280px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lagHistogram} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      allowDecimals={false}
                      width={30}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
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
          </PillTabsContent>

          {/* ── Tab 3: Issues ── */}
          <PillTabsContent value="issues" className="space-y-4">
            {/* Duplicate Manifests Table */}
            <div ref={tableRef}>
            <DataTable
              columns={dupColumns}
              data={duplicateManifests.slice(
                (dupPage - 1) * pageSize,
                dupPage * pageSize
              )}
              pagination={{
                page: dupPage,
                pageSize: pageSize,
                total: duplicateManifests.length,
              }}
              onPaginationChange={setDupPage}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-success-500" />
                  <p className="text-sm font-medium">No duplicate manifests detected</p>
                  <p className="text-xs mt-1">All manifest numbers are unique across shipments</p>
                </div>
              }
            />
            </div>

            {/* Container Fill Rate Chart */}
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
                    margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-default)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 120]}
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v}%`}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      width={100}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
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
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<ShieldCheck className="h-10 w-10" />}
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
