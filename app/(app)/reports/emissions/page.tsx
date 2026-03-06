"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import { getAllShipments, getClients } from "@/lib/mock-data";
import { getMonthKey, formatMonthLabel, downloadCsv } from "@/lib/report-utils";
import { Leaf, Download, TrendingDown, Factory, Recycle } from "lucide-react";

/* ─── Emissions Factors (kg CO2 per ton of waste by treatment method) ─── */

const EMISSIONS_FACTORS: Record<string, number> = {
  Incineration: 1200,
  "Energy Recovery": 800,
  Landfill: 500,
  Recycling: 50,
  Reuse: 20,
  "Wastewater Treatment": 150,
  "Fuel Blending": 600,
  Composting: 30,
  Unknown: 400,
};

function getEmissionsFactor(treatmentMethod: string | undefined): number {
  if (!treatmentMethod) return EMISSIONS_FACTORS.Unknown;
  return EMISSIONS_FACTORS[treatmentMethod] ?? EMISSIONS_FACTORS.Unknown;
}

/* ─── Page ─── */

export default function EmissionsPage() {
  const clients = React.useMemo(() => getClients(), []);
  const [clientId, setClientId] = React.useState("");

  const shipments = React.useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (clientId) filters.clientIds = [clientId];
    return getAllShipments(filters as never);
  }, [clientId]);

  /* ─── KPI Computations ─── */

  const kpis = React.useMemo(() => {
    let totalWeightTons = 0;
    let totalCO2 = 0;
    let diverted = 0;

    shipments.forEach((s) => {
      const tons = s.weightValue / 2000;
      totalWeightTons += tons;
      totalCO2 += tons * getEmissionsFactor(s.treatmentMethod);
      if (
        s.treatmentMethod === "Recycling" ||
        s.treatmentMethod === "Reuse"
      ) {
        diverted += tons;
      }
    });

    const intensity =
      totalWeightTons > 0 ? Math.round(totalCO2 / totalWeightTons) : 0;
    const avoidedCO2 = Math.round(
      diverted * (EMISSIONS_FACTORS.Landfill - EMISSIONS_FACTORS.Recycling)
    );

    return {
      totalCO2: Math.round(totalCO2),
      intensity,
      avoidedCO2,
      totalWeightTons: Math.round(totalWeightTons),
    };
  }, [shipments]);

  /* ─── Monthly Emissions Trend ─── */

  const monthlyEmissions = React.useMemo(() => {
    const byMonth = new Map<
      string,
      { co2: number; tons: number }
    >();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) ?? { co2: 0, tons: 0 };
      const tons = s.weightValue / 2000;
      existing.co2 += tons * getEmissionsFactor(s.treatmentMethod);
      existing.tons += tons;
      byMonth.set(key, existing);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => ({
        month: formatMonthLabel(key),
        co2: Math.round(d.co2),
        intensity:
          d.tons > 0 ? Math.round(d.co2 / d.tons) : 0,
      }));
  }, [shipments]);

  /* ─── Emissions by Treatment Method ─── */

  const byTreatment = React.useMemo(() => {
    const byMethod = new Map<
      string,
      { co2: number; tons: number; shipments: number }
    >();
    shipments.forEach((s) => {
      const method = s.treatmentMethod ?? "Unknown";
      const existing = byMethod.get(method) ?? {
        co2: 0,
        tons: 0,
        shipments: 0,
      };
      const tons = s.weightValue / 2000;
      existing.co2 += tons * getEmissionsFactor(method);
      existing.tons += tons;
      existing.shipments++;
      byMethod.set(method, existing);
    });
    return Array.from(byMethod.entries())
      .map(([name, d]) => ({
        name,
        co2: Math.round(d.co2),
        tons: Math.round(d.tons),
        intensity:
          d.tons > 0 ? Math.round(d.co2 / d.tons) : 0,
        shipments: d.shipments,
      }))
      .sort((a, b) => b.co2 - a.co2);
  }, [shipments]);

  /* ─── Emissions by Site ─── */

  const bySite = React.useMemo(() => {
    const siteMap = new Map<
      string,
      { co2: number; tons: number }
    >();
    shipments.forEach((s) => {
      const existing = siteMap.get(s.siteName) ?? {
        co2: 0,
        tons: 0,
      };
      const tons = s.weightValue / 2000;
      existing.co2 += tons * getEmissionsFactor(s.treatmentMethod);
      existing.tons += tons;
      siteMap.set(s.siteName, existing);
    });
    return Array.from(siteMap.entries())
      .map(([name, d]) => ({
        name,
        co2: Math.round(d.co2),
        intensity:
          d.tons > 0 ? Math.round(d.co2 / d.tons) : 0,
      }))
      .sort((a, b) => b.co2 - a.co2);
  }, [shipments]);

  const handleExport = () => {
    const headers = [
      "Treatment Method",
      "CO2 (kg)",
      "Weight (tons)",
      "Intensity (kg CO2/ton)",
      "Shipments",
    ];
    const rows = byTreatment.map((d) => [
      d.name,
      String(d.co2),
      String(d.tons),
      String(d.intensity),
      String(d.shipments),
    ]);
    downloadCsv("GHG_Emissions_Report.csv", headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader
          title="GHG Emissions"
          subtitle="Estimated greenhouse gas emissions by treatment method and site"
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
          onValueChange={(val) =>
            setClientId(val === "all" ? "" : val)
          }
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
          title="Total CO2"
          value={`${(kpis.totalCO2 / 1000).toFixed(1)}t`}
          icon={Factory}
          variant="warning"
        />
        <KpiCard
          title="Intensity"
          value={`${kpis.intensity} kg/ton`}
          icon={Leaf}
          variant={kpis.intensity < 400 ? "success" : "warning"}
        />
        <KpiCard
          title="CO2 Avoided"
          value={`${(kpis.avoidedCO2 / 1000).toFixed(1)}t`}
          icon={Recycle}
          variant="success"
        />
        <KpiCard
          title="Waste Processed"
          value={`${kpis.totalWeightTons.toLocaleString()} tons`}
          icon={TrendingDown}
        />
      </StatRow>

      {/* Emissions Trend + Intensity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="Monthly CO2 Emissions"
          subtitle="Estimated kg CO2 by month"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyEmissions}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-default)"
              />
              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                }}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} kg CO2`,
                  "Emissions",
                ]}
              />
              <Area
                type="monotone"
                dataKey="co2"
                stroke={CATEGORY_COLORS[2]}
                fill={CATEGORY_COLORS[2]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Emissions Intensity Trend"
          subtitle="kg CO2 per ton of waste processed"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyEmissions}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-default)"
              />
              <XAxis
                dataKey="month"
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                }}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value) => [
                  `${value} kg CO2/ton`,
                  "Intensity",
                ]}
              />
              <Area
                type="monotone"
                dataKey="intensity"
                stroke={CATEGORY_COLORS[1]}
                fill={CATEGORY_COLORS[1]}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Emissions by Treatment Method */}
      <ChartContainer
        title="Emissions by Treatment Method"
        subtitle="Total CO2 and intensity per method"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={byTreatment}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 120 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-default)"
            />
            <XAxis
              type="number"
              tick={{
                fontSize: 11,
                fill: "var(--color-text-muted)",
              }}
              tickFormatter={(v) =>
                `${(v / 1000).toFixed(0)}k`
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{
                fontSize: 11,
                fill: "var(--color-text-muted)",
              }}
              width={115}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value) => [
                `${Number(value).toLocaleString()} kg CO2`,
                "",
              ]}
            />
            <Bar
              dataKey="co2"
              name="CO2 (kg)"
              radius={[0, 4, 4, 0]}
            >
              {byTreatment.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    entry.intensity > 800
                      ? CATEGORY_COLORS[3]
                      : entry.intensity > 300
                        ? CATEGORY_COLORS[2]
                        : CATEGORY_COLORS[1]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Emissions by Site */}
      <Card>
        <CardHeader>
          <CardTitle>Emissions by Site</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left">
                  <th className="pb-2 font-medium text-text-muted">
                    Site
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Total CO2 (kg)
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Intensity (kg/ton)
                  </th>
                  <th className="pb-2 font-medium text-text-muted text-right">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {bySite.map((s) => (
                  <tr
                    key={s.name}
                    className="border-b border-border-default last:border-0"
                  >
                    <td className="py-2.5 text-text-primary font-medium">
                      {s.name}
                    </td>
                    <td className="py-2.5 text-text-primary text-right tabular-nums">
                      {s.co2.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-text-primary text-right tabular-nums">
                      {s.intensity}
                    </td>
                    <td className="py-2.5 text-right">
                      <Badge
                        variant={
                          s.intensity < 200
                            ? "success"
                            : s.intensity < 500
                              ? "warning"
                              : "error"
                        }
                      >
                        {s.intensity < 200
                          ? "Low"
                          : s.intensity < 500
                            ? "Medium"
                            : "High"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Emissions Factor Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Emissions Factor Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-muted mb-3">
            Estimated kg CO2 per ton of waste by treatment method.
            These are approximations for directional ESG reporting.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(EMISSIONS_FACTORS)
              .sort(([, a], [, b]) => b - a)
              .map(([method, factor]) => (
                <div
                  key={method}
                  className="flex items-center justify-between rounded-sm bg-bg-subtle px-3 py-2"
                >
                  <span className="text-xs text-text-primary">
                    {method}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-text-muted">
                    {factor}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
