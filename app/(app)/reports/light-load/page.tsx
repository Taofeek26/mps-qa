"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { StatRow } from "@/components/ui/stat-row";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartContainer, CATEGORY_COLORS, TOOLTIP_STYLE, ScatterQuadrant } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAllShipments, getClients, getSites } from "@/lib/mock-data";
import { loadEfficiency, totalMpsCost, downloadCsv } from "@/lib/report-utils";
import { Scale, AlertTriangle, DollarSign, TrendingDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Shipment } from "@/lib/types";

const THRESHOLD = 80; // % — shipments below this are "light loads"

export default function LightLoadPage() {
  const clients = React.useMemo(() => getClients(), []);
  const allSites = React.useMemo(() => getSites(), []);
  const [clientId, setClientId] = React.useState("");
  const [siteId, setSiteId] = React.useState("");

  const filteredSites = clientId ? allSites.filter((s) => s.clientId === clientId) : allSites;

  const shipments = React.useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (clientId) filters.clientIds = [clientId];
    if (siteId) filters.siteIds = [siteId];
    return getAllShipments(filters as never);
  }, [clientId, siteId]);

  /* Compute efficiency for shipments that have target load data */
  const shipmentsWithEfficiency = React.useMemo(() => {
    return shipments
      .map((s) => ({
        ...s,
        efficiency: loadEfficiency(s),
      }))
      .filter((s): s is typeof s & { efficiency: number } => s.efficiency !== null);
  }, [shipments]);

  const lightLoads = shipmentsWithEfficiency.filter((s) => s.efficiency < THRESHOLD);
  const totalAnalyzed = shipmentsWithEfficiency.length;
  const lightLoadCount = lightLoads.length;
  const lightLoadPct = totalAnalyzed > 0 ? Math.round((lightLoadCount / totalAnalyzed) * 100) : 0;
  const avgEfficiency = totalAnalyzed > 0
    ? Math.round(shipmentsWithEfficiency.reduce((sum, s) => sum + s.efficiency, 0) / totalAnalyzed)
    : 0;

  /* Potential savings: if light loads were at 80%, how much haul cost saved? */
  const potentialSavings = React.useMemo(() => {
    let savings = 0;
    lightLoads.forEach((s) => {
      const haulCost = s.mpsCost?.haulCharge ?? 0;
      if (haulCost > 0 && s.efficiency > 0) {
        // If we could consolidate to reach threshold, we'd need fewer trips
        const currentTrips = 1;
        const consolidatedTrips = s.efficiency / THRESHOLD;
        savings += haulCost * (currentTrips - consolidatedTrips);
      }
    });
    return Math.round(savings);
  }, [lightLoads]);

  /* Efficiency distribution histogram */
  const histogram = React.useMemo(() => {
    const buckets: Record<string, number> = {
      "0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0, "100%+": 0,
    };
    shipmentsWithEfficiency.forEach((s) => {
      if (s.efficiency < 20) buckets["0-20%"]++;
      else if (s.efficiency < 40) buckets["20-40%"]++;
      else if (s.efficiency < 60) buckets["40-60%"]++;
      else if (s.efficiency < 80) buckets["60-80%"]++;
      else if (s.efficiency <= 100) buckets["80-100%"]++;
      else buckets["100%+"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [shipmentsWithEfficiency]);

  /* Worst offenders by waste stream */
  const worstByStream = React.useMemo(() => {
    const byType = new Map<string, { count: number; avgEff: number; totalEff: number }>();
    lightLoads.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? { count: 0, avgEff: 0, totalEff: 0 };
      existing.count++;
      existing.totalEff += s.efficiency;
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({ name, count: d.count, avgEfficiency: Math.round(d.totalEff / d.count) }))
      .sort((a, b) => a.avgEfficiency - b.avgEfficiency)
      .slice(0, 8);
  }, [lightLoads]);

  const scatterData = React.useMemo(() => {
    return shipmentsWithEfficiency.map((s) => ({
      x: s.standardizedVolumeLbs ?? s.weightValue,
      y: s.targetLoadWeight ?? 0,
      label: `${s.siteName} - ${s.wasteTypeName}`,
      category: s.wasteCategory ?? "Non Haz",
    }));
  }, [shipmentsWithEfficiency]);

  const handleExport = () => {
    const headers = ["Date", "Site", "Waste Type", "Actual (lbs)", "Target (lbs)", "Efficiency %", "Container", "Vendor"];
    const rows = lightLoads
      .sort((a, b) => a.efficiency - b.efficiency)
      .map((s) => [
        s.shipmentDate,
        s.siteName,
        s.wasteTypeName,
        String(s.standardizedVolumeLbs ?? s.weightValue),
        String(s.targetLoadWeight ?? ""),
        `${s.efficiency}%`,
        s.containerType ?? "",
        s.vendorName,
      ]);
    downloadCsv("Light_Load_Report.csv", headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader title="Light Load Report" subtitle={`Shipments below ${THRESHOLD}% load capacity`} />
        <Button onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={clientId || "all"} onValueChange={(val) => { setClientId(val === "all" ? "" : val); setSiteId(""); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={siteId || "all"} onValueChange={(val) => setSiteId(val === "all" ? "" : val)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {filteredSites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <StatRow>
        <KpiCard title="Light Loads" value={lightLoadCount} icon={AlertTriangle} variant="warning" />
        <KpiCard title="Light Load %" value={`${lightLoadPct}%`} icon={Scale} variant={lightLoadPct > 30 ? "error" : "warning"} />
        <KpiCard title="Avg Efficiency" value={`${avgEfficiency}%`} icon={TrendingDown} variant={avgEfficiency < 70 ? "error" : "success"} />
        <KpiCard title="Potential Savings" value={`$${potentialSavings.toLocaleString()}`} icon={DollarSign} variant="success" />
      </StatRow>

      {/* Scatter Plot — Actual vs Target Weight */}
      <ChartContainer title="Load Efficiency Scatter" subtitle="Actual weight vs target — points below diagonal are underfilled" height={350}>
        <ScatterQuadrant
          data={scatterData}
          xLabel="Actual Weight (lbs)"
          yLabel="Target Weight (lbs)"
          showDiagonal={true}
          categoryColors={{
            "Non Haz": "#1863DC",
            "Hazardous Waste": "#EF4444",
            "Recycling": "#00B38C",
            "Medical": "#F59E0B",
          }}
          xFormatter={(v) => `${v.toLocaleString()} lbs`}
          yFormatter={(v) => `${v.toLocaleString()} lbs`}
        />
      </ChartContainer>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer title="Load Efficiency Distribution" subtitle="Number of shipments by efficiency range">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <ReferenceLine x="80-100%" stroke={CATEGORY_COLORS[1]} strokeDasharray="3 3" label={{ value: "Target", fontSize: 10, fill: "var(--color-text-muted)" }} />
              <Bar dataKey="count" name="Shipments" fill={CATEGORY_COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Worst Offenders by Waste Stream" subtitle="Waste types with lowest avg load efficiency">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={worstByStream} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} width={115} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value}%`, "Avg Efficiency"]} />
              <ReferenceLine x={THRESHOLD} stroke={CATEGORY_COLORS[3]} strokeDasharray="3 3" />
              <Bar dataKey="avgEfficiency" name="Avg Efficiency" fill={CATEGORY_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Light Load Table */}
      <Card>
        <CardHeader>
          <CardTitle>Light Load Shipments ({lightLoadCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left">
                  <th className="pb-2 font-medium text-text-muted">Date</th>
                  <th className="pb-2 font-medium text-text-muted">Site</th>
                  <th className="pb-2 font-medium text-text-muted">Waste Type</th>
                  <th className="pb-2 font-medium text-text-muted text-right">Actual (lbs)</th>
                  <th className="pb-2 font-medium text-text-muted text-right">Target (lbs)</th>
                  <th className="pb-2 font-medium text-text-muted text-right">Efficiency</th>
                  <th className="pb-2 font-medium text-text-muted">Container</th>
                </tr>
              </thead>
              <tbody>
                {lightLoads
                  .sort((a, b) => a.efficiency - b.efficiency)
                  .slice(0, 20)
                  .map((s) => (
                    <tr key={s.id} className="border-b border-border-default last:border-0">
                      <td className="py-2.5 text-text-primary">{new Date(s.shipmentDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="py-2.5 text-text-primary">{s.siteName}</td>
                      <td className="py-2.5 text-text-primary">{s.wasteTypeName}</td>
                      <td className="py-2.5 text-text-primary text-right">{(s.standardizedVolumeLbs ?? s.weightValue).toLocaleString()}</td>
                      <td className="py-2.5 text-text-primary text-right">{(s.targetLoadWeight ?? 0).toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <Badge variant={s.efficiency < 50 ? "error" : "warning"}>
                          {s.efficiency}%
                        </Badge>
                      </td>
                      <td className="py-2.5 text-text-muted text-xs">{s.containerType}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {lightLoads.length > 20 && (
              <p className="text-xs text-text-muted mt-2 text-center">Showing 20 of {lightLoads.length} light loads</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
