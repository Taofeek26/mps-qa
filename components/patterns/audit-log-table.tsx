"use client";

import * as React from "react";
import { type ColumnDef, type SortingState, type OnChangeFn } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DataTable, type DataTablePagination } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { MobileBackButton } from "@/components/ui/mobile-back-button";

/* ─── Types ─── */

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: { name: string; avatarUrl?: string };
  actionType: string;
  entityType: string;
  entityId: string;
  summary: string;
  payload?: Record<string, unknown>;
}

interface AuditLogTableProps {
  data: AuditLogEntry[];
  pagination?: DataTablePagination;
  onPaginationChange?: (page: number) => void;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Filter slots rendered inside FilterBar */
  filterSlots?: React.ReactNode;
  onResetFilters?: () => void;
  loading?: boolean;
  className?: string;
}

/* ─── Action badge color mapping ─── */

const actionBadgeVariant: Record<string, BadgeVariant> = {
  create: "success",
  update: "info",
  delete: "error",
  login: "neutral",
  export: "neutral",
};

function getActionBadgeVariant(action: string): BadgeVariant {
  return actionBadgeVariant[action.toLowerCase()] ?? "neutral";
}

/* ─── Column Definitions ─── */

const auditColumns: ColumnDef<AuditLogEntry, unknown>[] = [
  {
    id: "expand",
    header: "",
    size: 36,
    enableSorting: false,
    cell: ({ row }) => {
      if (!row.original.payload || Object.keys(row.original.payload).length === 0) {
        return null;
      }
      return (
        <ChevronRight className="h-4 w-4 text-text-muted transition-transform duration-200 group-data-[expanded=true]:rotate-90" />
      );
    },
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    size: 160,
    cell: ({ getValue }) => {
      const val = getValue() as string;
      try {
        return new Date(val).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return val;
      }
    },
  },
  {
    accessorKey: "actor",
    header: "Actor",
    size: 180,
    enableSorting: false,
    cell: ({ getValue }) => {
      const actor = getValue() as AuditLogEntry["actor"];
      const initials = actor.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-400/20 text-[10px] font-bold text-success-600">
            {initials}
          </div>
          <span className="truncate text-sm">{actor.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "actionType",
    header: "Action",
    size: 100,
    cell: ({ getValue }) => {
      const action = getValue() as string;
      return (
        <Badge variant={getActionBadgeVariant(action)}>
          {action}
        </Badge>
      );
    },
  },
  {
    accessorKey: "entityType",
    header: "Entity",
    size: 120,
  },
  {
    accessorKey: "entityId",
    header: "Entity ID",
    size: 140,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-text-secondary">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "summary",
    header: "Summary",
    size: 240,
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="text-text-secondary truncate block max-w-[240px]">
        {getValue() as string}
      </span>
    ),
  },
];

/* ─── Sub-row renderer ─── */

function renderAuditSubRow(entry: AuditLogEntry): React.ReactNode {
  if (!entry.payload || Object.keys(entry.payload).length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Change Details
        </span>
      </div>

      {/* Render previous/new values side by side if available */}
      {entry.payload.previousValues && entry.payload.newValues ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Previous Values
            </p>
            <div className="rounded-[var(--radius-sm)] bg-bg-card border border-border-default p-3">
              {Object.entries(entry.payload.previousValues as Record<string, unknown>).map(
                ([key, val]) => (
                  <div key={key} className="flex items-baseline justify-between gap-3 py-1">
                    <span className="text-xs font-medium text-text-muted">{key}</span>
                    <span className="text-xs font-mono text-error-500">
                      {String(val)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              New Values
            </p>
            <div className="rounded-[var(--radius-sm)] bg-bg-card border border-border-default p-3">
              {Object.entries(entry.payload.newValues as Record<string, unknown>).map(
                ([key, val]) => (
                  <div key={key} className="flex items-baseline justify-between gap-3 py-1">
                    <span className="text-xs font-medium text-text-muted">{key}</span>
                    <span className="text-xs font-mono text-success-600">
                      {String(val)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Fallback: raw JSON for non-standard payloads */
        <pre className="rounded-[var(--radius-sm)] bg-bg-card border border-border-default p-3 text-xs font-mono text-text-secondary overflow-x-auto">
          {JSON.stringify(entry.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ─── Component ─── */

function AuditLogTable({
  data,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  filterSlots,
  onResetFilters,
  loading = false,
  className,
}: AuditLogTableProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <MobileBackButton />

      {filterSlots && (
        <FilterBar onReset={onResetFilters}>{filterSlots}</FilterBar>
      )}

      <DataTable
        columns={auditColumns}
        data={data}
        getRowId={(row) => row.id}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        renderSubRow={renderAuditSubRow}
        loading={loading}
      />
    </div>
  );
}

export {
  AuditLogTable,
  type AuditLogTableProps,
  type AuditLogEntry,
};
