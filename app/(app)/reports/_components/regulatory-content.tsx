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
  ReferenceLine,
  Cell,
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
  daysBetween,
} from "@/lib/report-utils";
import { useSafetyIncidents, useInspectionRecords } from "@/lib/hooks/use-api-data";
import { SAFETY_TRAINING_DATA } from "@/lib/mock-kpi-data";
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
  Timer,
  ShieldAlert,
  HardHat,
  Search,
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

  const { safetyIncidents } = useSafetyIncidents();
  const { inspectionRecords } = useInspectionRecords();

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

  /* New: Manifest Turnaround + Cycle Time */
  const avgTurnaround = React.useMemo(() => {
    const withReturn = shipments.filter((s) => s.returnManifestDate && s.shipmentDate);
    if (withReturn.length === 0) return 0;
    const total = withReturn.reduce((sum, s) => sum + daysBetween(s.shipmentDate, s.returnManifestDate!), 0);
    return Math.round((total / withReturn.length) * 10) / 10;
  }, [shipments]);

  const avgCycleTime = React.useMemo(() => {
    const withCompleted = shipments.filter((s) => s.completedDate && s.shipmentDate);
    if (withCompleted.length === 0) return 0;
    const total = withCompleted.reduce((sum, s) => sum + daysBetween(s.shipmentDate, s.completedDate!), 0);
    return Math.round((total / withCompleted.length) * 10) / 10;
  }, [shipments]);

  /* New: HazMat Reporting Accuracy — % of haz shipments with complete waste codes */
  const hazmatAccuracy = React.useMemo(() => {
    if (hazShipments.length === 0) return 100;
    const complete = hazShipments.filter((s) => s.wasteCodes && s.sourceCode && s.formCode && s.treatmentCode).length;
    return Math.round((complete / hazShipments.length) * 100);
  }, [hazShipments]);

  /* New: Safety KPIs */
  const totalIncidents = safetyIncidents.length;
  const resolvedIncidents = safetyIncidents.filter((i) => i.resolved).length;
  const trir = React.useMemo(() => {
    const hoursWorked = 85 * 2080; // 85 employees * 2080 hours/year
    return Math.round((totalIncidents / hoursWorked) * 200000 * 100) / 100;
  }, [totalIncidents]);

  const inspectionPassRate = React.useMemo(() => {
    if (inspectionRecords.length === 0) return 100;
    const passed = inspectionRecords.filter((i) => i.passed).length;
    return Math.round((passed / inspectionRecords.length) * 100);
  }, [inspectionRecords]);

  const totalFindings = React.useMemo(
    () => inspectionRecords.reduce((sum, i) => sum + i.findings, 0),
    [inspectionRecords]
  );

  /* Safety incidents by type */
  const incidentsByType = React.useMemo(() => {
    const byType = new Map<string, number>();
    safetyIncidents.forEach((i) => {
      byType.set(i.type, (byType.get(i.type) ?? 0) + 1);
    });
    const colors = [CHART_COLORS.primary, CHART_COLORS.error, CHART_COLORS.warning, CHART_COLORS.teal, CHART_COLORS.muted];
    return Array.from(byType.entries()).map(([name, value], idx) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[idx % colors.length],
    }));
  }, [safetyIncidents]);

  /* Safety incidents by month */
  const incidentsByMonth = React.useMemo(() => {
    const byMonth = new Map<string, number>();
    safetyIncidents.forEach((i) => {
      const key = getMonthKey(i.date);
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ month: formatMonthLabel(key), incidents: count }));
  }, [safetyIncidents]);

  /* Inspection pass rate by site */
  const inspectionBySite = React.useMemo(() => {
    const bySite = new Map<string, { passed: number; total: number }>();
    inspectionRecords.forEach((i) => {
      const existing = bySite.get(i.siteName) ?? { passed: 0, total: 0 };
      if (i.passed) existing.passed++;
      existing.total++;
      bySite.set(i.siteName, existing);
    });
    return Array.from(bySite.entries())
      .map(([name, d]) => ({
        label: name,
        value: d.total > 0 ? (d.passed / d.total) * 100 : 0,
        displayValue: `${Math.round(d.total > 0 ? (d.passed / d.total) * 100 : 0)}% pass`,
        secondary: `${d.total} inspections, ${d.total - d.passed} failures`,
      }))
      .sort((a, b) => a.value - b.value);
  }, [inspectionRecords]);

  /* Training completion */
  const trainingData = SAFETY_TRAINING_DATA;

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
            title="Manifest Turnaround"
            value={`${avgTurnaround}d`}
            subtitle="Avg days to return"
            icon={Timer}
          />
          <KpiCard
            title="Cycle Time"
            value={`${avgCycleTime}d`}
            subtitle="Ship → complete"
            icon={Clock}
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
          <PillTabsTrigger value="metrics">Compliance Metrics</PillTabsTrigger>
          <PillTabsTrigger value="safety">Safety</PillTabsTrigger>
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
              subtitle="Hazardous waste kg/month — LQG >1,000 · SQG 100–1,000 · VSQG <100"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={rcraStatusBySite.map((d) => ({
                    name: d.label,
                    kgPerMonth: Math.round(d.value),
                    status: d.value > 1000 ? "LQG" : d.value > 100 ? "SQG" : "VSQG",
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${v} kg`} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={100} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <ReferenceLine x={1000} stroke="var(--color-error-400)" strokeDasharray="3 3" label={{ value: "LQG", fontSize: 9, fill: "var(--color-error-400)", position: "top" }} />
                  <ReferenceLine x={100} stroke="var(--color-warning-400)" strokeDasharray="3 3" label={{ value: "SQG", fontSize: 9, fill: "var(--color-warning-400)", position: "top" }} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value, _name, props) => [`${value} kg/mo (${(props.payload as { status: string }).status})`, "Haz Waste"]} />
                  <Bar dataKey="kgPerMonth" name="kg/month" radius={[0, 4, 4, 0]}>
                    {rcraStatusBySite.map((d, i) => (
                      <Cell key={i} fill={d.value > 1000 ? "var(--color-error-400)" : d.value > 100 ? "var(--color-warning-400)" : "var(--color-success-400)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Turnaround by Transporter"
              subtitle="Avg days from shipment to manifest return"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={turnaroundByTransporter.map((d) => ({ name: d.label, days: Math.round(d.value * 10) / 10 }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${v}d`} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={110} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value} days`, "Avg Turnaround"]} />
                  <Bar dataKey="days" name="Avg Days" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Vendor Compliance"
              subtitle="Transporter shipment volume"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={vendorCompliance.map((v) => ({ name: v.name, trips: v.count }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={110} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value} shipments`, "Volume"]} />
                  <Bar dataKey="trips" name="Shipments" fill={CHART_COLORS.teal} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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

        {/* Compliance Metrics */}
        <PillTabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="HazMat Accuracy"
              value={`${hazmatAccuracy}%`}
              subtitle="Haz shipments with complete codes"
              icon={ShieldAlert}
              variant={hazmatAccuracy >= 90 ? "success" : "warning"}
            />
            <KpiCard
              title="Inspection Pass Rate"
              value={`${inspectionPassRate}%`}
              subtitle={`${inspectionRecords.length} inspections`}
              icon={Search}
              variant={inspectionPassRate >= 90 ? "success" : "warning"}
            />
            <KpiCard
              title="Audit Findings"
              value={totalFindings.toLocaleString()}
              subtitle="Total across all inspections"
              icon={AlertTriangle}
              variant={totalFindings === 0 ? "success" : "warning"}
            />
          </div>

          <ChartContainer
            title="Inspection Compliance by Site"
            subtitle="Pass rate per facility — green ≥90%, amber ≥70%, red <70%"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={inspectionBySite.map((d) => ({ name: d.label, passRate: Math.round(d.value) }))}
                layout="vertical"
                margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} width={100} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                <ReferenceLine x={90} stroke="var(--color-success-400)" strokeDasharray="3 3" label={{ value: "90%", fontSize: 9, fill: "var(--color-success-400)", position: "top" }} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value}%`, "Pass Rate"]} />
                <Bar dataKey="passRate" name="Pass Rate" radius={[0, 4, 4, 0]}>
                  {inspectionBySite.map((d, i) => (
                    <Cell key={i} fill={d.value >= 90 ? "var(--color-success-400)" : d.value >= 70 ? "var(--color-warning-400)" : "var(--color-error-400)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </PillTabsContent>

        {/* Safety */}
        <PillTabsContent value="safety" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              title="Total Incidents"
              value={totalIncidents.toLocaleString()}
              subtitle="Last 12 months"
              icon={ShieldAlert}
              variant={totalIncidents === 0 ? "success" : "warning"}
            />
            <KpiCard
              title="TRIR"
              value={trir.toFixed(2)}
              subtitle="Per 200K hours"
              icon={HardHat}
              variant={trir < 2 ? "success" : trir < 4 ? "warning" : "error"}
            />
            <KpiCard
              title="Resolved"
              value={`${totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 100}%`}
              subtitle={`${resolvedIncidents} of ${totalIncidents}`}
              icon={CheckCircle2}
              variant="success"
            />
            <KpiCard
              title="Training Completion"
              value={`${Math.round(
                (Object.values(trainingData.modulesCompleted).reduce((a, b) => a + b, 0) /
                  (Object.keys(trainingData.modulesCompleted).length * trainingData.totalEmployees)) *
                  100
              )}%`}
              subtitle={`${trainingData.totalEmployees} employees`}
              icon={HardHat}
              variant="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartContainer
              title="Incidents by Type"
              subtitle="Breakdown of safety incident categories"
              chartClassName="h-[260px] lg:h-[280px]"
            >
              <DonutChart data={incidentsByType} />
            </ChartContainer>

            <ChartContainer
              title="Incident Trend"
              subtitle="Monthly safety incidents"
              chartClassName="h-[260px] lg:h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentsByMonth} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incidentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-error-400)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-error-400)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={{ stroke: "var(--color-border-default)" }} tickLine={false} allowDecimals={false} width={30} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [`${value}`, "Incidents"]} />
                  <Area type="monotone" dataKey="incidents" name="Incidents" stroke="var(--color-error-400)" fill="url(#incidentGradient)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-error-400)", stroke: "var(--color-bg-card)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <Card>
            <CardContent className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Safety Training Modules
              </h3>
              <div className="space-y-2">
                {Object.entries(trainingData.modulesCompleted).map(([module, completed]) => {
                  const pct = Math.round((completed / trainingData.totalEmployees) * 100);
                  return (
                    <div key={module} className="flex items-center gap-3">
                      <span className="text-xs text-text-primary w-48 truncate shrink-0">{module}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: "var(--color-primary-400)" }}
                        />
                      </div>
                      <span className="text-xs text-text-muted font-mono shrink-0 w-16 text-right">
                        {completed}/{trainingData.totalEmployees}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
                <BarChart data={treatmentRevenue} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
                <AreaChart data={monthlyTonnage} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
