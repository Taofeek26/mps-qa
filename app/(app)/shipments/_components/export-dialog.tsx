"use client";

import * as React from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ColumnPicker, type ColumnPickerColumn } from "@/components/ui/column-picker";
import { ProgressBar } from "@/components/ui/progress-bar";
import { toast } from "@/components/ui/toast";
import type { Shipment, ShipmentFilters } from "@/lib/types";

const ALL_EXPORT_COLUMNS: ColumnPickerColumn[] = [
  { id: "shipmentDate", label: "Date", visible: true },
  { id: "siteName", label: "Site", visible: true },
  { id: "clientName", label: "Client", visible: true },
  { id: "vendorName", label: "Vendor", visible: true },
  { id: "wasteTypeName", label: "Waste Type", visible: true },
  { id: "weightValue", label: "Weight", visible: true },
  { id: "weightUnit", label: "Weight Unit", visible: true },
  { id: "volumeValue", label: "Volume", visible: false },
  { id: "notes", label: "Notes", visible: true },
  { id: "status", label: "Status", visible: true },
  { id: "id", label: "Shipment ID", visible: false },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Shipment[];
  filters: ShipmentFilters;
  totalCount: number;
}

export function ExportDialog({
  open,
  onOpenChange,
  data,
  filters,
  totalCount,
}: ExportDialogProps) {
  const [columns, setColumns] = React.useState(ALL_EXPORT_COLUMNS);
  const [format, setFormat] = React.useState<"csv" | "xlsx">("csv");
  const [exporting, setExporting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  function handleColumnChange(id: string, visible: boolean) {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible } : c))
    );
  }

  function handleSelectAll() {
    setColumns((prev) => prev.map((c) => ({ ...c, visible: true })));
  }

  function handleReset() {
    setColumns(ALL_EXPORT_COLUMNS);
  }

  function handleExport() {
    setExporting(true);
    setProgress(0);

    /* Simulate export progress */
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);

      /* Generate CSV */
      const visibleCols = columns.filter((c) => c.visible);
      const header = visibleCols.map((c) => c.label).join(",");
      const rows = data.map((row) =>
        visibleCols
          .map((col) => {
            const val = row[col.id as keyof Shipment];
            const str = val == null ? "" : String(val);
            return str.includes(",") ? `"${str}"` : str;
          })
          .join(",")
      );
      const csv = [header, ...rows].join("\n");

      /* Trigger download */
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shipments-export.${format}`;
      link.click();
      URL.revokeObjectURL(url);

      setExporting(false);
      setProgress(0);
      onOpenChange(false);

      toast.success("Export complete", {
        description: `${data.length} shipments exported as ${format.toUpperCase()}`,
      });
    }, 1500);
  }

  /* Count active filters for summary */
  const activeFilterCount = [
    filters.dateFrom || filters.dateTo,
    filters.siteIds?.length,
    filters.clientIds?.length,
    filters.vendorIds?.length,
    filters.wasteTypeIds?.length,
    filters.status,
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Shipments</DialogTitle>
          <DialogDescription>
            {activeFilterCount > 0
              ? `Exporting ${totalCount} filtered shipments`
              : `Exporting all ${totalCount} shipments`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Column selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-text-primary">
                Columns ({columns.filter((c) => c.visible).length} selected)
              </p>
              <ColumnPicker
                columns={columns}
                onChange={handleColumnChange}
                onSelectAll={handleSelectAll}
                onReset={handleReset}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {columns
                .filter((c) => c.visible)
                .map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-text-secondary"
                  >
                    {c.label}
                  </span>
                ))}
            </div>
          </div>

          {/* Format selector */}
          <div>
            <p className="text-sm font-medium text-text-primary mb-2">Format</p>
            <RadioGroup
              value={format}
              onValueChange={(val) => setFormat(val as "csv" | "xlsx")}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <RadioGroupItem value="csv" />
                CSV
              </label>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <RadioGroupItem value="xlsx" />
                XLSX
              </label>
            </RadioGroup>
          </div>

          {/* Progress */}
          {exporting && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted">Generating export...</p>
              <ProgressBar value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} loading={exporting}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
