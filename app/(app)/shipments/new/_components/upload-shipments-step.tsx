"use client";

import * as React from "react";
import { read, utils } from "xlsx";
import { FileUp, FileSpreadsheet, ArrowLeft, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ShipmentEntryRow } from "@/lib/types";
import { createEmptyRow } from "./new-shipment-grid";

/** Same label used everywhere when returning to the entry-option selection. */
export const BACK_TO_ENTRY_OPTIONS_LABEL = "Back to entry options";

const HEADER_MAP: Record<string, keyof ShipmentEntryRow> = {
  Site: "siteId",
  Client: "clientId",
  Vendor: "vendorId",
  "Waste Type": "wasteTypeId",
  Date: "shipmentDate",
  Weight: "weightValue",
  Unit: "weightUnit",
  Volume: "volumeValue",
  Notes: "notes",
};

interface UploadShipmentsStepProps {
  onImported: (rows: ShipmentEntryRow[]) => void;
  onBack: () => void;
  parseError?: string;
  className?: string;
}

export function UploadShipmentsStep({
  onImported,
  onBack,
  parseError,
  className,
}: UploadShipmentsStepProps) {
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(parseError ?? null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function parseFile(file: File): void {
    setError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setError("The file has no sheets.");
          return;
        }
        const rawRows = utils.sheet_to_json<Record<string, unknown>>(
          workbook.Sheets[sheetName]
        );
        if (rawRows.length === 0) {
          setError("No data rows found in the first sheet.");
          return;
        }
        const mapped: ShipmentEntryRow[] = rawRows.map((raw) => {
          const row = createEmptyRow();
          for (const [header, field] of Object.entries(HEADER_MAP)) {
            const val = raw[header];
            if (val == null || val === "") continue;
            if (field === "weightValue" || field === "volumeValue") {
              const num = typeof val === "number" ? val : parseFloat(String(val));
              (row as Record<string, unknown>)[field] = isNaN(num) ? null : num;
            } else {
              (row as Record<string, unknown>)[field] = String(val).trim();
            }
          }
          return row;
        });
        onImported(mapped);
      } catch {
        setError("Could not parse the file. Use Excel (.xlsx) or CSV with headers: Site, Client, Vendor, Waste Type, Date, Weight, Unit, Volume, Notes.");
      }
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsArrayBuffer(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      parseFile(file);
    } else {
      setError("Please use an Excel (.xlsx, .xls) or CSV file.");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  }

  function downloadDemoFile() {
    const headers = "Site,Client,Vendor,Waste Type,Date,Weight,Unit,Volume,Notes";
    const rows = [
      "Main Site,Acme Corp,Waste Solutions Inc,Non Haz,2025-03-01,1200,lbs,,Demo shipment 1",
      "Warehouse B,Acme Corp,Green Disposal,Recycling,2025-03-02,500,tons,,Demo shipment 2",
      "Main Site,Acme Corp,Waste Solutions Inc,C&D,2025-03-03,800,lbs,,Demo shipment 3",
    ];
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shipments-demo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className={cn(
        "flex w-full min-h-[calc(100vh-280px)] flex-col rounded-xl border border-border-default bg-bg-card shadow-sm p-8 sm:p-10",
        className
      )}
    >
      <div className="flex w-full flex-1 flex-col">
        <div className="flex items-center gap-2.5 text-text-secondary mb-1">
          <FileSpreadsheet className="h-5 w-5 text-primary-500" />
          <span className="text-sm font-medium">Excel (.xlsx, .xls) or CSV</span>
        </div>
        <p className="text-sm text-text-muted mb-4 leading-relaxed">
          Use a first row of headers. We map: Site, Client, Vendor, Waste Type, Date, Weight, Unit, Volume, Notes.
        </p>

        <button
          type="button"
          onClick={downloadDemoFile}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-lg border border-border-default bg-bg-card px-3 py-2 text-sm font-medium text-text-secondary shadow-sm hover:bg-bg-subtle hover:text-text-primary transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Download sample file (CSV)
        </button>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200",
            dragging
              ? "border-primary-400 bg-primary-50/50 ring-2 ring-primary-200"
              : "border-border-default bg-bg-subtle/50 hover:border-primary-300 hover:bg-primary-50/30",
            error && "border-error-400 bg-error-50/40"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-600 mb-4">
            <FileUp className="h-7 w-7" strokeWidth={2} />
          </span>
          <p className="text-base font-medium text-text-primary">
            Drop your file here or click to browse
          </p>
          <p className="text-sm text-text-muted mt-1">
            We’ll show a preview so you can review and submit.
          </p>
        </div>

        {error && (
          <p className="mt-4 text-sm text-error-600" role="alert">
            {error}
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mt-8 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          {BACK_TO_ENTRY_OPTIONS_LABEL}
        </Button>
      </div>
    </div>
  );
}
