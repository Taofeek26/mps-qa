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
  Legend,
  Treemap,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { StatRow } from "@/components/ui/stat-row";
import { KpiCard } from "@/components/ui/kpi-card";
import { ChartContainer, CATEGORY_COLORS, TOOLTIP_STYLE } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { getAllShipments, getClients, getSites } from "@/lib/mock-data";
import {
  getMonthKey,
  formatMonthLabel,
  totalMpsCost,
  totalCustomerCost,
  downloadCsv,
} from "@/lib/report-utils";
import { Activity, Download, Trophy, TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/lib/types";

/* ─── Sparkline (inline SVG mini chart) ─── */

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map(
      (v, i) =>
        `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * h}`
    )
    .join(" ");
  return (
    <svg width={w} height={h} className={cn("text-primary-400", className)}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ─── Star rating renderer ─── */

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full",
            i < rating ? "bg-warning-500" : "bg-bg-muted"
          )}
        />
      ))}
    </span>
  );
}

/* ─── Treemap custom content renderer ─── */

function TreemapContent(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  size?: number;
}) {
  const { x, y, width, height, name, size } = props;
  if (width < 40 || height < 24) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        style={{ stroke: "var(--color-bg-surface)", strokeWidth: 2 }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 6}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: Math.min(11, width / 8), fill: "#fff", fontWeight: 600 }}
      >
        {(name ?? "").length > width / 7 ? (name ?? "").slice(0, Math.floor(width / 7)) + "..." : name}
      </text>
      {height > 36 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: 9, fill: "rgba(255,255,255,0.8)" }}
        >
          {(size ?? 0).toLocaleString()} lbs
        </text>
      )}
    </g>
  );
}

/* ─── Helpers ─── */

function getMonthKeys(shipments: Shipment[]): string[] {
  const set = new Set<string>();
  shipments.forEach((s) => set.add(getMonthKey(s.shipmentDate)));
  return Array.from(set).sort();
}

/* ════════════════════════════════════════════
   Operational Intelligence Report
   ════════════════════════════════════════════ */

