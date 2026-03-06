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
  Cell,
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
import {
  getAllShipments,
  getClients,
  getReceivingFacilities,
} from "@/lib/mock-data";
import {
  totalMpsCost,
  downloadCsv,
} from "@/lib/report-utils";
import {
  Route,
  Download,
  Building2,
  MapPin,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Sparkline ─── */

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`
    )
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      className={cn("text-primary-400", className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ─── Page ─── */

export default function LogisticsPage() {
  const clients = React.useMemo(() => getClients(), []);
  const facilities = React.useMemo(() => getReceivingFacilities(), []);
  const [clientId, setClientId] = React.useState("");

  const shipments = React.useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (clientId) filters.clientIds = [clientId];
    return getAllShipments(filters as never);
  }, [clientId]);

  /* ─── KPIs ─── */

  const kpis = React.useMemo(() => {
    const facilitySet = new Set<string>();
    const transporterSet = new Set<string>();
    let totalMiles = 0;
    let milesCount = 0;

    shipments.forEach((s) => {
      if (s.receivingFacility) facilitySet.add(s.receivingFacility);
      if (s.transporterName) transporterSet.add(s.transporterName);
      if (s.milesFromFacility && s.milesFromFacility > 0) {
        totalMiles += s.milesFromFacility;
        milesCount++;
      }
    });

    return {
      facilitiesUsed: facilitySet.size,
      transportersUsed: transporterSet.size,
      avgMiles: milesCount > 0 ? Math.round(totalMiles / milesCount) : 0,
      totalShipments: shipments.length,
    };
  }, [shipments]);

  /* ─── Distance Distribution Histogram ─── */

  const distanceHistogram = React.useMemo(() => {
    const buckets: Record<string, number> = {
      "0-25 mi": 0,
      "25-50 mi": 0,
      "50-100 mi": 0,
      "100-200 mi": 0,
      "200+ mi": 0,
    };
    shipments.forEach((s) => {
      const miles = s.milesFromFacility ?? 0;
      if (miles <= 0) return;
      if (miles <= 25) buckets["0-25 mi"]++;
      else if (miles <= 50) buckets["25-50 mi"]++;
      else if (miles <= 100) buckets["50-100 mi"]++;
      else if (miles <= 200) buckets["100-200 mi"]++;
      else buckets["200+ mi"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));
  }, [shipments]);

  const distanceBucketColors = [
    CATEGORY_COLORS[1], // green
    CATEGORY_COLORS[0], // blue
    CATEGORY_COLORS[2], // amber
    CATEGORY_COLORS[3], // red
    CATEGORY_COLORS[4], // violet
  ];

  /* ─── Facility Summary ─── */

  const facilitySummary = React.useMemo(() => {
    const byFacility = new Map<
      string,
      {
        company: string;
        state: string;
        epaId: string;
        shipments: number;
        volume: number;
        totalMiles: number;
        milesCount: number;
        cost: number;
        monthlyVolume: Map<string, number>;
      }
    >();

    shipments.forEach((s) => {
      const fname = s.receivingFacility ?? "Unknown";
      const existing = byFacility.get(fname) ?? {
        company: s.receivingCompany ?? "",
        state: s.receivingState ?? "",
        epaId: s.receivingEpaId ?? "",
        shipments: 0,
        volume: 0,
        totalMiles: 0,
        milesCount: 0,
        cost: 0,
        monthlyVolume: new Map(),
      };
      existing.shipments++;
      existing.volume += s.weightValue;
      existing.cost += totalMpsCost(s);
      if (s.milesFromFacility && s.milesFromFacility > 0) {
        existing.totalMiles += s.milesFromFacility;
        existing.milesCount++;
      }
      const monthKey = s.shipmentDate.slice(0, 7);
      existing.monthlyVolume.set(
        monthKey,
        (existing.monthlyVolume.get(monthKey) ?? 0) + s.weightValue
      );
      byFacility.set(fname, existing);
    });

    return Array.from(byFacility.entries())
      .map(([name, d]) => {
        // Build sparkline data from monthly volumes
        const months = Array.from(d.monthlyVolume.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, v]) => v);
        return {
          name,
          company: d.company,
          state: d.state,
          epaId: d.epaId,
          shipments: d.shipments,
          volume: Math.round(d.volume),
          avgMiles:
            d.milesCount > 0
              ? Math.round(d.totalMiles / d.milesCount)
              : 0,
          cost: Math.round(d.cost),
          sparkline: months,
        };
      })
      .sort((a, b) => b.volume - a.volume);
  }, [shipments]);

  /* ─── Waste Flow: Site → Facility ─── */

  const wasteFlows = React.useMemo(() => {
    const flows = new Map<string, { volume: number; shipments: number }>();
    shipments.forEach((s) => {
      const key = `${s.siteName}→${s.receivingFacility ?? "Unknown"}`;
      const existing = flows.get(key) ?? { volume: 0, shipments: 0 };
      existing.volume += s.weightValue;
      existing.shipments++;
      flows.set(key, existing);
    });
    return Array.from(flows.entries())
      .map(([key, d]) => {
        const [source, target] = key.split("→");
        return {
          source,
          target,
          volume: Math.round(d.volume),
          shipments: d.shipments,
        };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 15);
  }, [shipments]);

  const maxFlowVolume = Math.max(
    ...wasteFlows.map((f) => f.volume),
    1
  );

  /* ─── Facility Utilization ─── */

  const facilityUtilization = React.useMemo(() => {
    // Compare each facility's current period volume to its average
    return facilitySummary
      .filter((f) => f.sparkline.length >= 2)
      .map((f) => {
        const avg =
          f.sparkline.reduce((sum, v) => sum + v, 0) / f.sparkline.length;
        const latest = f.sparkline[f.sparkline.length - 1] ?? 0;
        const utilization = avg > 0 ? Math.round((latest / avg) * 100) : 0;
        return {
          name: f.name,
          utilization,
          latest: Math.round(latest),
          avg: Math.round(avg),
        };
      })
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 8);
  }, [facilitySummary]);

  const handleExport = () => {
    const headers = [
      "Facility",
      "Company",
      "State",
      "EPA ID",
      "Shipments",
      "Volume (lbs)",
      "Avg Miles",
      "Total Cost",
    ];
    const rows = facilitySummary.map((f) => [
      f.name,
      f.company,
      f.state,
      f.epaId,
      String(f.shipments),
      String(f.volume),
      String(f.avgMiles),
      `$${f.cost}`,
    ]);
    downloadCsv("Logistics_Facilities_Report.csv", headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader
          title="Logistics & Facilities"
          subtitle="Receiving facility performance, distance analysis, and waste flow patterns"
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
          onValueChange={(val) => setClientId(val === "all" ? "" : val)}
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
      </div>

      {/* KPIs */}
      <StatRow>
        <KpiCard
          title="Facilities Used"
          value={kpis.facilitiesUsed}
          icon={Building2}
        />
        <KpiCard
          title="Transporters"
          value={kpis.transportersUsed}
          icon={Truck}
        />
        <KpiCard
          title="Avg Distance"
          value={`${kpis.avgMiles} mi`}
          icon={MapPin}
        />
        <KpiCard
          title="Total Shipments"
          value={kpis.totalShipments}
          icon={Route}
          variant="success"
        />
      </StatRow>

      {/* Distance Histogram + Facility Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="Distance Distribution"
          subtitle="Shipments by distance to receiving facility"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={distanceHistogram}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-default)"
              />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Shipments" radius={[4, 4, 0, 0]}>
                {distanceHistogram.map((_, idx) => (
                  <Cell key={idx} fill={distanceBucketColors[idx]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Facility Utilization"
          subtitle="Current period vs historical average (% of avg)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={facilityUtilization}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 100 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-default)"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                width={95}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value) => [`${value}%`, "Utilization"]}
              />
              <Bar
                dataKey="utilization"
                name="Utilization %"
                radius={[0, 4, 4, 0]}
              >
                {facilityUtilization.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      entry.utilization > 120
                        ? CATEGORY_COLORS[3]
                        : entry.utilization > 80
                          ? CATEGORY_COLORS[1]
                          : CATEGORY_COLORS[2]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Waste Flow Diagram (simplified as flow table) */}
      <Card>
        <CardHeader>
          <CardTitle>Waste Flow — Site to Facility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {wasteFlows.map((flow) => {
              const widthPct = (flow.volume / maxFlowVolume) * 100;
              return (
                <div
                  key={`${flow.source}-${flow.target}`}
                  className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3"
                >
                  <span className="text-xs font-medium text-text-primary truncate text-right">
                    {flow.source}
                  </span>
                  <div className="relative h-5 w-32 sm:w-48 rounded-full bg-bg-subtle overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary-300 transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted truncate">
                    {flow.target}
                  </span>
                  <span className="text-xs tabular-nums text-text-primary whitespace-nowrap">
                    {(flow.volume / 1000).toFixed(1)}k lbs
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Receiving Facility Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Receiving Facility Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left">
                  <th className="pb-2 font-medium text-text-muted">
                    Facility
                  </th>
                  <th className="pb-2 font-medium text-text-muted">
                    Company
                  </th>
                  <th className="pb-2 font-medium text-text-muted">
                    State
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Shipments
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Volume
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Avg Miles
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Cost
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-center">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {facilitySummary.slice(0, 12).map((f) => (
                  <tr
                    key={f.name}
                    className="border-b border-border-default last:border-0"
                  >
                    <td className="py-2.5 text-text-primary font-medium">
                      {f.name}
                    </td>
                    <td className="py-2.5 text-text-muted text-xs">
                      {f.company}
                    </td>
                    <td className="py-2.5">
                      <Badge variant="neutral">{f.state}</Badge>
                    </td>
                    <td className="py-2.5 text-text-primary text-right tabular-nums">
                      {f.shipments}
                    </td>
                    <td className="py-2.5 text-text-primary text-right tabular-nums">
                      {f.volume.toLocaleString()} lbs
                    </td>
                    <td className="py-2.5 text-text-primary text-right tabular-nums">
                      {f.avgMiles > 0 ? `${f.avgMiles} mi` : "—"}
                    </td>
                    <td className="py-2.5 text-text-primary text-right tabular-nums">
                      ${f.cost.toLocaleString()}
                    </td>
                    <td className="py-2.5 flex justify-center">
                      <Sparkline data={f.sparkline} />
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
