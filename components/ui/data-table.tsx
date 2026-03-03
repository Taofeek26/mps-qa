"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

/* ─── Types ─── */

interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  pagination?: DataTablePagination;
  onPaginationChange?: (page: number) => void;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
  /** Render an expandable sub-row below each data row. Return null to hide. */
  renderSubRow?: (row: TData) => React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  className?: string;
}

/* ─── Selection column helper ─── */

function getSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(!!checked)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  };
}

/* ─── DataTable ─── */

function DataTable<TData>({
  columns,
  data,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  columnVisibility,
  onColumnVisibilityChange,
  onRowClick,
  getRowId: getRowIdProp,
  renderSubRow,
  loading = false,
  loadingRows = 5,
  emptyState,
  className,
}: DataTableProps<TData>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  function toggleExpanded(rowId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection: rowSelection ?? {},
      columnVisibility: columnVisibility ?? {},
    },
    onSortingChange,
    onRowSelectionChange,
    onColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: !!onRowSelectionChange,
    rowCount: pagination?.total,
    getRowId: getRowIdProp,
  });

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table wrapper — horizontal scroll on mobile */}
      <div className="rounded-[var(--radius-lg)] border border-border-default bg-bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border-default bg-bg-subtle">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "h-10 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap",
                          canSort && "cursor-pointer select-none",
                          (header.column.columnDef.meta as Record<string, unknown>)?.align === "center" && "text-center"
                        )}
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
                        onClick={
                          canSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          {canSort && (
                            <span className="text-text-muted">
                              {sorted === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {/* Loading state */}
              {loading &&
                Array.from({ length: loadingRows }).map((_, i) => (
                  <tr
                    key={`skeleton-${i}`}
                    className="border-b border-border-default"
                  >
                    {table.getVisibleLeafColumns().map((col) => (
                      <td key={col.id} className="h-12 px-4">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Empty state */}
              {!loading && data.length === 0 && (
                <tr>
                  <td
                    colSpan={table.getVisibleLeafColumns().length}
                    className="h-48"
                  >
                    {emptyState ?? (
                      <div className="flex items-center justify-center h-full text-sm text-text-muted">
                        No results found
                      </div>
                    )}
                  </td>
                </tr>
              )}

              {/* Data rows */}
              <AnimatePresence initial={false}>
                {!loading &&
                  table.getRowModel().rows.map((row) => {
                    const isExpanded = expandedRows.has(row.id);
                    const subRowContent = renderSubRow?.(row.original);
                    const canExpand = !!renderSubRow && subRowContent != null;

                    return (
                      <React.Fragment key={row.id}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -16 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          data-expanded={isExpanded || undefined}
                          className={cn(
                            "group border-b border-border-default transition-colors",
                            "hover:bg-bg-hover",
                            row.getIsSelected() && "bg-primary-50",
                            (onRowClick || canExpand) && "cursor-pointer",
                            isExpanded && "bg-bg-subtle"
                          )}
                          onClick={() => {
                            if (onRowClick) {
                              onRowClick(row.original);
                            } else if (canExpand) {
                              toggleExpanded(row.id);
                            }
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className={cn(
                                "h-12 px-4 text-text-primary whitespace-nowrap",
                                (cell.column.columnDef.meta as Record<string, unknown>)?.align === "center" && "text-center"
                              )}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </motion.tr>
                        {isExpanded && subRowContent && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="border-b border-border-default bg-bg-subtle"
                          >
                            <td
                              colSpan={row.getVisibleCells().length}
                              className="px-4 py-3"
                            >
                              {subRowContent}
                            </td>
                          </motion.tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination + selection info */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-text-muted">
            {rowSelection && Object.keys(rowSelection).length > 0 && (
              <span>
                {Object.keys(rowSelection).length} of {pagination.total} row(s)
                selected
              </span>
            )}
            {!(rowSelection && Object.keys(rowSelection).length > 0) && (
              <span>
                Showing{" "}
                {Math.min(
                  (pagination.page - 1) * pagination.pageSize + 1,
                  pagination.total
                )}
                -{Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
                of {pagination.total}
              </span>
            )}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={(page) => onPaginationChange?.(page)}
          />
        </div>
      )}
    </div>
  );
}

export {
  DataTable,
  getSelectionColumn,
  type DataTableProps,
  type DataTablePagination,
};
