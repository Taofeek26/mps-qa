"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllShipments, getClients } from "@/lib/mock-data";
import { exportGMR2, exportGEM, exportBiennial } from "@/lib/report-utils";
import { FileOutput, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

export default function RegulatoryPage() {
  const clients = React.useMemo(() => getClients(), []);
  const [clientId, setClientId] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("2024-07-01");
  const [dateTo, setDateTo] = React.useState("2025-02-28");
  const [previewReport, setPreviewReport] = React.useState<string | null>(null);

  const shipments = React.useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (clientId) filters.clientIds = [clientId];
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    return getAllShipments(filters as never);
  }, [clientId, dateFrom, dateTo]);

  const hazShipments = shipments.filter((s) => s.wasteCategory === "Hazardous Waste");
  const gmShipments = shipments.filter((s) => s.plantId || s.managementMethod);

  const reports = [
    {
      id: "biennial",
      title: "Biennial Hazardous Waste Report",
      description: "EPA-required biennial report for hazardous waste generators. Filters for hazardous waste only and formats per EPA specifications.",
      format: "CSV",
      records: hazShipments.length,
      onExport: () => exportBiennial(shipments),
      available: hazShipments.length > 0,
    },
    {
      id: "gem",
      title: "GEM Report (Ford)",
      description: "Ford-specific waste report format. Includes waste codes, treatment methods, receiving facility information, and transporter details.",
      format: "CSV",
      records: shipments.length,
      onExport: () => exportGEM(shipments),
      available: shipments.length > 0,
    },
    {
      id: "gmr2",
      title: "GMR2 Report (GM)",
      description: "General Motors waste transaction data format. Maps to GM template with Plant ID, Management Method, TRI Waste Codes, and Disposal Location Codes.",
      format: "CSV",
      records: gmShipments.length,
      onExport: () => exportGMR2(gmShipments.length > 0 ? gmShipments : shipments),
      available: shipments.length > 0,
    },
  ];

  /* Preview data for selected report */
  const previewData = React.useMemo(() => {
    if (!previewReport) return null;
    const sample = previewReport === "biennial" ? hazShipments.slice(0, 5)
      : previewReport === "gmr2" ? (gmShipments.length > 0 ? gmShipments : shipments).slice(0, 5)
      : shipments.slice(0, 5);

    if (previewReport === "biennial") {
      return {
        headers: ["Date", "Waste Name", "Waste Codes", "Source Code", "Form Code", "Qty (lbs)", "Treatment"],
        rows: sample.map((s) => [
          s.shipmentDate, s.wasteTypeName, s.wasteCodes ?? "N/A", s.sourceCode ?? "N/A",
          s.formCode ?? "N/A", s.weightValue.toLocaleString(), s.treatmentMethod ?? "N/A",
        ]),
      };
    }
    if (previewReport === "gmr2") {
      return {
        headers: ["Plant ID", "Date", "Waste Name", "Qty", "Mgmt Method", "TRI Code", "Disposal Location"],
        rows: sample.map((s) => [
          s.plantId ?? "550781", s.shipmentDate, s.wasteTypeName, s.weightValue.toLocaleString(),
          s.managementMethod ?? "N/A", s.triWasteCode ?? "N/A", s.receivingEpaId ?? "N/A",
        ]),
      };
    }
    return {
      headers: ["Date", "Waste Name", "Category", "Qty (lbs)", "Facility", "Transporter", "Manifest"],
      rows: sample.map((s) => [
        s.shipmentDate, s.wasteTypeName, s.wasteCategory ?? "N/A", s.weightValue.toLocaleString(),
        s.receivingFacility ?? "N/A", s.transporterName ?? "N/A", s.manifestNumber ?? "N/A",
      ]),
    };
  }, [previewReport, hazShipments, gmShipments, shipments]);

  return (
    <div className="space-y-6">
      <PageHeader title="Regulatory Exports" subtitle="Generate compliance reports in required formats" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={clientId || "all"} onValueChange={(val) => setClientId(val === "all" ? "" : val)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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

      {/* Report Cards */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-50 text-primary-400">
                <FileOutput className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text-primary">{report.title}</h3>
                <p className="text-xs text-text-muted mt-1">{report.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="neutral">{report.format}</Badge>
                  <span className="text-xs text-text-muted">{report.records} records</span>
                  {report.available ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success-600">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-warning-500">
                      <AlertTriangle className="h-3 w-3" /> No matching data
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => setPreviewReport(previewReport === report.id ? null : report.id)}
                >
                  {previewReport === report.id ? "Hide Preview" : "Preview"}
                </Button>
                <Button
                  onClick={report.onExport}
                  disabled={!report.available}
                >
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </CardContent>

            {/* Preview table */}
            {previewReport === report.id && previewData && (
              <div className="border-t border-border-default px-6 pb-5">
                <p className="text-xs text-text-muted py-3">Preview (first 5 records)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-default">
                        {previewData.headers.map((h) => (
                          <th key={h} className="pb-2 pr-4 font-medium text-text-muted text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row, i) => (
                        <tr key={i} className="border-b border-border-default last:border-0">
                          {row.map((cell, j) => (
                            <td key={j} className="py-2 pr-4 text-text-primary">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
