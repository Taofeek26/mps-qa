"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import type { CellError } from "@/components/ui/ag-grid-wrapper";
import { shipmentsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useSites, useClients, useVendors, useWasteTypes } from "@/lib/hooks/use-api-data";
import type { ShipmentEntryRow } from "@/lib/types";
import {
  NewShipmentGrid,
  createEmptyRow,
} from "./_components/new-shipment-grid";
import {
  EntryChoice,
  type EntryMode,
} from "./_components/entry-choice";
import {
  UploadShipmentsStep,
  BACK_TO_ENTRY_OPTIONS_LABEL,
} from "./_components/upload-shipments-step";

function generateRows(count: number): ShipmentEntryRow[] {
  return Array.from({ length: count }, () => createEmptyRow());
}

/** Check if a string looks like a UUID */
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/** Check if a string looks like an ID (UUID or short ID like site-001, vendor-001) */
function isLikelyId(str: string): boolean {
  // Standard UUID
  if (isUUID(str)) return true;
  // Short IDs like site-001, vendor-001, cust-001, wtype-001
  if (/^(site|vendor|cust|wtype|trans|fac)-\d+$/i.test(str)) return true;
  return false;
}

type ViewMode = "choice" | "upload" | "manual";

/* ─────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────── */

/** Page title + back link + step indicator */
function PageHeader({
  viewMode,
  onBack,
}: {
  viewMode: ViewMode;
  onBack: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-text-primary tracking-tight">
            New Shipment Entry
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-text-muted">
            Add one or more waste shipments to the system.
          </p>
        </div>

        {viewMode !== "choice" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{BACK_TO_ENTRY_OPTIONS_LABEL}</span>
          </Button>
        )}
      </div>

      <StepTrack viewMode={viewMode} />
    </div>
  );
}

/** 3-step progress indicator — pill style */
function StepTrack({ viewMode }: { viewMode: ViewMode }) {
  const steps: { key: ViewMode; label: string }[] = [
    { key: "choice", label: "Method" },
    { key: "upload", label: "Upload" },
    { key: "manual", label: "Review & Submit" },
  ];

  const activeIndex =
    viewMode === "choice" ? 0 : viewMode === "upload" ? 1 : 2;

  return (
    <div className="mt-4 sm:mt-6 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-3 rounded-full border border-border-default bg-bg-subtle p-1 sm:p-1.5 w-full sm:w-fit max-w-full overflow-x-auto">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;

        return (
          <div
            key={step.key}
            className={[
              "flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap",
              isActive
                ? "bg-primary-600 text-white shadow-sm"
                : isDone
                ? "bg-success-400/20 text-success-600"
                : "text-text-muted",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold",
                isActive ? "bg-white/20" : isDone ? "bg-success-400/30" : "bg-bg-card",
              ].join(" ")}
            >
              {isDone ? "\u2713" : i + 1}
            </span>
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

/** Import success banner */
function ImportedBanner({ count }: { count: number }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
      <FileSpreadsheet className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" />
      <div className="text-sm">
        <span className="font-semibold text-primary-800">{count} rows</span>
        <span className="text-primary-700">
          {" "}
          imported from file. Review the grid below, fix any mapping issues, then validate and submit.
        </span>
      </div>
    </div>
  );
}

/** Keyboard / paste hint strip */
function EntryHint() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border-default/70 bg-bg-subtle px-3 py-2">
      <span className="text-xs text-text-muted">
        <span className="font-medium text-text-default">Tip:</span> Paste from
        Excel to fill multiple cells, or use{" "}
        <span className="font-medium text-text-default">Duplicate selected</span>{" "}
        and{" "}
        <span className="font-medium text-text-default">Fill down</span> to
        speed up entry.
      </span>
    </div>
  );
}

/** Action buttons (rendered inline at top) */

const FIELD_LABELS: Record<string, string> = {
  siteId: "Site",
  vendorId: "Vendor",
  wasteTypeId: "Waste Type",
  shipmentDate: "Date",
  weightValue: "Weight",
  weightUnit: "Unit",
  clientId: "Client",
};