export default function OperationsReportPage() {
  const clients = React.useMemo(() => getClients(), []);
  const allSites = React.useMemo(() => getSites(), []);
  const [clientId, setClientId] = React.useState("");
  const [siteId, setSiteId] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("2024-07-01");
  const [dateTo, setDateTo] = React.useState("2025-02-28");

  const filteredSites = clientId
    ? allSites.filter((s) => s.clientId === clientId)
    : allSites;

  const shipments = React.useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (clientId) filters.clientIds = [clientId];
    if (siteId) filters.siteIds = [siteId];
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    return getAllShipments(filters as never);
  }, [clientId, siteId, dateFrom, dateTo]);

  const monthKeys = React.useMemo(() => getMonthKeys(shipments), [shipments]);

  /* ─── KPI Data ─── */

  const kpis = React.useMemo(() => {
    const activeSiteIds = new Set(shipments.map((s) => s.siteId));
    const totalVolume = shipments.reduce((sum, s) => sum + s.weightValue, 0);
    const transporterIds = new Set(
      shipments.map((s) => s.vendorId).filter(Boolean)
    );

    // Per-site margin
    const siteMap = new Map<
      string,
      { mps: number; cust: number; volume: number }
    >();
    shipments.forEach((s) => {
      const existing = siteMap.get(s.siteId) ?? { mps: 0, cust: 0, volume: 0 };
      existing.mps += totalMpsCost(s);
      existing.cust += totalCustomerCost(s);
      existing.volume += s.weightValue;
      siteMap.set(s.siteId, existing);
    });

    let topSite = "";
    let topMargin = -Infinity;
    siteMap.forEach((data, sid) => {
      const margin =
        data.cust > 0 ? ((data.cust - data.mps) / data.cust) * 100 : 0;
      if (margin > topMargin) {
        topMargin = margin;
        topSite =
          shipments.find((s) => s.siteId === sid)?.siteName ?? sid;
      }
    });

    return {
      activeSites: activeSiteIds.size,
      avgVolumePerSite:
        activeSiteIds.size > 0
          ? Math.round(totalVolume / activeSiteIds.size)
          : 0,
      topSite,
      topMargin: Math.round(topMargin * 10) / 10,
      totalTransporters: transporterIds.size,
    };
  }, [shipments]);

  /* ─── Site Leaderboard ─── */

  const siteLeaderboard = React.useMemo(() => {
    const siteMap = new Map<
      string,
      {
        name: string;
        volume: number;
        shipments: number;
        mps: number;
        cust: number;
        monthly: Map<string, number>;
      }
    >();

    shipments.forEach((s) => {
      const existing = siteMap.get(s.siteId) ?? {
        name: s.siteName,
        volume: 0,
        shipments: 0,
        mps: 0,
        cust: 0,
        monthly: new Map<string, number>(),
      };
      existing.volume += s.weightValue;
      existing.shipments += 1;
      existing.mps += totalMpsCost(s);
      existing.cust += totalCustomerCost(s);
      const mk = getMonthKey(s.shipmentDate);
      existing.monthly.set(mk, (existing.monthly.get(mk) ?? 0) + s.weightValue);
      siteMap.set(s.siteId, existing);
    });

    return Array.from(siteMap.entries())
      .map(([id, d]) => {
        const margin =
          d.cust > 0 ? ((d.cust - d.mps) / d.cust) * 100 : 0;
        const sparkData = monthKeys.map((k) => d.monthly.get(k) ?? 0);
        return {
          id,
          name: d.name,
          volume: Math.round(d.volume),
          shipments: d.shipments,
          mps: Math.round(d.mps),
          cust: Math.round(d.cust),
          margin: Math.round(margin * 10) / 10,
          sparkData,
        };
      })
      .sort((a, b) => b.margin - a.margin);
  }, [shipments, monthKeys]);

  /* ─── Waste Type Treemap ─── */

  const wasteTypeData = React.useMemo(() => {
    const byType = new Map<string, { volume: number; cost: number }>();
    shipments.forEach((s) => {
      const existing = byType.get(s.wasteTypeName) ?? {
        volume: 0,
        cost: 0,
      };
      existing.volume += s.weightValue;
      existing.cost += totalMpsCost(s);
      byType.set(s.wasteTypeName, existing);
    });
    return Array.from(byType.entries())
      .map(([name, d]) => ({
        name,
        volume: Math.round(d.volume),
        cost: Math.round(d.cost),
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [shipments]);

  const treemapData = React.useMemo(
    () =>
      wasteTypeData.map((d) => ({
        name: d.name,
        size: d.volume,
        cost: d.cost,
      })),
    [wasteTypeData]
  );

  /* ─── Hazardous vs Non-Hazardous Diverging Bar ─── */

  const hazDivergingData = React.useMemo(() => {
    const bySite = new Map<
      string,
      { name: string; haz: number; nonHaz: number }
    >();
    shipments.forEach((s) => {
      const existing = bySite.get(s.siteId) ?? {
        name: s.siteName,
        haz: 0,
        nonHaz: 0,
      };
      if (s.wasteCategory === "Hazardous Waste") {
        existing.haz += s.weightValue;
      } else {
        existing.nonHaz += s.weightValue;
      }
      bySite.set(s.siteId, existing);
    });
    return Array.from(bySite.values())
      .map((d) => ({
        name: d.name,
        Hazardous: Math.round(d.haz),
        "Non-Hazardous": -Math.round(d.nonHaz),
      }))
      .sort(
        (a, b) =>
          b.Hazardous + Math.abs(b["Non-Hazardous"]) -
          (a.Hazardous + Math.abs(a["Non-Hazardous"]))
      );
  }, [shipments]);

  /* ─── Transporter Performance ─── */

  const transporterData = React.useMemo(() => {
    const byTransporter = new Map<
      string,
      {
        name: string;
        shipments: number;
        volume: number;
        totalMiles: number;
        totalCost: number;
      }
    >();
    shipments.forEach((s) => {
      const name = s.transporterName ?? s.vendorName;
      const existing = byTransporter.get(name) ?? {
        name,
        shipments: 0,
        volume: 0,
        totalMiles: 0,
        totalCost: 0,
      };
      existing.shipments += 1;
      existing.volume += s.weightValue;
      existing.totalMiles += s.milesFromFacility ?? 0;
      existing.totalCost += totalMpsCost(s);
      byTransporter.set(name, existing);
    });

    const entries = Array.from(byTransporter.values()).sort(
      (a, b) => b.volume - a.volume
    );

    // Rating based on volume efficiency (volume per shipment)
    const efficiencies = entries.map(
      (e) => (e.shipments > 0 ? e.volume / e.shipments : 0)
    );
    const maxEff = Math.max(...efficiencies, 1);

    return entries.map((e, i) => ({
      ...e,
      avgMiles:
        e.shipments > 0 ? Math.round(e.totalMiles / e.shipments) : 0,
      rating: Math.max(
        1,
        Math.min(5, Math.round((efficiencies[i] / maxEff) * 5))
      ),
    }));
  }, [shipments]);

  /* ─── Small Multiples (per-site mini charts) ─── */

  const smallMultiples = React.useMemo(() => {
    const bySite = new Map<string, { name: string; monthly: Map<string, number> }>();
    shipments.forEach((s) => {
      const existing = bySite.get(s.siteId) ?? {
        name: s.siteName,
        monthly: new Map<string, number>(),
      };
      const mk = getMonthKey(s.shipmentDate);
      existing.monthly.set(mk, (existing.monthly.get(mk) ?? 0) + s.weightValue);
      bySite.set(s.siteId, existing);
    });

    let maxMoMChange = 0;
    let highlightSiteId = "";

    const sites = Array.from(bySite.entries()).map(([id, d]) => {
      const data = monthKeys.map((k) => ({
        month: formatMonthLabel(k),
        volume: Math.round(d.monthly.get(k) ?? 0),
      }));

      // Calculate max month-over-month change
      let biggestChange = 0;
      for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1].volume;
        const curr = data[i].volume;
        const change = prev > 0 ? Math.abs((curr - prev) / prev) * 100 : 0;
        if (change > biggestChange) biggestChange = change;
      }

      if (biggestChange > maxMoMChange) {
        maxMoMChange = biggestChange;
        highlightSiteId = id;
      }

      return { id, name: d.name, data };
    });

    return { sites, highlightSiteId };
  }, [shipments, monthKeys]);

  /* ─── CSV Export ─── */

  const handleExport = () => {
    const headers = [
      "Site",
      "Volume (lbs)",
      "Shipments",
      "MPS Cost",
      "Customer Cost",
      "Margin %",
    ];
    const rows = siteLeaderboard.map((s) => [
      s.name,
      String(s.volume),
      String(s.shipments),
      `$${s.mps}`,
      `$${s.cust}`,
      `${s.margin}%`,
    ]);
    downloadCsv("Operational_Intelligence_Report.csv", headers, rows);
  };

  /* ─── Rank badge colors ─── */

  const rankBadgeVariant = (rank: number) => {
    if (rank === 1) return "warning" as const;
    if (rank === 2) return "neutral" as const;
    if (rank === 3) return "neutral" as const;
    return "neutral" as const;
  };

  const rankLabel = (rank: number) => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader
          title="Operational Intelligence"
          subtitle="Site leaderboards, waste composition, transporter performance, and hazardous analysis"
        />
        <Button onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={clientId || "all"}
          onValueChange={(val) => {
            setClientId(val === "all" ? "" : val);
            setSiteId("");
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={siteId || "all"}
          onValueChange={(val) => setSiteId(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {filteredSites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker
          value={dateFrom ? new Date(dateFrom + "T00:00:00") : undefined}
          onChange={(date) =>
            setDateFrom(date ? format(date, "yyyy-MM-dd") : "")
          }
          placeholder="From date"
        />
        <DatePicker
          value={dateTo ? new Date(dateTo + "T00:00:00") : undefined}
          onChange={(date) =>
            setDateTo(date ? format(date, "yyyy-MM-dd") : "")
          }
          placeholder="To date"
        />
      </div>

      {/* KPI Cards */}
      <StatRow>
        <KpiCard
          title="Total Sites Active"
          value={kpis.activeSites}
          icon={Building2}
        />
        <KpiCard
          title="Avg Volume per Site"
          value={`${(kpis.avgVolumePerSite / 1000).toFixed(1)}k lbs`}
          icon={Activity}
        />
        <KpiCard
          title="Top Site (by Margin)"
          value={kpis.topSite}
          icon={Trophy}
          variant="success"
        />
        <KpiCard
          title="Total Transporters Used"
          value={kpis.totalTransporters}
          icon={TrendingUp}
        />
      </StatRow>

      {/* Site Comparison Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Site Comparison Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left">
                  <th className="pb-2 font-medium text-text-muted">Rank</th>
                  <th className="pb-2 font-medium text-text-muted">Site</th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Volume (lbs)
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Shipments
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    MPS Cost
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Customer Cost
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Margin %
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {siteLeaderboard.map((site, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr
                      key={site.id}
                      className="border-b border-border-default last:border-0"
                    >
                      <td className="py-2.5">
                        <Badge
                          variant={rankBadgeVariant(rank)}
                          className={cn(
                            rank === 1 && "bg-warning-100 text-warning-700",
                            rank === 2 && "bg-neutral-200 text-neutral-700",
                            rank === 3 && "bg-warning-50 text-warning-600"
                          )}
                        >
                          {rankLabel(rank)}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-text-primary font-medium">
                        {site.name}
                      </td>
                      <td className="py-2.5 text-text-primary text-right">
                        {site.volume.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-text-primary text-right">
                        {site.shipments}
                      </td>
                      <td className="py-2.5 text-text-primary text-right">
                        ${site.mps.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-text-primary text-right">
                        ${site.cust.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            site.margin >= 0
                              ? "text-success-600"
                              : "text-error-600"
                          )}
                        >
                          {site.margin}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Sparkline data={site.sparkData} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Waste Type Treemap + Hazardous Diverging Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Treemap */}
        <ChartContainer
          title="Waste Type Composition"
          subtitle="Volume distribution by waste type"
        >
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              nameKey="name"
              stroke="var(--color-bg-surface)"
              content={<TreemapContent x={0} y={0} width={0} height={0} />}
            >
              {treemapData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                />
              ))}
            </Treemap>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Hazardous vs Non-Hazardous Diverging Bar */}
        <ChartContainer
          title="Hazardous vs Non-Hazardous"
          subtitle="Diverging volume by site (lbs)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hazDivergingData}
              layout="vertical"
              stackOffset="sign"
              margin={{ top: 5, right: 20, bottom: 5, left: 100 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-default)"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                tickFormatter={(v) =>
                  `${Math.abs(v / 1000).toFixed(0)}k`
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                width={95}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value) => [
                  `${Math.abs(Number(value)).toLocaleString()} lbs`,
                  "",
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="Non-Hazardous"
                stackId="a"
                fill={CATEGORY_COLORS[1]}
                name="Non-Hazardous"
              />
              <Bar
                dataKey="Hazardous"
                stackId="a"
                fill={CATEGORY_COLORS[3]}
                name="Hazardous"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Transporter Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transporter Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left">
                  <th className="pb-2 font-medium text-text-muted">
                    Transporter
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Shipments
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Volume (lbs)
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Avg Miles
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Total Cost
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {transporterData.map((t) => (
                  <tr
                    key={t.name}
                    className="border-b border-border-default last:border-0"
                  >
                    <td className="py-2.5 text-text-primary font-medium">
                      {t.name}
                    </td>
                    <td className="py-2.5 text-text-primary text-right">
                      {t.shipments}
                    </td>
                    <td className="py-2.5 text-text-primary text-right">
                      {Math.round(t.volume).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-text-primary text-right">
                      {t.avgMiles}
                    </td>
                    <td className="py-2.5 text-text-primary text-right">
                      ${Math.round(t.totalCost).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <StarRating rating={t.rating} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Small Multiples — Mini Charts per Site */}
      <Card>
        <CardHeader>
          <CardTitle>Site Volume Trends (Small Multiples)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {smallMultiples.sites.map((site) => {
              const isHighlighted =
                site.id === smallMultiples.highlightSiteId;
              return (
                <div
                  key={site.id}
                  className={cn(
                    "rounded-[var(--radius-sm)] border p-2",
                    isHighlighted
                      ? "border-primary-400 bg-primary-50"
                      : "border-border-default bg-bg-card"
                  )}
                >
                  <div className="h-[60px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={site.data}
                        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
                      >
                        <Area
                          type="monotone"
                          dataKey="volume"
                          stroke={
                            isHighlighted
                              ? CATEGORY_COLORS[3]
                              : CATEGORY_COLORS[0]
                          }
                          fill={
                            isHighlighted
                              ? CATEGORY_COLORS[3]
                              : CATEGORY_COLORS[0]
                          }
                          fillOpacity={0.15}
                          strokeWidth={1.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium truncate text-center",
                      isHighlighted
                        ? "text-primary-600"
                        : "text-text-muted"
                    )}
                  >
                    {site.name}
                  </p>
                  {isHighlighted && (
                    <p className="text-[10px] text-primary-500 text-center">
                      Biggest MoM change
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
