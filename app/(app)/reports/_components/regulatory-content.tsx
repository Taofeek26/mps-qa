"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/ui/kpi-card";
import { DataTable } from "@/components/ui/data-table";
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
  DonutChart,
  ProgressList,
  TOOLTIP_STYLE,
  CHART_COLORS,
} from "@/components/charts";
import {
  exportGMR2,
  exportGEM,
  exportBiennial,
  totalMpsCost,
  totalCustomerCost,
  formatMonthLabel,
  getMonthKey,
} from "@/lib/report-utils";
import type { Shipment } from "@/lib/types";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  DollarSign,
  Receipt,
  Package,
  RotateCcw,
} from "lucide-react";
import { ReportContentLayout } from "./report-content-layout";
import { useReportFilters, REPORT_PRESETS } from "./use-report-filters";
import { useTabPdfExport } from "./use-tab-pdf-export";

/* ─── Helpers ─── */

function fmt(v: number): string {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function categoryVariant(cat: string | undefined): "neutral" | "warning" | "success" {
  if (!cat) return "neutral";
  if (cat === "Hazardous Waste") return "warning";
  return "success";
}

function statusVariant(status: string | undefined): "neutral" | "warning" | "success" {
  if (!status) return "neutral";
  if (status === "pending") return "warning";
  if (status === "submitted") return "success";
  return "neutral";
}

/* ─── Content ─── */


export function RegulatoryContent() {
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

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);

  const [pendingPage, setPendingPage] = React.useState(1);
  const [gemPage, setGemPage] = React.useState(1);
  const [gmr2Page, setGmr2Page] = React.useState(1);

  const filterSummary = [clientId && "Customer filtered", dateRange?.from && "Date range applied"].filter(Boolean).join(" · ") || "All data";
  const { isPdfExporting, handleExportPdf } = useTabPdfExport("regulatory", shipments, filterSummary);

  // Reset pagination when filters change
  React.useEffect(() => {
    setPendingPage(1);
    setGemPage(1);
    setGmr2Page(1);
  }, [shipments]);

  /* ─── Shared computed values ─── */
  const hazShipments = React.useMemo(
    () => shipments.filter((s) => s.wasteCategory === "Hazardous Waste"),
    [shipments]
  );

  /* ─── KPIs ─── */
  const totalManifests = shipments.length;
  const hazSubmitted = hazShipments.filter((s) => s.status === "submitted").length;
  const manifestRate = hazShipments.length > 0 ? (hazSubmitted / hazShipments.length) * 100 : 100;
  const pendingCount = shipments.filter((s) => s.status === "pending").length;
  const rcraCount = hazShipments.length;

  /* Donut: Manifest Completion (haz only) */
  const manifestDonutData = React.useMemo(() => {
    const submitted = hazShipments.filter((s) => s.status === "submitted").length;
    const pending = hazShipments.length - submitted;
    return [
      { name: "Submitted", value: submitted, color: CHART_COLORS.success },
      { name: "Pending", value: pending, color: CHART_COLORS.error },
    ];
  }, [hazShipments]);

  /* RCRA Generator Status by Site */
  const rcraStatusBySite = React.useMemo(() => {
    const months = new Set(shipments.map((s) => s.shipmentDate.slice(0, 7))).size || 1;
    const bySite = new Map<string, { hazLbs: number }>();
    shipments.forEach((s) => {
      if (s.wasteCategory !== "Hazardous Waste") return;
      const existing = bySite.get(s.siteName) ?? { hazLbs: 0 };
      existing.hazLbs += s.weightValue;
      bySite.set(s.siteName, existing);
    });
    return Array.from(bySite.entries())
      .map(([name, d]) => {
        const kgPerMonth = (d.hazLbs * 0.4536) / months;
        const status = kgPerMonth > 1000 ? "LQG" : kgPerMonth > 100 ? "SQG" : "VSQG";
        const color =
          status === "LQG"
            ? "var(--color-error-500)"
            : status === "SQG"
              ? "var(--color-warning-500)"
              : "var(--color-success-500)";
        return {
          label: name,
          value: kgPerMonth,
          displayValue: `${status} (${kgPerMonth.toFixed(0)} kg/mo)`,
          secondary: "Threshold: VSQG <100kg \u00b7 SQG <1,000kg \u00b7 LQG >1,000kg",
          color,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [shipments]);

  /* Turnaround by Transporter */
  const turnaroundByTransporter = React.useMemo(() => {
    const byTransporter = new Map<string, { totalDays: number; count: number }>();
    shipments.forEach((s) => {
      if (!s.returnManifestDate || !s.transporterName) return;
      const ship = new Date(s.shipmentDate + "T00:00:00");
      const ret = new Date(s.returnManifestDate + "T00:00:00");
      const days = (ret.getTime() - ship.getTime()) / 86400000;
      if (days < 0 || days > 90) return;
      const existing = byTransporter.get(s.transporterName) ?? { totalDays: 0, count: 0 };
      existing.totalDays += days;
      existing.count += 1;
      byTransporter.set(s.transporterName, existing);
    });
    return Array.from(byTransporter.entries())
      .map(([name, d]) => ({
        label: name,
        value: d.count > 0 ? d.totalDays / d.count : 0,
        displayValue: `${(d.count > 0 ? d.totalDays / d.count : 0).toFixed(1)} days avg`,
        secondary: `${d.count} shipments`,
      }))
      .sort((a, b) => a.value - b.value);
  }, [shipments]);

  /* Vendor Compliance */
  const vendorCompliance = React.useMemo(() => {
    const byTransporter = new Map<string, number>();
    shipments.forEach((s) => {
      if (!s.transporterName) return;
      byTransporter.set(s.transporterName, (byTransporter.get(s.transporterName) ?? 0) + 1);
    });
    return Array.from(byTransporter.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [shipments]);

  /* Pending manifests */
  const pendingShipments = React.useMemo(
    () => shipments.filter((s) => s.status === "pending"),
    [shipments]
  );

  /* ─── GEM Report (Ford) ─── */
  const gemTotalRevenue = React.useMemo(
    () => shipments.reduce((acc, s) => acc + totalCustomerCost(s), 0),
    [shipments]
  );
  const gemTotalMpsCost = React.useMemo(
    () => shipments.reduce((acc, s) => acc + totalMpsCost(s), 0),
    [shipments]
  );

  /* ─── GMR2 Report (GM) ─── */
  const nonHazCount = React.useMemo(
    () => shipments.filter((s) => s.wasteCategory !== "Hazardous Waste").length,
    [shipments]
  );
  const hazCount = hazShipments.length;

  /* Treatment Type Revenue */
  const treatmentRevenue = React.useMemo(() => {
    const byMethod = new Map<string, number>();
    shipments.forEach((s) => {
      const method = s.treatmentMethod ?? "Other";
      byMethod.set(method, (byMethod.get(method) ?? 0) + totalCustomerCost(s));
    });
    return Array.from(byMethod.entries())
      .map(([method, revenue]) => ({ method, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [shipments]);

  /* Monthly Tonnage Trend */
  const monthlyTonnage = React.useMemo(() => {
    const byMonth = new Map<string, number>();
    shipments.forEach((s) => {
      const key = getMonthKey(s.shipmentDate);
      byMonth.set(key, (byMonth.get(key) ?? 0) + s.weightValue / 2000);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, tons]) => ({ month: formatMonthLabel(key), tons: Math.round(tons * 100) / 100 }));
  }, [shipments]);

  /* ─── Column Definitions ─── */

  const pendingColumns: ColumnDef<Shipment, unknown>[] = React.useMemo(
    () => [
      { accessorKey: "manifestNumber", header: "Manifest #", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "siteName", header: "Site" },
      { accessorKey: "wasteTypeName", header: "Waste Type" },
      {
        accessorKey: "wasteCategory",
        header: "Category",
        cell: ({ getValue }) => {
          const val = getValue() as string | undefined;
          return <Badge variant={categoryVariant(val)}>{val ?? "N/A"}</Badge>;
        },
      },
      { accessorKey: "transporterName", header: "Transporter", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "receivingFacility", header: "Facility", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "weightValue", header: "Weight", cell: ({ getValue }) => (getValue() as number).toLocaleString() },
      { accessorKey: "weightUnit", header: "Unit" },
      {
        id: "cost",
        header: "Cost",
        cell: ({ row }) => fmt(totalCustomerCost(row.original)),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return <Badge variant={statusVariant(val)}>{val}</Badge>;
        },
      },
    ],
    []
  );

  const gemColumns: ColumnDef<Shipment, unknown>[] = React.useMemo(
    () => [
      { accessorKey: "manifestNumber", header: "Manifest #", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "siteName", header: "Site" },
      { accessorKey: "wasteTypeName", header: "Waste Type" },
      {
        accessorKey: "wasteCategory",
        header: "Category",
        cell: ({ getValue }) => {
          const val = getValue() as string | undefined;
          return <Badge variant={categoryVariant(val)}>{val ?? "N/A"}</Badge>;
        },
      },
      { accessorKey: "sourceCode", header: "Source Code", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "formCode", header: "Form Code", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "treatmentCode", header: "Treatment Code", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "transporterName", header: "Transporter", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "receivingFacility", header: "Receiving Facility", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "weightValue", header: "Weight", cell: ({ getValue }) => (getValue() as number).toLocaleString() },
      { accessorKey: "weightUnit", header: "Unit" },
      { id: "mpsCost", header: "MPS Cost", cell: ({ row }) => fmt(totalMpsCost(row.original)) },
      { id: "customerCost", header: "Customer Cost", cell: ({ row }) => fmt(totalCustomerCost(row.original)) },
      { id: "rebate", header: "Rebate", cell: ({ row }) => fmt(row.original.customerCost?.rebate ?? 0) },
    ],
    []
  );

  const gmr2Columns: ColumnDef<Shipment, unknown>[] = React.useMemo(
    () => [
      { accessorKey: "manifestNumber", header: "Manifest #", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "siteName", header: "Site" },
      { accessorKey: "wasteTypeName", header: "Waste Type" },
      { accessorKey: "plantId", header: "Plant ID", cell: ({ getValue }) => getValue() ?? "550781" },
      { accessorKey: "formCode", header: "Form Code", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "treatmentCode", header: "Treatment Code", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "transporterName", header: "Transporter", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "receivingFacility", header: "Facility", cell: ({ getValue }) => getValue() ?? "\u2014" },
      { accessorKey: "weightValue", header: "Weight", cell: ({ getValue }) => (getValue() as number).toLocaleString() },
      { accessorKey: "weightUnit", header: "Unit" },
      { id: "mpsCost", header: "MPS Cost", cell: ({ row }) => fmt(totalMpsCost(row.original)) },
      { id: "customerCost", header: "Customer Cost", cell: ({ row }) => fmt(totalCustomerCost(row.original)) },
    ],
    []
  );

  return (
    <ReportContentLayout
      kpiCards={
        <>
          <KpiCard
            title="Total Manifests"
            value={totalManifests.toLocaleString()}
            icon={FileText}
          />
          <KpiCard
            title="Manifest Rate"
            value={`${manifestRate.toFixed(1)}%`}
            icon={CheckCircle2}
            variant={manifestRate < 90 ? "warning" : "success"}
          />
          <KpiCard
            title="Pending"
            value={pendingCount.toLocaleString()}
            icon={Clock}
            variant={pendingCount > 0 ? "warning" : "default"}
          />
          <KpiCard
            title="RCRA Regulated"
            value={rcraCount.toLocaleString()}
            icon={AlertTriangle}
          />
        </>
      }
      onExportPdf={handleExportPdf}
      isPdfExporting={isPdfExporting}
      onResetFilters={resetFilters}
      hasFilters={hasFilters}
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
    >
      <PillTabs defaultValue="compliance">
        <PillTabsList>
          <PillTabsTrigger value="compliance">Regulatory Compliance</PillTabsTrigger>
          <PillTabsTrigger value="gem">GEM Report (Ford)</PillTabsTrigger>
          <PillTabsTrigger value="gmr2">GMR2 Report (GM)</PillTabsTrigger>
        </PillTabsList>

        {/* Regulatory Compliance */}
        <PillTabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartContainer
              title="Manifest Completion"
              subtitle="Hazardous shipments: submitted vs pending"
              chartClassName="h-[250px] lg:h-[280px]"
            >
              <DonutChart data={manifestDonutData} />
            </ChartContainer>

            <ChartContainer
              title="RCRA Generator Status by Site"
              subtitle="Hazardous waste kg/month with LQG/SQG/VSQG classification"
              chartClassName="h-[250px] lg:h-[280px] overflow-y-auto"
            >
              <ProgressList items={rcraStatusBySite} />
            </ChartContainer>

            <ChartContainer
              title="Turnaround by Transporter"
              subtitle="Avg days from shipment to manifest return"
              chartClassName="h-[250px] lg:h-[280px] overflow-y-auto"
            >
              <ProgressList items={turnaroundByTransporter} />
            </ChartContainer>

            <ChartContainer
              title="Vendor Compliance"
              subtitle="Transporter trip counts and status"
              chartClassName="h-[250px] lg:h-[280px] overflow-y-auto"
            >
              <div className="space-y-2">
                {vendorCompliance.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-4">No data available</p>
                )}
                {vendorCompliance.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-border-default px-3 py-2"
                  >
                    <span className="text-xs font-semibold text-text-primary truncate">
                      {v.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-text-muted font-mono">
                        {v.count} trips
                      </span>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ChartContainer>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Pending Manifests Detail
              </h3>
              <div ref={tableRef}>
              <DataTable
                columns={pendingColumns}
                data={pendingShipments.slice((pendingPage - 1) * pageSize, pendingPage * pageSize)}
                pagination={{ page: pendingPage, pageSize: pageSize, total: pendingShipments.length }}
                onPaginationChange={setPendingPage}
                emptyState={
                  <div className="flex items-center justify-center h-full text-sm text-text-muted">
                    No pending manifests found
                  </div>
                }
              />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => exportBiennial(shipments)}>
              <Download className="h-4 w-4" />
              Export Biennial CSV
            </Button>
            <Button variant="secondary" onClick={() => exportGEM(shipments)}>
              <Download className="h-4 w-4" />
              Export GEM CSV
            </Button>
            <Button variant="secondary" onClick={() => exportGMR2(shipments)}>
              <Download className="h-4 w-4" />
              Export GMR2 CSV
            </Button>
          </div>
        </PillTabsContent>

        {/* GEM Report (Ford) */}
        <PillTabsContent value="gem" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="GEM Records"
              value={shipments.length.toLocaleString()}
              icon={FileText}
            />
            <KpiCard
              title="Total Revenue"
              value={fmt(gemTotalRevenue)}
              icon={DollarSign}
              variant="success"
            />
            <KpiCard
              title="Total MPS Cost"
              value={fmt(gemTotalMpsCost)}
              icon={Receipt}
            />
          </div>

          <DataTable
            columns={gemColumns}
            data={shipments.slice((gemPage - 1) * pageSize, gemPage * pageSize)}
            pagination={{ page: gemPage, pageSize: pageSize, total: shipments.length }}
            onPaginationChange={setGemPage}
            emptyState={
              <div className="flex items-center justify-center h-full text-sm text-text-muted">
                No GEM records found
              </div>
            }
          />

          <div>
            <Button variant="secondary" onClick={() => exportGEM(shipments)}>
              <Download className="h-4 w-4" />
              Export GEM CSV
            </Button>
          </div>
        </PillTabsContent>

        {/* GMR2 Report (GM) */}
        <PillTabsContent value="gmr2" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="GMR2 Records"
              value={shipments.length.toLocaleString()}
              icon={FileText}
            />
            <KpiCard
              title="Non-Haz Count"
              value={nonHazCount.toLocaleString()}
              icon={Package}
              variant="success"
            />
            <KpiCard
              title="Hazardous Count"
              value={hazCount.toLocaleString()}
              icon={AlertTriangle}
              variant={hazCount > 0 ? "warning" : "default"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartContainer
              title="Treatment Type Revenue"
              subtitle="Revenue by treatment method"
              chartClassName="h-[280px] lg:h-[320px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={treatmentRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis dataKey="method" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [fmt(value as number), "Revenue"]} />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Monthly Tonnage Trend"
              subtitle="Total tons (lbs / 2,000) per month"
              chartClassName="h-[280px] lg:h-[320px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTonnage} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} tickFormatter={(value) => `${value}t`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${(value as number).toFixed(2)} tons`, "Tonnage"]} />
                  <Area type="monotone" dataKey="tons" stroke={CHART_COLORS.teal} fill={CHART_COLORS.tealLight} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <DataTable
            columns={gmr2Columns}
            data={shipments.slice((gmr2Page - 1) * pageSize, gmr2Page * pageSize)}
            pagination={{ page: gmr2Page, pageSize: pageSize, total: shipments.length }}
            onPaginationChange={setGmr2Page}
            emptyState={
              <div className="flex items-center justify-center h-full text-sm text-text-muted">
                No GMR2 records found
              </div>
            }
          />

          <div>
            <Button variant="secondary" onClick={() => exportGMR2(shipments)}>
              <Download className="h-4 w-4" />
              Export GMR2 CSV
            </Button>
          </div>
        </PillTabsContent>
      </PillTabs>
    </ReportContentLayout>
  );
}
