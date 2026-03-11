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
import { toast } from "@/components/ui/toast";
import { insertShipments } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import type { ShipmentEntryRow } from "@/lib/types";
import type { CellError } from "@/components/ui/ag-grid-wrapper";
import {
  NewShipmentGrid,
  createEmptyRow,
} from "./_components/new-shipment-grid";
import { ValidationSummary } from "./_components/validation-summary";
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
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">
            New Shipment Entry
          </h1>
          <p className="mt-0.5 text-sm text-text-muted">
            Add one or more waste shipments to the system.
          </p>
        </div>

        {viewMode !== "choice" && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 shrink-0 text-sm text-text-muted hover:text-primary-600 transition-colors mt-0.5 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {BACK_TO_ENTRY_OPTIONS_LABEL}
          </button>
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
    <div className="mt-6 flex items-center gap-3 rounded-full border border-border-default bg-bg-subtle/60 p-1.5 w-fit">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;

        return (
          <div
            key={step.key}
            className={[
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary-600 text-white shadow-sm"
                : isDone
                ? "bg-primary-100 text-primary-700"
                : "text-text-muted",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                isActive ? "bg-white/20" : isDone ? "bg-primary-200/80" : "bg-bg-card",
              ].join(" ")}
            >
              {isDone ? "✓" : i + 1}
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
    <div className="flex items-center gap-2 rounded-md border border-border-default/70 bg-bg-subtle/50 px-3 py-2">
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

/** Bottom action bar */
function ActionBar({
  submitting,
  onValidate,
  onSubmit,
}: {
  submitting: boolean;
  onValidate: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-border-default mt-2">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        <Button
          variant="secondary"
          onClick={onValidate}
          className="gap-2"
        >
          <ClipboardCheck className="h-4 w-4" />
          Validate rows
        </Button>
        <Button onClick={onSubmit} loading={submitting} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Submit Shipments
        </Button>
      </div>
      <p className="text-xs text-text-muted sm:text-right">
        Only filled rows with no errors will be submitted.
      </p>
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
    user?.role === "site_user" ? user?.assignedSiteIds : undefined;

  const [viewMode, setViewMode] = React.useState<ViewMode>("choice");
  const [rowData, setRowData] = React.useState<ShipmentEntryRow[]>([]);
  const [cellErrors, setCellErrors] = React.useState<CellError[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [importedBanner, setImportedBanner] = React.useState<number | null>(
    null
  );

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

  function handleSubmit() {
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

    setTimeout(() => {
      const result = insertShipments(
        validRows.map((r) => ({
          siteId: r.siteId,
          clientId: r.clientId,
          vendorId: r.vendorId,
          wasteTypeId: r.wasteTypeId,
          shipmentDate: r.shipmentDate,
          weightValue: r.weightValue!,
          weightUnit: r.weightUnit,
          volumeValue: r.volumeValue ?? undefined,
          notes: r.notes || undefined,
        }))
      );

      setSubmitting(false);

      if (errors.length > 0) {
        const remaining = rowData.filter((_, i) => errorRowIndices.has(i));
        setRowData(remaining.length > 0 ? remaining : generateRows(5));
        toast.warning("Partial submit", {
          description: `${result.inserted} rows saved, ${errors.length} errors remain`,
        });
      } else {
        toast.success("Shipments submitted", {
          description: `${result.inserted} shipments created successfully`,
        });
        router.push("/shipments");
      }
    }, 800);
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
    setRowData(rows);
    setCellErrors([]);
    setViewMode("manual");
    setImportedBanner(rows.length);
    toast.success("File imported", {
      description: `${rows.length} rows ready to review and submit`,
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
                setRowData(mapped);
                setCellErrors([]);
                setImportedBanner(mapped.length);
                toast.success("Import complete", {
                  description: `${mapped.length} rows imported`,
                });
              }}
              cellErrors={cellErrors}
              allowedSiteIds={allowedSiteIds}
            />

            <EntryHint />

            <ValidationSummary
              errors={cellErrors}
              onErrorClick={handleErrorClick}
            />

            <ActionBar
              submitting={submitting}
              onValidate={handleValidate}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}