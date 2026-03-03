"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { insertShipments } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import type { ShipmentEntryRow } from "@/lib/types";
import type { CellError } from "@/components/ui/ag-grid-wrapper";
import { NewShipmentGrid, createEmptyRow } from "./_components/new-shipment-grid";
import { ValidationSummary } from "./_components/validation-summary";

function generateRows(count: number): ShipmentEntryRow[] {
  return Array.from({ length: count }, () => createEmptyRow());
}

export default function NewShipmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const allowedSiteIds = user?.role === "site_user" ? user?.assignedSiteIds : undefined;
  const [rowData, setRowData] = React.useState<ShipmentEntryRow[]>(() =>
    generateRows(10)
  );
  const [cellErrors, setCellErrors] = React.useState<CellError[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  /* ─── Validation ─── */
  function validate(rows: ShipmentEntryRow[]): CellError[] {
    const errors: CellError[] = [];
    const today = new Date().toISOString().split("T")[0];

    rows.forEach((row, i) => {
      /* Skip completely empty rows */
      const hasAnyValue =
        row.siteId ||
        row.vendorId ||
        row.wasteTypeId ||
        row.shipmentDate ||
        row.weightValue != null;
      if (!hasAnyValue) return;

      if (!row.siteId) {
        errors.push({ rowIndex: i, field: "siteId", message: "Site is required" });
      }
      if (!row.vendorId) {
        errors.push({ rowIndex: i, field: "vendorId", message: "Vendor is required" });
      }
      if (!row.wasteTypeId) {
        errors.push({ rowIndex: i, field: "wasteTypeId", message: "Waste type is required" });
      }
      if (!row.shipmentDate) {
        errors.push({ rowIndex: i, field: "shipmentDate", message: "Date is required" });
      } else if (row.shipmentDate > today) {
        errors.push({ rowIndex: i, field: "shipmentDate", message: "Date cannot be in the future" });
      }
      if (row.weightValue == null || row.weightValue === 0) {
        errors.push({ rowIndex: i, field: "weightValue", message: "Weight is required" });
      } else if (row.weightValue < 0) {
        errors.push({ rowIndex: i, field: "weightValue", message: "Weight must be positive" });
      }
      if (!row.weightUnit) {
        errors.push({ rowIndex: i, field: "weightUnit", message: "Unit is required" });
      }
    });

    return errors;
  }

  function handleValidate() {
    const errors = validate(rowData);
    setCellErrors(errors);
    if (errors.length === 0) {
      const filledRows = rowData.filter(
        (r) => r.siteId || r.vendorId || r.wasteTypeId || r.shipmentDate || r.weightValue != null
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
        description: `${errors.length} errors found across ${new Set(errors.map((e) => e.rowIndex)).size} rows`,
      });
    }
  }

  function handleSubmit() {
    const errors = validate(rowData);
    setCellErrors(errors);

    /* Get rows with any data */
    const filledRows = rowData.filter(
      (r) => r.siteId || r.vendorId || r.wasteTypeId || r.shipmentDate || r.weightValue != null
    );

    if (filledRows.length === 0) {
      toast.warning("No data to submit", {
        description: "Enter at least one shipment row",
      });
      return;
    }

    /* Separate valid rows from invalid */
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

    /* Simulate network delay */
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
        /* Partial success — keep invalid rows, remove valid ones */
        const remaining = rowData.filter((_, i) => errorRowIndices.has(i));
        setRowData(remaining.length > 0 ? remaining : generateRows(10));

        toast.warning("Partial submit", {
          description: `${result.inserted} rows saved, ${errors.length} errors remain`,
        });
      } else {
        /* Full success */
        toast.success("Shipments submitted", {
          description: `${result.inserted} shipments created successfully`,
        });
        router.push("/shipments");
      }
    }, 800);
  }

  /* ─── Import from xlsx ─── */
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

  function handleImport(rawRows: Record<string, unknown>[]) {
    if (rawRows.length === 0) {
      toast.warning("No data found", {
        description: "The file appears to be empty or could not be parsed",
      });
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

    setRowData(mapped);
    setCellErrors([]);
    toast.success("Import complete", {
      description: `${mapped.length} rows imported from file`,
    });
  }

  function handleErrorClick(rowIndex: number, _field: string) {
    /* Scroll to the error row — AG Grid handles focus internally */
    const el = document.querySelector(`[row-index="${rowIndex}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <PageHeader
        title="New Shipment Entry"
        subtitle="Enter multiple shipment rows using the grid below"
        actions={
          <Link href="/shipments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back to Shipments
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <NewShipmentGrid
          rowData={rowData}
          onRowDataChange={setRowData}
          onImport={handleImport}
          cellErrors={cellErrors}
          allowedSiteIds={allowedSiteIds}
        />

        <ValidationSummary
          errors={cellErrors}
          onErrorClick={handleErrorClick}
        />

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
          <Button variant="secondary" onClick={handleValidate}>
            <ClipboardCheck className="h-4 w-4" />
            Validate
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            <CheckCircle2 className="h-4 w-4" />
            Submit Shipments
          </Button>
          <p className="text-xs text-text-muted ml-auto">
            Tip: Paste from Excel to fill multiple cells at once
          </p>
        </div>
      </div>
    </>
  );
}
