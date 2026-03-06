"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { ChartContainer, CATEGORY_COLORS, TOOLTIP_STYLE, ParetoChart } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAllShipments, getClients, getSites } from "@/lib/mock-data";
import { getMonthKey, formatMonthLabel, downloadCsv } from "@/lib/report-utils";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import type { Shipment } from "@/lib/types";

export default function WasteTrendsPage() {
  const clients = React.useMemo(() => getClients(), []);
  const allSites = React.useMemo(() => getSites(), []);
  const [clientId, setClientId] = React.useState("");
  const [siteId, setSiteId] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("2024-07-01");
  const [dateTo, setDateTo] = React.useState("2025-02-28");
  const [viewMode, setViewMode] = React.useState<"bar" | "stream">("bar");

  const filteredSites = clientId ? allSites.filter((s) => s.clientId === clientId) : allSites;

  const shipments = React.useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (clientId) filters.clientIds = [clientId];
    if (siteId) filters.siteIds = [siteId];
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    return getAllShipments(filters as never);
  }, [clientId, siteId, dateFrom, dateTo]);

  /* Monthly volume trend */
  const monthlyVolume = React.useMemo(() => {
    const byMonth = new Map<string, number>();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      byMonth.set(key, (byMonth.get(key) ?? 0) + s.weightValue);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, volume]) => ({ month: formatMonthLabel(key), volume: Math.round(volume) }));
  }, [shipments]);

  /* Waste type stacked bar by month */
  const wasteTypeMonthly = React.useMemo(() => {
    const types = new Set<string>();
    const byMonth = new Map<string, Map<string, number>>();
    shipments.forEach((s) => {
      const month = getMonthKey(s.shipmentDate);
      types.add(s.wasteCategory ?? "Non Haz");
      if (!byMonth.has(month)) byMonth.set(month, new Map());
      const monthMap = byMonth.get(month)!;
      const cat = s.wasteCategory ?? "Non Haz";
      monthMap.set(cat, (monthMap.get(cat) ?? 0) + s.weightValue);
    });
    const typeArr = Array.from(types);
    return {
      types: typeArr,
      data: Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, map]) => {
          const row: Record<string, string | number> = { month: formatMonthLabel(key) };
          typeArr.forEach((t) => { row[t] = Math.round(map.get(t) ?? 0); });
          return row;
        }),
    };
  }, [shipments]);

  /* Treatment method pie */
  const treatmentData = React.useMemo(() => {
    const byMethod = new Map<string, number>();
    shipments.forEach((s) => {
      const m = s.treatmentMethod ?? "Unknown";
      byMethod.set(m, (byMethod.get(m) ?? 0) + s.weightValue);
    });
    return Array.from(byMethod.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [shipments]);

  /* Top waste streams table */
  const topStreams = React.useMemo(() => {
    const byType = new Map<string, { volume: number; shipments: number }>();
    shipments.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? { volume: 0, shipments: 0 };
      existing.volume += s.weightValue;
      existing.shipments += 1;
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  }, [shipments]);

  const handleExport = () => {
    const headers = ["Waste Stream", "Volume (lbs)", "Shipments"];
    const rows = topStreams.map((s) => [s.name, String(s.volume), String(s.shipments)]);
    downloadCsv("Waste_Trends_Report.csv", headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader title="Waste Trends" subtitle="Volume analysis and waste stream breakdown" />
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
        <DatePicker
          value={dateFrom ? new Date(dateFrom + "T00:00:00") : undefined}
          onChange={(date) => setDateFrom(date ? format(date, "yyyy-MM-dd") : "")}
          placeholder="From date"
        />
        <DatePicker
          value={dateTo ? new Date(dateTo + "T00:00:00") : undefined}
          onChange={(date) => setDateTo(date ? format(date, "yyyy-MM-dd") : "")}
          placeholder="To date"
        />
      </div>

      {/* Volume Trend */}
      <ChartContainer title="Volume Over Time" subtitle="Monthly waste volume in lbs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyVolume} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toLocaleString()} lbs`, "Volume"]} />
            <Area type="monotone" dataKey="volume" stroke={CATEGORY_COLORS[0]} fill={CATEGORY_COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Waste Type Breakdown + Treatment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="Waste Category Breakdown"
          subtitle={viewMode === "bar" ? "Stacked volume by type per month" : "Streamgraph — centered volume distribution"}
          action={
            <div className="flex gap-1">
              <Button
                variant={viewMode === "bar" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("bar")}
              >
                Stacked Bar
              </Button>
              <Button
                variant={viewMode === "stream" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("stream")}
              >
                Streamgraph
              </Button>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "bar" ? (
              <BarChart data={wasteTypeMonthly.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {wasteTypeMonthly.types.map((t, idx) => (
                  <Bar key={t} dataKey={t} stackId="a" fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                ))}
              </BarChart>
            ) : (
              <AreaChart data={wasteTypeMonthly.data} stackOffset="silhouette" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {wasteTypeMonthly.types.map((t, idx) => (
                  <Area
                    key={t}
                    type="monotone"
                    dataKey={t}
                    stackId="1"
                    stroke={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                    fillOpacity={0.7}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Treatment Method Distribution" subtitle="Volume by disposal method">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={treatmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={{ stroke: "var(--color-text-muted)" }} style={{ fontSize: 11 }}>
                {treatmentData.map((_, idx) => <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toLocaleString()} lbs`, ""]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Pareto Analysis */}
      <ChartContainer title="Top Waste Streams — Pareto Analysis" subtitle="Volume by stream with cumulative percentage">
        <ParetoChart
          data={topStreams.map((s) => ({ name: s.name, value: Math.round(s.volume) }))}
          valueFormatter={(v) => `${v.toLocaleString()} lbs`}
        />
      </ChartContainer>

      {/* Top Waste Streams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Waste Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left">
                  <th className="pb-2 font-medium text-text-muted">Waste Stream</th>
                  <th className="pb-2 font-medium text-text-muted text-right">Volume (lbs)</th>
                  <th className="pb-2 font-medium text-text-muted text-right">Shipments</th>
                  <th className="pb-2 font-medium text-text-muted text-right">Avg per Shipment</th>
                </tr>
              </thead>
              <tbody>
                {topStreams.map((s) => (
                  <tr key={s.name} className="border-b border-border-default last:border-0">
                    <td className="py-2.5 text-text-primary">{s.name}</td>
                    <td className="py-2.5 text-text-primary text-right">{s.volume.toLocaleString()}</td>
                    <td className="py-2.5 text-text-primary text-right">{s.shipments}</td>
                    <td className="py-2.5 text-text-primary text-right">{Math.round(s.volume / s.shipments).toLocaleString()}</td>
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
