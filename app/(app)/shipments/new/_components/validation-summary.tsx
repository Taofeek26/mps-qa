"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CellError } from "@/components/ui/ag-grid-wrapper";

interface ValidationSummaryProps {
  errors: CellError[];
  onErrorClick?: (rowIndex: number, field: string) => void;
  className?: string;
}

export function ValidationSummary({
  errors,
  onErrorClick,
  className,
}: ValidationSummaryProps) {
  if (errors.length === 0) return null;

  /* Group by field */
  const byField = React.useMemo(() => {
    const map = new Map<string, number>();
    errors.forEach((e) => {
      map.set(e.field, (map.get(e.field) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([field, count]) => ({
      field,
      count,
      label: fieldLabels[field] ?? field,
    }));
  }, [errors]);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-error-400 bg-error-100 p-4",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-error-600" />
        <p className="text-sm font-semibold text-error-600">
          {errors.length} validation {errors.length === 1 ? "error" : "errors"} found
        </p>
      </div>

      {/* Breakdown by field */}
      <div className="flex flex-wrap gap-2 mb-3">
        {byField.map((item) => (
          <span
            key={item.field}
            className="inline-flex items-center gap-1 rounded-full bg-bg-card border border-border-default px-2.5 py-1 text-xs font-medium text-text-primary"
          >
            {item.label}
            <span className="text-error-500">({item.count})</span>
          </span>
        ))}
      </div>

      {/* Error list (clickable) */}
      <div className="max-h-40 overflow-y-auto space-y-1">
        {errors.map((error, i) => (
          <button
            key={`${error.rowIndex}-${error.field}-${i}`}
            type="button"
            onClick={() => onErrorClick?.(error.rowIndex, error.field)}
            className="flex items-center gap-2 w-full text-left text-xs text-text-secondary hover:text-error-600 hover:bg-error-100/50 rounded px-2 py-1 transition-colors"
          >
            <span className="font-mono text-text-muted shrink-0">
              Row {error.rowIndex + 1}
            </span>
            <span className="font-medium">{fieldLabels[error.field] ?? error.field}:</span>
            <span className="truncate">{error.message}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const fieldLabels: Record<string, string> = {
  siteId: "Site",
  vendorId: "Vendor",
  wasteTypeId: "Waste Type",
  shipmentDate: "Date",
  weightValue: "Weight",
  weightUnit: "Unit",
  clientId: "Client",
};
