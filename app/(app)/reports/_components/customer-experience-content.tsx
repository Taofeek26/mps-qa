"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  Heart,
  ThumbsUp,
  Clock,
  MessageCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { useCustomerSurveys } from "@/lib/hooks/use-api-data";
import { getMonthKey, formatMonthLabel } from "@/lib/report-utils";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";

export function CustomerExperienceContent() {
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

  const { customerSurveys: allSurveys } = useCustomerSurveys();

  const filterSummary =
    [clientId && "Customer filtered", dateRange?.from && "Date range applied"]
      .filter(Boolean)
      .join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport(
    "customer-experience",
    shipments,
    filterSummary
  );

  /* ─── Survey Data ─── */
  const surveys = React.useMemo(() => {
    let filtered = allSurveys;
    if (clientId) filtered = filtered.filter((s) => s.clientId === clientId);
    if (dateRange?.from) {
      const from = dateRange.from.toISOString().slice(0, 10);
      filtered = filtered.filter((s) => s.date >= from);
    }
    if (dateRange?.to) {
      const to = dateRange.to.toISOString().slice(0, 10);
      filtered = filtered.filter((s) => s.date <= to);
    }
    return filtered;
  }, [allSurveys, clientId, dateRange]);

  /* ─── KPIs ─── */
  const avgCsat = React.useMemo(() => {
    if (surveys.length === 0) return 0;
    return Math.round((surveys.reduce((s, sv) => s + sv.csat, 0) / surveys.length) * 10) / 10;
  }, [surveys]);

  const nps = React.useMemo(() => {
    if (surveys.length === 0) return 0;
    const promoters = surveys.filter((s) => s.nps >= 9).length;
    const detractors = surveys.filter((s) => s.nps <= 6).length;
    return Math.round(((promoters - detractors) / surveys.length) * 100);
  }, [surveys]);

  const fcrRate = React.useMemo(() => {
    if (surveys.length === 0) return 0;
    return Math.round((surveys.filter((s) => s.fcrResolved).length / surveys.length) * 100);
  }, [surveys]);

  const avgResponseTime = React.useMemo(() => {
    if (surveys.length === 0) return 0;
    return Math.round((surveys.reduce((s, sv) => s + sv.responseTimeHrs, 0) / surveys.length) * 10) / 10;
  }, [surveys]);

  const complaintRate = React.useMemo(() => {
    if (surveys.length === 0) return 0;
    return Math.round((surveys.filter((s) => s.hasComplaint).length / surveys.length) * 1000);
  }, [surveys]);

  /* ─── Monthly CSAT + NPS trend ─── */
  const monthlyTrend = React.useMemo(() => {
    const byMonth = new Map<string, { csat: number; nps: number[]; count: number }>();
    surveys.forEach((sv) => {
      const key = getMonthKey(sv.date);
      const existing = byMonth.get(key) ?? { csat: 0, nps: [], count: 0 };
      existing.csat += sv.csat;
      existing.nps.push(sv.nps);
      existing.count++;
      byMonth.set(key, existing);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => {
        const promoters = d.nps.filter((n) => n >= 9).length;
        const detractors = d.nps.filter((n) => n <= 6).length;
        const npsScore = d.count > 0 ? Math.round(((promoters - detractors) / d.count) * 100) : 0;
        return {
          month: formatMonthLabel(key),
          csat: Math.round((d.csat / d.count) * 10) / 10,
          nps: npsScore,
        };
      });
  }, [surveys]);

  /* ─── CSAT by client ─── */
  const csatByClient = React.useMemo(() => {
    const byClient = new Map<string, { total: number; count: number }>();
    surveys.forEach((sv) => {
      const existing = byClient.get(sv.clientName) ?? { total: 0, count: 0 };
      existing.total += sv.csat;
      existing.count++;
      byClient.set(sv.clientName, existing);
    });
    return Array.from(byClient.entries())
      .map(([name, d]) => ({
        name,
        csat: Math.round((d.total / d.count) * 10) / 10,
        responses: d.count,
      }))
      .sort((a, b) => b.csat - a.csat);
  }, [surveys]);

  /* ─── Response Time Distribution ─── */
  const responseTimeDist = React.useMemo(() => {
    const buckets = [
      { name: "< 1h", min: 0, max: 1, count: 0 },
      { name: "1-4h", min: 1, max: 4, count: 0 },
      { name: "4-8h", min: 4, max: 8, count: 0 },
      { name: "8-24h", min: 8, max: 24, count: 0 },
      { name: "24h+", min: 24, max: Infinity, count: 0 },
    ];
    surveys.forEach((sv) => {
      const bucket = buckets.find((b) => sv.responseTimeHrs >= b.min && sv.responseTimeHrs < b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [surveys]);

  /* ─── Complaint Categories ─── */
  const complaintCategories = React.useMemo(() => {
    const byCategory = new Map<string, number>();
    surveys.forEach((sv) => {
      if (sv.complaintCategory) {
        byCategory.set(sv.complaintCategory, (byCategory.get(sv.complaintCategory) ?? 0) + 1);
      }
    });
    const colors = CATEGORY_COLORS;
    return Array.from(byCategory.entries())
      .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
      .sort((a, b) => b.value - a.value);
  }, [surveys]);

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="CSAT"
            value={`${avgCsat}/5`}
            subtitle="Customer satisfaction"
            icon={Heart}
            variant={avgCsat >= 4 ? "success" : avgCsat >= 3 ? "warning" : "error"}
          />
          <KpiCard
            title="NPS"
            value={nps}
            subtitle="Net promoter score"
            icon={ThumbsUp}
            variant={nps >= 50 ? "success" : nps >= 0 ? "warning" : "error"}
          />
          <KpiCard
            title="FCR"
            value={`${fcrRate}%`}
            subtitle="First contact resolution"
            icon={MessageCircle}
            variant={fcrRate >= 80 ? "success" : "warning"}
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
      <PillTabs defaultValue="satisfaction">
        <PillTabsList>
          <PillTabsTrigger value="satisfaction">Satisfaction</PillTabsTrigger>
          <PillTabsTrigger value="service">Service Quality</PillTabsTrigger>
        </PillTabsList>

        {/* Satisfaction */}
        <PillTabsContent value="satisfaction" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartContainer
              title="CSAT & NPS Trend"
              subtitle="Monthly customer satisfaction and net promoter score"
              chartClassName="h-[260px] lg:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="csat"
                    domain={[0, 5]}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                    width={30}
                    label={{ value: "CSAT", angle: -90, position: "insideLeft", fontSize: 9, fill: "var(--color-text-muted)" }}
                  />
                  <YAxis
                    yAxisId="nps"
                    orientation="right"
                    domain={[-100, 100]}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                    width={35}
                    label={{ value: "NPS", angle: 90, position: "insideRight", fontSize: 9, fill: "var(--color-text-muted)" }}
                  />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    yAxisId="csat"
                    type="monotone"
                    dataKey="csat"
                    name="CSAT (1-5)"
                    stroke={CATEGORY_COLORS[0]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="nps"
                    type="monotone"
                    dataKey="nps"
                    name="NPS (-100 to 100)"
                    stroke={CATEGORY_COLORS[2]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="CSAT by Client"
              subtitle="Average satisfaction rating per customer"
              chartClassName="h-[260px] lg:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={csatByClient} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                    width={25}
                  />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value}/5`, "CSAT"]} />
                  <Bar dataKey="csat" radius={[4, 4, 0, 0]}>
                    {csatByClient.map((d, i) => (
                      <Cell key={i} fill={d.csat >= 4 ? "var(--color-success-400)" : d.csat >= 3 ? "var(--color-warning-400)" : "var(--color-error-400)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </PillTabsContent>

        {/* Service Quality */}
        <PillTabsContent value="service" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartContainer
              title="Response Time Distribution"
              subtitle="How quickly issues are addressed"
              chartClassName="h-[260px] lg:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseTimeDist} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Responses" radius={[4, 4, 0, 0]}>
                    {responseTimeDist.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === 0 ? "var(--color-success-400)"
                            : i === 1 ? "var(--color-success-400)"
                            : i === 2 ? "var(--color-warning-400)"
                            : i === 3 ? "var(--color-error-400)"
                            : "var(--color-error-600)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Complaint Categories"
              subtitle="Breakdown of customer complaints by type"
            >
              {complaintCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={complaintCategories.length * 36 + 30}>
                  <BarChart
                    data={complaintCategories}
                    layout="vertical"
                    margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} width={120} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value} complaints`, "Count"]} />
                    <Bar dataKey="value" name="Complaints" fill="var(--color-error-400)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm text-text-muted">
                  No complaints in period
                </div>
              )}
            </ChartContainer>
          </div>
        </PillTabsContent>
      </PillTabs>
    </ReportContentLayout>
  );
}
