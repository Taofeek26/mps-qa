"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { Leaf, RotateCcw, Factory, Recycle, Truck, AlertCircle, Star, Weight, Clock as ClockIcon, DollarSign } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
} from "@/components/charts";
import { getMonthKey, formatMonthLabel, downloadCsv } from "@/lib/report-utils";
import {
  getContainerWeightRecords,
  ROUTE_PROGRESS_DATA,
  YARD_TURNAROUND_DATA,
  SERVICE_AGREEMENT_RATES,
} from "@/lib/mock-kpi-data";
import { ProgressList } from "@/components/charts";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";

/* ─── GHG Factors (t CO₂e per ton) matching HTML reference ─── */

const GHG_FACTORS: Record<string, number> = {
  "Hazardous Waste": 2.85,
  "Non Haz": 0.52,
  Recycling: -0.84,
  Universal: 1.43,
  Medical: 2.0,
};

function getGhgFactor(category: string | undefined): number {
  if (!category) return GHG_FACTORS["Non Haz"];
  return GHG_FACTORS[category] ?? GHG_FACTORS["Non Haz"];
}

/* EPA Class 8 truck factor: 161.8 g CO₂ per ton-mile */
const SCOPE3_FACTOR_G = 161.8;

export function EmissionsContent() {
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

  const hasData = shipments.length > 0;

  const filterSummary = [clientId && "Customer filtered", siteId && "Site filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("emissions", shipments, filterSummary);

  /* ─── GHG by Waste Category ─── */

  const ghgByCategory = React.useMemo(() => {
    const byCategory = new Map<string, { qty: number; co2: number }>();
    shipments.forEach((s) => {
      const cat = s.wasteCategory ?? "Non Haz";
      const tons = s.weightValue / 2000;
      const factor = getGhgFactor(cat);
      const existing = byCategory.get(cat) ?? { qty: 0, co2: 0 };
      existing.qty += tons;
      existing.co2 += tons * factor;
      byCategory.set(cat, existing);
    });
    return Array.from(byCategory.entries()).map(([name, d]) => ({
      name,
      qty: Math.round(d.qty * 10) / 10,
      factor: getGhgFactor(name),
      co2: Math.round(d.co2 * 10) / 10,
    }));
  }, [shipments]);

  /* ─── KPIs ─── */

  const kpis = React.useMemo(() => {
    const totalGHG = ghgByCategory.reduce((sum, d) => sum + d.co2, 0);
    const recyclingOffset = Math.abs(
      ghgByCategory.find((d) => d.name === "Recycling")?.co2 ?? 0
    );
    const totalTons = ghgByCategory.reduce((sum, d) => sum + d.qty, 0);

    // Diversion: non-landfill tons / total tons
    let landfillTons = 0;
    shipments.forEach((s) => {
      if (s.treatmentMethod === "Landfill") landfillTons += s.weightValue / 2000;
    });
    const diversionRate = totalTons > 0 ? ((totalTons - landfillTons) / totalTons) * 100 : 0;

    // Scope 3: tons × miles × 161.8g / 1e6 → t CO₂
    let scope3 = 0;
    shipments.forEach((s) => {
      const tons = s.weightValue / 2000;
      const miles = s.milesFromFacility ?? 0;
      scope3 += (tons * miles * SCOPE3_FACTOR_G) / 1e6;
    });

    return { totalGHG, recyclingOffset, diversionRate, scope3 };
  }, [shipments, ghgByCategory]);

  /* ─── Monthly data for Diversion Rate + Scope 3 ─── */

  const monthlyData = React.useMemo(() => {
    const byMonth = new Map<string, { tons: number; landfill: number; scope3: number }>();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) ?? { tons: 0, landfill: 0, scope3: 0 };
      const tons = s.weightValue / 2000;
      existing.tons += tons;
      if (s.treatmentMethod === "Landfill") existing.landfill += tons;
      existing.scope3 += (tons * (s.milesFromFacility ?? 0) * SCOPE3_FACTOR_G) / 1e6;
      byMonth.set(key, existing);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => ({
        month: formatMonthLabel(key),
        diversion: d.tons > 0 ? Math.round(((d.tons - d.landfill) / d.tons) * 1000) / 10 : 0,
        scope3: Math.round(d.scope3 * 10) / 10,
      }));
  }, [shipments]);

  /* ─── New ESG KPIs ─── */

  /* Contamination Rate: % of recycling shipments flagged (simulated based on waste codes presence) */
  const contaminationRate = React.useMemo(() => {
    const recyclingShipments = shipments.filter(
      (s) => s.wasteCategory === "Recycling" || s.treatmentMethod === "Recycling"
    );
    if (recyclingShipments.length === 0) return 0;
    const contaminated = recyclingShipments.filter((s) => !s.wasteCodes || s.wasteCodes.includes("D")).length;
    return Math.round((contaminated / recyclingShipments.length) * 100);
  }, [shipments]);

  /* Recycling Participation: % of sites with at least 1 recycling shipment */
  const recyclingParticipation = React.useMemo(() => {
    const allSiteIds = new Set(shipments.map((s) => s.siteId));
    const recyclingSiteIds = new Set(
      shipments
        .filter((s) => s.wasteCategory === "Recycling" || s.treatmentMethod === "Recycling")
        .map((s) => s.siteId)
    );
    return allSiteIds.size > 0 ? Math.round((recyclingSiteIds.size / allSiteIds.size) * 100) : 0;
  }, [shipments]);

  /* Container Weight Records */
  const containerWeights = React.useMemo(() => getContainerWeightRecords(), []);
  const totalDeductionWeight = React.useMemo(
    () => containerWeights.reduce((sum, cw) => sum + cw.tareWeightLbs, 0),
    [containerWeights]
  );
  const avgTareDelta = React.useMemo(() => {
    if (containerWeights.length === 0) return 0;
    const totalDelta = containerWeights.reduce((sum, cw) => sum + (cw.grossWeightLbs - cw.tareWeightLbs), 0);
    return Math.round(totalDelta / containerWeights.length);
  }, [containerWeights]);

  /* Tare vs Gross by container type */
  const tareByType = React.useMemo(() => {
    const byType = new Map<string, { tare: number; gross: number; count: number }>();
    containerWeights.forEach((cw) => {
      const existing = byType.get(cw.containerType) ?? { tare: 0, gross: 0, count: 0 };
      existing.tare += cw.tareWeightLbs;
      existing.gross += cw.grossWeightLbs;
      existing.count++;
      byType.set(cw.containerType, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name,
        avgTare: Math.round(d.tare / d.count),
        avgGross: Math.round(d.gross / d.count),
        avgNet: Math.round((d.gross - d.tare) / d.count),
      }))
      .sort((a, b) => b.avgNet - a.avgNet);
  }, [containerWeights]);

  /* Route Progress */
  const routeProgress = ROUTE_PROGRESS_DATA;
  const avgRouteCompletion = React.useMemo(() => {
    if (routeProgress.length === 0) return 0;
    const total = routeProgress.reduce((s, r) => s + r.completedStops / r.totalStops, 0);
    return Math.round((total / routeProgress.length) * 100);
  }, [routeProgress]);

  /* Asset Utilization */
  const activeContainers = React.useMemo(() => {
    // Active = containers placed but not yet removed
    const total = 80; // from mock data
    const active = Math.round(total * 0.88);
    return { total, active, pct: Math.round((active / total) * 100) };
  }, []);

  /* Yard Turnaround */
  const yardData = YARD_TURNAROUND_DATA;
  const avgYardTurnaround = React.useMemo(() => {
    if (yardData.length === 0) return 0;
    return Math.round(yardData.reduce((s, d) => s + d.turnaroundMinutes, 0) / yardData.length);
  }, [yardData]);

  /* Service Agreement Rates */
  const agreements = SERVICE_AGREEMENT_RATES;

  /* ─── CSV export ─── */

  const handleExport = () => {
    const headers = ["Category", "Quantity (t)", "Factor", "CO₂e (t)", "Impact"];
    const rows = ghgByCategory.map((d) => [
      d.name, String(d.qty), String(d.factor), String(d.co2),
      d.co2 < 0 ? "Carbon offset" : "Emission source",
    ]);
    downloadCsv("GHG_Sustainability_Report.csv", headers, rows);
  };

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Total GHG"
            value={`${Math.round(kpis.totalGHG).toLocaleString()} t CO₂e`}
            subtitle="Net emissions"
            icon={Factory}
            variant="error"
          />
          <KpiCard
            title="Diversion Rate"
            value={`${kpis.diversionRate.toFixed(1)}%`}
            subtitle="Non-landfill"
            icon={Recycle}
            variant="success"
          />
          <KpiCard
            title="Contamination"
            value={`${contaminationRate}%`}
            subtitle="Recycling streams"
            icon={AlertCircle}
            variant={contaminationRate < 15 ? "success" : "warning"}
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
        <PillTabs defaultValue="overview">
          <PillTabsList>
            <PillTabsTrigger value="overview">Overview</PillTabsTrigger>
            <PillTabsTrigger value="trends">Diversion & Scope 3</PillTabsTrigger>
            <PillTabsTrigger value="breakdown">Breakdown Table</PillTabsTrigger>
            <PillTabsTrigger value="material">Material & Assets</PillTabsTrigger>
          </PillTabsList>

          {/* Tab 1: GHG by Category bar + Emissions Intensity */}
          <PillTabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="GHG Emissions by Waste Category"
                subtitle="Emission factors: Haz=2.85, Non-Haz=0.52, Recycling=-0.84, Universal=1.43 t CO₂e/ton"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ghgByCategory}
                    margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v}t`}
                      width={40}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [`${Number(value).toLocaleString()} t CO₂e`, ""]}
                    />
                    <Bar dataKey="co2" name="t CO₂e" radius={[4, 4, 0, 0]}>
                      {ghgByCategory.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.co2 < 0 ? "var(--color-teal-400)" : "var(--color-error-500)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer
                title="Landfill Diversion Rate — Monthly"
                subtitle="Non-landfill tons ÷ total tons × 100"
                chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyData}
                    margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                      width={35}
                      axisLine={{ stroke: "var(--color-border-default)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value) => [`${value}%`, "Diversion"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="diversion"
                      name="Diversion %"
                      stroke="var(--color-teal-400)"
                      fill="rgba(0,179,140,.08)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </PillTabsContent>

          {/* Tab 2: Scope 3 Logistics Proxy */}
          <PillTabsContent value="trends" className="space-y-4">
            <ChartContainer
              title="Scope 3 Logistics Proxy"
              subtitle="Tons × Miles × 161.8 g CO₂/ton-mile (EPA Class 8 truck)"
              chartClassName="h-[220px] sm:h-[260px] lg:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    tickFormatter={(v) => `${v}t`}
                    width={35}
                    axisLine={{ stroke: "var(--color-border-default)" }}
                    tickLine={false}
                  />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(value) => [`${value} t CO₂`, "Scope 3"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="scope3"
                    name="Scope 3 (t CO₂)"
                    stroke="var(--color-primary-600)"
                    fill="color-mix(in srgb, var(--color-primary-600) 8%, transparent)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </PillTabsContent>

          {/* Tab 3: GHG Breakdown Table */}
          <PillTabsContent value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle>GHG Breakdown by Waste Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-default">
                        <th className="pb-2 pr-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Category</th>
                        <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Quantity (t)</th>
                        <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Factor</th>
                        <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">CO₂e (t)</th>
                        <th className="pb-2 pl-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ghgByCategory.map((row) => (
                        <tr key={row.name} className="border-b border-border-default last:border-0">
                          <td className="py-2.5 pr-3 font-semibold text-text-primary">{row.name}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">{row.qty.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">{row.factor}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-mono font-semibold" style={{ color: row.co2 < 0 ? "var(--color-teal-400)" : "var(--color-error-500)" }}>
                            {row.co2.toLocaleString()}
                          </td>
                          <td className="py-2.5 pl-3">
                            <Badge variant={row.co2 < 0 ? "success" : "error"}>
                              {row.co2 < 0 ? "Carbon offset" : "Emission source"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </PillTabsContent>
          {/* Material & Assets */}
          <PillTabsContent value="material" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard
                title="Deduction Weight"
                value={`${(totalDeductionWeight / 1000).toFixed(0)}k lbs`}
                subtitle="Container tare total"
                icon={Weight}
              />
              <KpiCard
                title="Avg Net Weight"
                value={`${avgTareDelta.toLocaleString()} lbs`}
                subtitle="Gross − Tare"
                icon={Weight}
              />
              <KpiCard
                title="Asset Utilization"
                value={`${activeContainers.pct}%`}
                subtitle={`${activeContainers.active}/${activeContainers.total} active`}
                icon={Recycle}
                variant="success"
              />
              <KpiCard
                title="Yard Turnaround"
                value={`${avgYardTurnaround} min`}
                subtitle="Avg facility time"
                icon={ClockIcon}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tare vs Gross by Container Type */}
              <ChartContainer
                title="Tare vs Gross Weight by Container"
                subtitle="Average weights by container type"
                chartClassName="h-[280px] lg:h-[320px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tareByType} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toLocaleString()} lbs`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="avgTare" name="Tare (lbs)" fill={CATEGORY_COLORS[5]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgNet" name="Net (lbs)" fill={CATEGORY_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Route Progress */}
              <ChartContainer
                title="Route Progress"
                subtitle={`${avgRouteCompletion}% avg completion across ${routeProgress.length} routes`}
                chartClassName="h-[280px] lg:h-[320px] overflow-y-auto"
              >
                <div className="space-y-2 px-1">
                  {routeProgress.map((r) => {
                    const pct = Math.round((r.completedStops / r.totalStops) * 100);
                    return (
                      <div key={r.routeId} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-primary font-medium">{r.siteName}</span>
                          <span className="text-text-muted">{r.completedStops}/{r.totalStops} stops ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? "var(--color-success-400)" : pct >= 60 ? "var(--color-warning-400)" : "var(--color-error-400)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChartContainer>
            </div>

            {/* Service Agreement Haul Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Service Agreement Haul Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-default">
                        <th className="pb-2 pr-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Client</th>
                        <th className="pb-2 px-3 text-left font-semibold text-text-muted text-xs uppercase tracking-wider">Transporter</th>
                        <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Contracted</th>
                        <th className="pb-2 px-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Actual Avg</th>
                        <th className="pb-2 pl-3 text-right font-semibold text-text-muted text-xs uppercase tracking-wider">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agreements.map((a, idx) => {
                        const variance = ((a.actualAvgRate - a.contractedHaulRate) / a.contractedHaulRate) * 100;
                        return (
                          <tr key={idx} className="border-b border-border-default last:border-0">
                            <td className="py-2.5 pr-3 font-medium text-text-primary">{a.clientName}</td>
                            <td className="py-2.5 px-3 text-text-secondary">{a.transporterName}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">${a.contractedHaulRate.toFixed(0)}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-mono text-text-secondary">${a.actualAvgRate.toFixed(0)}</td>
                            <td className="py-2.5 pl-3 text-right tabular-nums font-mono font-semibold" style={{ color: variance > 0 ? "var(--color-error-500)" : "var(--color-success-500)" }}>
                              {variance > 0 ? "+" : ""}{variance.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </PillTabsContent>
        </PillTabs>
      ) : (
        <Card variant="subtle" className="py-0">
          <EmptyState
            icon={<Factory className="h-10 w-10" />}
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
