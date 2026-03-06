"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { StatRow } from "@/components/ui/stat-row";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartContainer, CATEGORY_COLORS, TOOLTIP_STYLE, WaterfallChart } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAllShipments, getClients, getSites } from "@/lib/mock-data";
import { getMonthKey, formatMonthLabel, totalMpsCost, totalCustomerCost, downloadCsv } from "@/lib/report-utils";
import { DollarSign, TrendingUp, ArrowDownRight, Percent, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

export default function CostAnalysisPage() {
  const clients = React.useMemo(() => getClients(), []);
  const allSites = React.useMemo(() => getSites(), []);
  const [clientId, setClientId] = React.useState("");
  const [siteId, setSiteId] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("2024-07-01");
  const [dateTo, setDateTo] = React.useState("2025-02-28");

  const filteredSites = clientId ? allSites.filter((s) => s.clientId === clientId) : allSites;

  const shipments = React.useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (clientId) filters.clientIds = [clientId];
    if (siteId) filters.siteIds = [siteId];
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    return getAllShipments(filters as never);
  }, [clientId, siteId, dateFrom, dateTo]);

  /* KPI totals */
  const totals = React.useMemo(() => {
    let mpsCostTotal = 0, custCostTotal = 0, totalRebate = 0, totalVolume = 0;
    shipments.forEach((s) => {
      mpsCostTotal += totalMpsCost(s);
      custCostTotal += totalCustomerCost(s);
      totalRebate += s.customerCost?.rebate ?? 0;
      totalVolume += s.weightValue;
    });
    const margin = custCostTotal > 0 ? ((custCostTotal - mpsCostTotal) / custCostTotal) * 100 : 0;
    const costPerTon = totalVolume > 0 ? mpsCostTotal / (totalVolume / 2000) : 0;
    return { mpsCostTotal, custCostTotal, totalRebate, margin, costPerTon };
  }, [shipments]);

  /* Monthly cost trend */
  const monthlyCost = React.useMemo(() => {
    const byMonth = new Map<string, { mps: number; cust: number }>();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) ?? { mps: 0, cust: 0 };
      existing.mps += totalMpsCost(s);
      existing.cust += totalCustomerCost(s);
      byMonth.set(key, existing);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => ({
        month: formatMonthLabel(key),
        mpsCost: Math.round(d.mps),
        custCost: Math.round(d.cust),
        margin: Math.round(d.cust - d.mps),
      }));
  }, [shipments]);

  /* Cost per ton by waste stream */
  const costByStream = React.useMemo(() => {
    const byType = new Map<string, { cost: number; volume: number }>();
    shipments.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? { cost: 0, volume: 0 };
      existing.cost += totalMpsCost(s);
      existing.volume += s.weightValue;
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name,
        costPerTon: d.volume > 0 ? Math.round((d.cost / (d.volume / 2000)) * 100) / 100 : 0,
        totalCost: Math.round(d.cost),
      }))
      .sort((a, b) => b.costPerTon - a.costPerTon)
      .slice(0, 10);
  }, [shipments]);

  /* Margin waterfall */
  const waterfallData = React.useMemo(() => {
    let custTotal = 0, haul = 0, disposal = 0, fuel = 0, env = 0, rebate = 0;
    shipments.forEach((s) => {
      custTotal += totalCustomerCost(s);
      if (s.mpsCost) {
        haul += s.mpsCost.haulCharge;
        disposal += s.mpsCost.disposalFeeTotal;
        fuel += s.mpsCost.fuelFee;
        env += s.mpsCost.environmentalFee;
      }
      rebate += s.customerCost?.rebate ?? 0;
    });
    return [
      { name: "Revenue", value: Math.round(custTotal) },
      { name: "Haul", value: -Math.round(haul) },
      { name: "Disposal", value: -Math.round(disposal) },
      { name: "Fuel", value: -Math.round(fuel) },
      { name: "Env Fees", value: -Math.round(env) },
      { name: "Rebates", value: Math.round(rebate) },
      { name: "Net Margin", value: 0, isTotal: true },
    ];
  }, [shipments]);

  /* Cost breakdown by category */
  const costBreakdown = React.useMemo(() => {
    let haul = 0, disposal = 0, fuel = 0, env = 0, other = 0;
    shipments.forEach((s) => {
      if (s.mpsCost) {
        haul += s.mpsCost.haulCharge;
        disposal += s.mpsCost.disposalFeeTotal;
        fuel += s.mpsCost.fuelFee;
        env += s.mpsCost.environmentalFee;
        other += s.mpsCost.otherFees;
      }
    });
    return [
      { name: "Haul", value: Math.round(haul) },
      { name: "Disposal", value: Math.round(disposal) },
      { name: "Fuel", value: Math.round(fuel) },
      { name: "Environmental", value: Math.round(env) },
      { name: "Other", value: Math.round(other) },
    ].filter((d) => d.value > 0);
  }, [shipments]);

  const handleExport = () => {
    const headers = ["Month", "MPS Cost", "Customer Cost", "Margin"];
    const rows = monthlyCost.map((d) => [d.month, `$${d.mpsCost}`, `$${d.custCost}`, `$${d.margin}`]);
    downloadCsv("Cost_Analysis_Report.csv", headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader title="Cost Analysis" subtitle="MPS cost vs customer cost, margins, and cost per ton" />
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

      {/* KPI Row */}
      <StatRow>
        <KpiCard title="Total MPS Cost" value={`$${(totals.mpsCostTotal / 1000).toFixed(1)}k`} icon={DollarSign} />
        <KpiCard title="Total Customer Cost" value={`$${(totals.custCostTotal / 1000).toFixed(1)}k`} icon={TrendingUp} variant="success" />
        <KpiCard title="Margin" value={`${totals.margin.toFixed(1)}%`} icon={Percent} variant={totals.margin > 0 ? "success" : "error"} />
        <KpiCard title="Total Rebates" value={`$${totals.totalRebate.toLocaleString()}`} icon={ArrowDownRight} variant="success" />
      </StatRow>

      {/* Monthly Cost Trend */}
      <ChartContainer title="Monthly Cost Trend" subtitle="MPS cost vs customer cost with margin">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyCost} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="mpsCost" name="MPS Cost" stroke={CATEGORY_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="custCost" name="Customer Cost" stroke={CATEGORY_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="margin" name="Margin" stroke={CATEGORY_COLORS[2]} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Margin Waterfall */}
      <ChartContainer title="Margin Waterfall" subtitle="How customer revenue flows to net margin">
        <WaterfallChart
          data={waterfallData}
          valueFormatter={(v) => `$${Math.abs(v).toLocaleString()}`}
        />
      </ChartContainer>

      {/* Cost per ton + Cost breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer title="Cost per Ton by Waste Stream" subtitle="Top 10 most expensive streams">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costByStream} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} width={115} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString()}/ton`, ""]} />
              <Bar dataKey="costPerTon" name="$/Ton" fill={CATEGORY_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="MPS Cost Breakdown" subtitle="By cost category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
              <Bar dataKey="value" fill={CATEGORY_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
