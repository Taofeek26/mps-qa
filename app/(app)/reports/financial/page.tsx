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
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { StatRow } from "@/components/ui/stat-row";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  ChartContainer,
  CATEGORY_COLORS,
  TOOLTIP_STYLE,
  WaterfallChart,
} from "@/components/charts";
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
import {
  DollarSign,
  TrendingUp,
  Percent,
  Download,
  BarChart3,
} from "lucide-react";
import type { Shipment } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ─── Heatmap Cell Component ─── */

function HeatmapCell({
  value,
  min,
  max,
}: {
  value: number;
  min: number;
  max: number;
}) {
  // Map value to a color: negative = red, zero = neutral, positive = green
  const range = Math.max(Math.abs(min), Math.abs(max), 1);
  const normalized = value / range; // -1 to 1

  let bgClass = "bg-bg-subtle";
  let textClass = "text-text-muted";

  if (value > 0) {
    if (normalized > 0.6) {
      bgClass = "bg-success-200";
      textClass = "text-success-700";
    } else if (normalized > 0.3) {
      bgClass = "bg-success-100";
      textClass = "text-success-600";
    } else {
      bgClass = "bg-success-50";
      textClass = "text-success-600";
    }
  } else if (value < 0) {
    if (normalized < -0.6) {
      bgClass = "bg-error-200";
      textClass = "text-error-700";
    } else if (normalized < -0.3) {
      bgClass = "bg-error-100";
      textClass = "text-error-600";
    } else {
      bgClass = "bg-error-50";
      textClass = "text-error-600";
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium tabular-nums",
        bgClass,
        textClass
      )}
    >
      ${Math.abs(value).toLocaleString()}
    </div>
  );
}

/* ─── Page ─── */