function ActionButtons({
  submitting,
  hasData,
  cellErrors,
  onValidate,
  onSubmit,
  onErrorClick,
}: {
  submitting: boolean;
  hasData: boolean;
  cellErrors: CellError[];
  onValidate: () => void;
  onSubmit: () => void;
  onErrorClick: (rowIndex: number, field: string) => void;
}) {
  const disabledMessage = "Enter shipment data in at least one row first";
  const errorCount = cellErrors.length;
  const errorRowCount = new Set(cellErrors.map((e) => e.rowIndex)).size;

  return (
    <div className="flex items-center gap-2">
      {/* Validate button — with error popover */}
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={!hasData ? 0 : undefined}>
              <PopoverTrigger asChild disabled={errorCount === 0}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={hasData ? onValidate : undefined}
                  disabled={!hasData}
                  className="gap-2 relative"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Validate
                  {errorCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                      {errorCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
            </span>
          </TooltipTrigger>
          {!hasData && <TooltipContent>{disabledMessage}</TooltipContent>}
        </Tooltip>

        {errorCount > 0 && (
          <PopoverContent
            align="end"
            className="w-80 sm:w-96 p-0"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border-default px-4 py-3">
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                {errorCount}
              </span>
              <p className="text-sm font-semibold text-text-primary">
                {errorCount} {errorCount === 1 ? "error" : "errors"} in {errorRowCount} {errorRowCount === 1 ? "row" : "rows"}
              </p>
            </div>

            {/* Error list */}
            <div className="max-h-60 overflow-y-auto p-2">
              {cellErrors.map((error, i) => (
                <button
                  key={`${error.rowIndex}-${error.field}-${i}`}
                  type="button"
                  onClick={() => onErrorClick(error.rowIndex, error.field)}
                  className="flex items-center gap-2 w-full text-left text-xs text-text-secondary hover:bg-bg-hover rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors cursor-pointer"
                >
                  <span className="font-mono text-text-muted shrink-0 w-10">
                    R{error.rowIndex + 1}
                  </span>
                  <span className="font-medium text-text-primary shrink-0">
                    {FIELD_LABELS[error.field] ?? error.field}
                  </span>
                  <span className="truncate text-text-muted">{error.message}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>

      {/* Submit button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={!hasData ? 0 : undefined}>
            <Button size="sm" onClick={onSubmit} loading={submitting} disabled={!hasData} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Submit Shipments
            </Button>
          </span>
        </TooltipTrigger>
        {!hasData && <TooltipContent>{disabledMessage}</TooltipContent>}
      </Tooltip>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────── */

export default function NewShipmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const allowedSiteIds =
    user?.role !== "admin" ? user?.assignedSiteIds : undefined;

  // Fetch reference data for name-to-ID lookups during import
  const { sites, loading: sitesLoading } = useSites();
  const { clients, loading: clientsLoading } = useClients();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { wasteTypes, loading: wasteTypesLoading } = useWasteTypes();

  const referenceDataLoaded = !sitesLoading && !clientsLoading && !vendorsLoading && !wasteTypesLoading;

  const [viewMode, setViewMode] = React.useState<ViewMode>("choice");
  const [rowData, setRowData] = React.useState<ShipmentEntryRow[]>([]);
  const [cellErrors, setCellErrors] = React.useState<CellError[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [importedBanner, setImportedBanner] = React.useState<number | null>(
    null
  );

  /**
   * Resolve entity names to IDs during import.
   * This allows CSV files to use human-readable names instead of UUIDs.
   */
  const resolveNamesToIds = React.useCallback(
    (rows: ShipmentEntryRow[]): ShipmentEntryRow[] => {
      // Create case-insensitive lookup maps
      const siteMap = new Map(sites.map((s) => [s.name.toLowerCase(), s.id]));
      const clientMap = new Map(clients.map((c) => [c.name.toLowerCase(), c.id]));
      const vendorMap = new Map(vendors.map((v) => [v.name.toLowerCase(), v.id]));
      const wasteTypeMap = new Map(wasteTypes.map((w) => [w.name.toLowerCase(), w.id]));

      console.log("[resolveNamesToIds] Reference data:", {
        sites: sites.length,
        clients: clients.length,
        vendors: vendors.length,
        wasteTypes: wasteTypes.length,
      });

      return rows.map((row, idx) => {
        const resolved = { ...row };

        // Resolve siteId - check if it's a name (not already an ID)
        if (row.siteId && !isLikelyId(row.siteId)) {
          const id = siteMap.get(row.siteId.toLowerCase());
          console.log(`[Row ${idx}] Site: "${row.siteId}" -> "${id}"`);
          resolved.siteId = id ?? "";
        }

        // Resolve clientId
        if (row.clientId && !isLikelyId(row.clientId)) {
          const id = clientMap.get(row.clientId.toLowerCase());
          console.log(`[Row ${idx}] Client: "${row.clientId}" -> "${id}"`);
          resolved.clientId = id ?? "";
        }

        // Resolve vendorId
        if (row.vendorId && !isLikelyId(row.vendorId)) {
          const id = vendorMap.get(row.vendorId.toLowerCase());
          console.log(`[Row ${idx}] Vendor: "${row.vendorId}" -> "${id}"`);
          resolved.vendorId = id ?? "";
        }

        // Resolve wasteTypeId
        if (row.wasteTypeId && !isLikelyId(row.wasteTypeId)) {
          const id = wasteTypeMap.get(row.wasteTypeId.toLowerCase());
          console.log(`[Row ${idx}] WasteType: "${row.wasteTypeId}" -> "${id}"`);
          resolved.wasteTypeId = id ?? "";
        }

        return resolved;
      });
    },
    [sites, clients, vendors, wasteTypes]
  );

  // Re-resolve names when reference data becomes available
  React.useEffect(() => {
    if (referenceDataLoaded && rowData.length > 0) {
      // Check if any rows have unresolved names (not IDs)
      const hasUnresolvedNames = rowData.some(
        (row) =>
          (row.siteId && !isLikelyId(row.siteId)) ||
          (row.clientId && !isLikelyId(row.clientId)) ||
          (row.vendorId && !isLikelyId(row.vendorId)) ||
          (row.wasteTypeId && !isLikelyId(row.wasteTypeId))
      );

      if (hasUnresolvedNames) {
        console.log("[useEffect] Reference data loaded, resolving unresolved names");
        const resolvedRows = resolveNamesToIds(rowData);
        setRowData(resolvedRows);
      }
    }
  }, [referenceDataLoaded, resolveNamesToIds]); // Don't include rowData to avoid infinite loop

  /* ─── Validation ─── */
  function validate(rows: ShipmentEntryRow[]): CellError[] {
    const errors: CellError[] = [];
    const today = new Date().toISOString().split("T")[0];

    rows.forEach((row, i) => {
      const hasAnyValue =
        row.siteId ||
        row.vendorId ||
        row.wasteTypeId ||
        row.shipmentDate ||
        row.weightValue != null;
      if (!hasAnyValue) return;

      if (!row.siteId)
        errors.push({ rowIndex: i, field: "siteId", message: "Site is required" });
      if (!row.vendorId)
        errors.push({ rowIndex: i, field: "vendorId", message: "Vendor is required" });
      if (!row.wasteTypeId)
        errors.push({ rowIndex: i, field: "wasteTypeId", message: "Waste type is required" });
      if (!row.shipmentDate)
        errors.push({ rowIndex: i, field: "shipmentDate", message: "Date is required" });
      else if (row.shipmentDate > today)
        errors.push({ rowIndex: i, field: "shipmentDate", message: "Date cannot be in the future" });
      if (row.weightValue == null || row.weightValue === 0)
        errors.push({ rowIndex: i, field: "weightValue", message: "Weight is required" });
      else if (row.weightValue < 0)
        errors.push({ rowIndex: i, field: "weightValue", message: "Weight must be positive" });
      if (!row.weightUnit)
        errors.push({ rowIndex: i, field: "weightUnit", message: "Unit is required" });
    });

    return errors;
  }

  function handleValidate() {
    const errors = validate(rowData);
    setCellErrors(errors);
    if (errors.length === 0) {
      const filledRows = rowData.filter(
        (r) =>
          r.siteId || r.vendorId || r.wasteTypeId || r.shipmentDate || r.weightValue != null
      );
      if (filledRows.length === 0) {
        toast.warning("No data to validate", {
          description: "Enter at least one shipment row",
        });
      } else {
        toast.success("Validation passed", {
          description: `${filledRows.length} rows are valid`,
        });
      }
    } else {
      toast.error("Validation failed", {
        description: `${errors.length} errors found across ${
          new Set(errors.map((e) => e.rowIndex)).size
        } rows`,
      });
    }
  }

  async function handleSubmit() {
    const errors = validate(rowData);
    setCellErrors(errors);

    const filledRows = rowData.filter(
      (r) =>
        r.siteId || r.vendorId || r.wasteTypeId || r.shipmentDate || r.weightValue != null
    );

    if (filledRows.length === 0) {
      toast.warning("No data to submit", {
        description: "Enter at least one shipment row",
      });
      return;
    }

    const errorRowIndices = new Set(errors.map((e) => e.rowIndex));
    const validRows = filledRows.filter((_, i) => {
      const originalIndex = rowData.indexOf(filledRows[i]);
      return !errorRowIndices.has(originalIndex);
    });

    if (validRows.length === 0) {
      toast.error("All rows have errors", {
        description: "Fix the validation errors and try again",
      });
      return;
    }

    setSubmitting(true);

    try {
      const shipmentsToCreate = validRows.map((r) => ({
        site_id: r.siteId,
        customer_id: r.clientId,
        vendor_id: r.vendorId,
        waste_type_id: r.wasteTypeId,
        shipment_date: r.shipmentDate,
        weight_value: r.weightValue!,
        weight_unit: r.weightUnit,
        volume_value: r.volumeValue ?? undefined,
        notes: r.notes || undefined,
      }));

      const response = await shipmentsApi.create({ shipments: shipmentsToCreate });

      setSubmitting(false);

      if (response.error) {
        toast.error("Failed to submit", { description: response.error });
        return;
      }

      const result = response.data as { inserted?: number } | null;
      const insertedCount = result?.inserted ?? validRows.length;

      if (errors.length > 0) {
        const remaining = rowData.filter((_, i) => errorRowIndices.has(i));
        setRowData(remaining.length > 0 ? remaining : generateRows(5));
        toast.warning("Partial submit", {
          description: `${insertedCount} rows saved, ${errors.length} errors remain`,
        });
      } else {
        toast.success("Shipments submitted", {
          description: `${insertedCount} shipments created successfully`,
        });
        router.push("/shipments");
      }
    } catch (err) {
      setSubmitting(false);
      toast.error("Failed to submit shipments");
    }
  }

  function handleEntryChoose(mode: EntryMode) {
    if (mode === "upload") {
      setViewMode("upload");
      return;
    }
    setViewMode("manual");
    setRowData([]);
    setImportedBanner(null);
  }

  function handleUploadImported(rows: ShipmentEntryRow[]) {
    // Store raw rows first, then resolve when reference data is available
    if (!referenceDataLoaded) {
      console.warn("[handleUploadImported] Reference data not loaded yet, storing raw rows");
      setRowData(rows);
      setCellErrors([]);
      setViewMode("manual");
      setImportedBanner(rows.length);
      toast.warning("File imported - resolving names", {
        description: `${rows.length} rows imported. Entity names will be resolved when data loads.`,
      });
      return;
    }

    // Resolve entity names to IDs
    console.log("[handleUploadImported] Resolving names with loaded reference data");
    const resolvedRows = resolveNamesToIds(rows);
    setRowData(resolvedRows);
    setCellErrors([]);
    setViewMode("manual");
    setImportedBanner(resolvedRows.length);
    toast.success("File imported", {
      description: `${resolvedRows.length} rows ready to review and submit`,
    });
  }

  function handleErrorClick(rowIndex: number, _field: string) {
    const el = document.querySelector(`[row-index="${rowIndex}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ─── Back navigation ─── */
  function handleBack() {
    setViewMode(viewMode === "upload" ? "choice" : "choice");
  }

  const showManualView = viewMode === "manual";

  return (
    <div className="w-full">
      {/* Page header with breadcrumb + step track */}
      <PageHeader viewMode={viewMode} onBack={handleBack} />

      <div className="w-full space-y-4">
        {/* ── Choice screen ── */}
        {viewMode === "choice" && (
          <EntryChoice onChoose={handleEntryChoose} />
        )}

        {/* ── Upload screen ── */}
        {viewMode === "upload" && (
          <UploadShipmentsStep
            onImported={handleUploadImported}
            onBack={() => setViewMode("choice")}
          />
        )}

        {/* ── Manual grid screen ── */}
        {showManualView && (
          <div className="flex flex-col space-y-3 h-[calc(100vh-280px)] min-h-[400px]">
            {importedBanner != null && (
              <ImportedBanner count={importedBanner} />
            )}

            <NewShipmentGrid
              rowData={rowData}
              toolbarRight={
                <ActionButtons
                  submitting={submitting}
                  hasData={rowData.some(
                    (r) => r.siteId || r.vendorId || r.wasteTypeId || r.shipmentDate || r.weightValue != null
                  )}
                  cellErrors={cellErrors}
                  onValidate={handleValidate}
                  onSubmit={handleSubmit}
                  onErrorClick={handleErrorClick}
                />
              }
              onRowDataChange={(data) => {
                setRowData(data);
                if (importedBanner != null) setImportedBanner(null);
              }}
              onImport={(rawRows) => {
                const mapped = rawRows.map((raw) => {
                  const row = createEmptyRow();
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
                  for (const [header, field] of Object.entries(HEADER_MAP)) {
                    const val = raw[header];
                    if (val == null || val === "") continue;
                    if (field === "weightValue" || field === "volumeValue") {
                      const num =
                        typeof val === "number" ? val : parseFloat(String(val));
                      (row as Record<string, unknown>)[field] = isNaN(num)
                        ? null
                        : num;
                    } else {
                      (row as Record<string, unknown>)[field] = String(
                        val
                      ).trim();
                    }
                  }
                  return row;
                });
                // Resolve entity names to IDs
                const resolved = resolveNamesToIds(mapped);
                setRowData(resolved);
                setCellErrors([]);
                setImportedBanner(resolved.length);
                toast.success("Import complete", {
                  description: `${resolved.length} rows imported`,
                });
              }}
              cellErrors={cellErrors}
              allowedSiteIds={allowedSiteIds}
            />

            <EntryHint />
          </div>
        )}
      </div>
    </div>
  );
}