export default function FinancialIntelligencePage() {
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

  /* ─── KPI Totals ─── */

  const totals = React.useMemo(() => {
    let mps = 0,
      cust = 0,
      totalRebate = 0;
    shipments.forEach((s) => {
      mps += totalMpsCost(s);
      cust += totalCustomerCost(s);
      totalRebate += s.customerCost?.rebate ?? 0;
    });
    const margin = cust - mps;
    const marginPct = cust > 0 ? (margin / cust) * 100 : 0;
    return { mps, cust, margin, marginPct, totalRebate };
  }, [shipments]);

  /* ─── Waterfall Data ─── */

  const waterfallData = React.useMemo(() => {
    let haul = 0,
      disposal = 0,
      fuel = 0,
      env = 0,
      rebate = 0;
    shipments.forEach((s) => {
      if (s.mpsCost) {
        haul += s.mpsCost.haulCharge;
        disposal += s.mpsCost.disposalFeeTotal;
        fuel += s.mpsCost.fuelFee;
        env += s.mpsCost.environmentalFee;
      }
      rebate += s.customerCost?.rebate ?? 0;
    });
    return [
      { name: "Revenue", value: Math.round(totals.cust) },
      { name: "Haul", value: -Math.round(haul) },
      { name: "Disposal", value: -Math.round(disposal) },
      { name: "Fuel", value: -Math.round(fuel) },
      { name: "Env Fees", value: -Math.round(env) },
      { name: "Rebates", value: Math.round(rebate) },
      { name: "Net Margin", value: 0, isTotal: true },
    ];
  }, [shipments, totals.cust]);

  /* ─── Margin by Cost Component ─── */

  const marginByComponent = React.useMemo(() => {
    let mpsHaul = 0,
      mpsDisposal = 0,
      mpsFuel = 0,
      mpsEnv = 0,
      mpsOther = 0;
    let custHaul = 0,
      custDisposal = 0,
      custFuel = 0,
      custEnv = 0,
      custOther = 0;
    shipments.forEach((s) => {
      if (s.mpsCost) {
        mpsHaul += s.mpsCost.haulCharge;
        mpsDisposal += s.mpsCost.disposalFeeTotal;
        mpsFuel += s.mpsCost.fuelFee;
        mpsEnv += s.mpsCost.environmentalFee;
        mpsOther += s.mpsCost.otherFees;
      }
      if (s.customerCost) {
        custHaul += s.customerCost.haulCharge;
        custDisposal += s.customerCost.disposalFeeTotal;
        custFuel += s.customerCost.fuelFee;
        custEnv += s.customerCost.environmentalFee;
        custOther += s.customerCost.otherFees;
      }
    });
    return [
      {
        name: "Haul",
        mpsMargin: Math.round(custHaul - mpsHaul),
        custMargin: Math.round(custHaul),
      },
      {
        name: "Disposal",
        mpsMargin: Math.round(custDisposal - mpsDisposal),
        custMargin: Math.round(custDisposal),
      },
      {
        name: "Fuel",
        mpsMargin: Math.round(custFuel - mpsFuel),
        custMargin: Math.round(custFuel),
      },
      {
        name: "Environmental",
        mpsMargin: Math.round(custEnv - mpsEnv),
        custMargin: Math.round(custEnv),
      },
      {
        name: "Other",
        mpsMargin: Math.round(custOther - mpsOther),
        custMargin: Math.round(custOther),
      },
    ].filter((d) => d.custMargin > 0 || d.mpsMargin !== 0);
  }, [shipments]);

  /* ─── Stacked Cost Composition ─── */

  const monthlyCostStack = React.useMemo(() => {
    const byMonth = new Map<
      string,
      { haul: number; disposal: number; fuel: number; env: number; other: number }
    >();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      const existing = byMonth.get(key) ?? {
        haul: 0,
        disposal: 0,
        fuel: 0,
        env: 0,
        other: 0,
      };
      if (s.mpsCost) {
        existing.haul += s.mpsCost.haulCharge;
        existing.disposal += s.mpsCost.disposalFeeTotal;
        existing.fuel += s.mpsCost.fuelFee;
        existing.env += s.mpsCost.environmentalFee;
        existing.other += s.mpsCost.otherFees;
      }
      byMonth.set(key, existing);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, d]) => ({
        month: formatMonthLabel(key),
        Haul: Math.round(d.haul),
        Disposal: Math.round(d.disposal),
        Fuel: Math.round(d.fuel),
        Environmental: Math.round(d.env),
        Other: Math.round(d.other),
      }));
  }, [shipments]);

  /* ─── Margin Heatmap: Site × Waste Type ─── */

  const heatmapData = React.useMemo(() => {
    const siteCols = new Set<string>();
    const wasteRows = new Map<string, Map<string, number>>();

    shipments.forEach((s) => {
      const site = s.siteName;
      const waste = s.wasteTypeName;
      siteCols.add(site);
      if (!wasteRows.has(waste)) wasteRows.set(waste, new Map());
      const existing = wasteRows.get(waste)!.get(site) ?? 0;
      const margin = totalCustomerCost(s) - totalMpsCost(s);
      wasteRows.get(waste)!.set(site, existing + margin);
    });

    const sites = Array.from(siteCols).sort();
    const rows = Array.from(wasteRows.entries())
      .map(([waste, siteMap]) => {
        const row: Record<string, number | string> = { waste };
        let rowTotal = 0;
        sites.forEach((s) => {
          const val = Math.round(siteMap.get(s) ?? 0);
          row[s] = val;
          rowTotal += val;
        });
        row._total = rowTotal;
        return row;
      })
      .sort(
        (a, b) => (b._total as number) - (a._total as number)
      )
      .slice(0, 10);

    // Compute min/max for color scaling
    let min = 0,
      max = 0;
    rows.forEach((row) => {
      sites.forEach((s) => {
        const val = row[s] as number;
        if (val < min) min = val;
        if (val > max) max = val;
      });
    });

    return { sites, rows, min, max };
  }, [shipments]);

  /* ─── Rebate Bubble Chart Data ─── */

  const rebateData = React.useMemo(() => {
    const byWaste = new Map<
      string,
      { rebate: number; volume: number; customer: string }
    >();
    shipments.forEach((s) => {
      const rebate = s.customerCost?.rebate ?? 0;
      if (rebate <= 0) return;
      const key = s.wasteTypeName;
      const existing = byWaste.get(key) ?? {
        rebate: 0,
        volume: 0,
        customer: s.clientName ?? "",
      };
      existing.rebate += rebate;
      existing.volume += s.weightValue;
      byWaste.set(key, existing);
    });
    return Array.from(byWaste.entries())
      .map(([name, d], idx) => ({
        name,
        x: idx,
        y: Math.round(d.rebate),
        z: Math.round(d.volume),
        customer: d.customer,
      }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 12);
  }, [shipments]);

  /* ─── Cost Efficiency Quadrant Data ─── */

  const efficiencyData = React.useMemo(() => {
    return shipments
      .filter((s) => s.weightValue > 0)
      .map((s) => {
        const cost = totalMpsCost(s);
        return {
          x: cost > 0 ? Number((cost / s.weightValue).toFixed(2)) : 0,
          y: s.weightValue,
          label: `${s.siteName} - ${s.wasteTypeName}`,
          category: s.wasteCategory ?? "Non Haz",
        };
      })
      .filter((d) => d.x > 0);
  }, [shipments]);

  const categoryColorMap: Record<string, string> = {
    "Non Haz": CATEGORY_COLORS[0],
    "Hazardous Waste": CATEGORY_COLORS[3],
    Recycling: CATEGORY_COLORS[1],
    Medical: CATEGORY_COLORS[2],
  };

  const handleExport = () => {
    const headers = [
      "Waste Type",
      ...heatmapData.sites,
      "Total Margin",
    ];
    const rows = heatmapData.rows.map((r) => [
      r.waste as string,
      ...heatmapData.sites.map((s) => `$${r[s]}`),
      `$${r._total}`,
    ]);
    downloadCsv("Financial_Intelligence_Report.csv", headers, rows);
  };

  const costStackCategories = ["Haul", "Disposal", "Fuel", "Environmental", "Other"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <PageHeader
          title="Financial Intelligence"
          subtitle="Margin analysis, cost waterfalls, and profitability insights"
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

      {/* KPI Row */}
      <StatRow>
        <KpiCard
          title="Customer Revenue"
          value={`$${(totals.cust / 1000).toFixed(1)}k`}
          icon={DollarSign}
        />
        <KpiCard
          title="MPS Cost"
          value={`$${(totals.mps / 1000).toFixed(1)}k`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Net Margin"
          value={`$${(totals.margin / 1000).toFixed(1)}k`}
          icon={BarChart3}
          variant={totals.margin > 0 ? "success" : "error"}
        />
        <KpiCard
          title="Margin %"
          value={`${totals.marginPct.toFixed(1)}%`}
          icon={Percent}
          variant={totals.marginPct > 10 ? "success" : "warning"}
        />
      </StatRow>

      {/* Margin Waterfall + Stacked Cost Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="Margin Waterfall"
          subtitle="How customer revenue flows to net margin"
        >
          <WaterfallChart
            data={waterfallData}
            valueFormatter={(v) => `$${Math.abs(v).toLocaleString()}`}
          />
        </ChartContainer>

        <ChartContainer
          title="MPS Cost Composition"
          subtitle="Monthly cost breakdown by category"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyCostStack}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-default)"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value) => [
                  `$${Number(value).toLocaleString()}`,
                  "",
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {costStackCategories.map((cat, idx) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="cost"
                  fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                  radius={
                    idx === costStackCategories.length - 1
                      ? [4, 4, 0, 0]
                      : undefined
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Margin by Component */}
      <ChartContainer
        title="Margin by Cost Component"
        subtitle="Which fee categories generate the most margin"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={marginByComponent}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-default)"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value) => [
                `$${Number(value).toLocaleString()}`,
                "",
              ]}
            />
            <Bar
              dataKey="mpsMargin"
              name="Margin"
              radius={[4, 4, 0, 0]}
            >
              {marginByComponent.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.mpsMargin >= 0
                      ? CATEGORY_COLORS[1]
                      : CATEGORY_COLORS[3]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Margin Heatmap: Site × Waste Type */}
      <Card>
        <CardHeader>
          <CardTitle>Margin Heatmap — Site x Waste Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="pb-2 pr-3 text-left font-medium text-text-muted sticky left-0 bg-bg-card min-w-[120px]">
                    Waste Type
                  </th>
                  {heatmapData.sites.map((site) => (
                    <th
                      key={site}
                      className="pb-2 px-1 text-center font-medium text-text-muted min-w-[80px]"
                    >
                      {site}
                    </th>
                  ))}
                  <th className="pb-2 pl-3 text-right font-medium text-text-primary min-w-[80px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.rows.map((row) => (
                  <tr
                    key={row.waste as string}
                    className="border-b border-border-default last:border-0"
                  >
                    <td className="py-1.5 pr-3 text-text-primary font-medium sticky left-0 bg-bg-card">
                      {row.waste as string}
                    </td>
                    {heatmapData.sites.map((site) => (
                      <td key={site} className="py-1.5 px-1">
                        <HeatmapCell
                          value={row[site] as number}
                          min={heatmapData.min}
                          max={heatmapData.max}
                        />
                      </td>
                    ))}
                    <td className="py-1.5 pl-3 text-right font-semibold tabular-nums text-text-primary">
                      <Badge
                        variant={
                          (row._total as number) >= 0 ? "success" : "error"
                        }
                      >
                        ${Math.abs(row._total as number).toLocaleString()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cost Efficiency Quadrant */}
      <ChartContainer
        title="Cost Efficiency Quadrant"
        subtitle="Cost per lb vs. shipment weight — bottom-right = most efficient"
        height={350}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-default)"
            />
            <XAxis
              dataKey="x"
              type="number"
              name="Cost/lb"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickFormatter={(v) => `$${v}`}
              label={{
                value: "Cost per lb ($)",
                position: "insideBottom",
                offset: -10,
                fontSize: 11,
                fill: "var(--color-text-muted)",
              }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name="Weight"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              label={{
                value: "Weight (lbs)",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                fontSize: 11,
                fill: "var(--color-text-muted)",
              }}
            />
            <ZAxis range={[40, 40]} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value, name) => {
                if (name === "Cost/lb") return [`$${value}`, "Cost/lb"];
                if (name === "Weight")
                  return [`${Number(value).toLocaleString()} lbs`, "Weight"];
                return [value, name];
              }}
              labelFormatter={(_, payload) => {
                if (payload?.[0]?.payload?.label) return payload[0].payload.label;
                return "";
              }}
            />
            <Scatter data={efficiencyData}>
              {efficiencyData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={categoryColorMap[entry.category] ?? CATEGORY_COLORS[0]}
                  fillOpacity={0.7}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Rebate Analysis */}
      {rebateData.length > 0 && (
        <ChartContainer
          title="Rebate Analysis"
          subtitle="Rebate amounts by waste type — bubble size = volume"
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-default)"
              />
              <XAxis
                dataKey="x"
                type="number"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                tickFormatter={(_, idx) => rebateData[idx]?.name ?? ""}
                label={{
                  value: "Waste Type",
                  position: "insideBottom",
                  offset: -10,
                  fontSize: 11,
                  fill: "var(--color-text-muted)",
                }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name="Rebate"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <ZAxis
                dataKey="z"
                range={[100, 1000]}
                name="Volume"
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value, name) => {
                  if (name === "Rebate")
                    return [`$${Number(value).toLocaleString()}`, "Rebate"];
                  if (name === "Volume")
                    return [
                      `${Number(value).toLocaleString()} lbs`,
                      "Volume",
                    ];
                  return [value, name];
                }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.name ?? ""
                }
              />
              <Scatter data={rebateData} fill={CATEGORY_COLORS[4]}>
                {rebateData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    fillOpacity={0.75}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
