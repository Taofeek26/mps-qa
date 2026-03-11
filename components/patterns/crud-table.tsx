"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { type ColumnDef, type SortingState, type OnChangeFn } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";
import { DataTable, type DataTablePagination } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/button";

/* ─── Types ─── */

interface CrudTableProps<TData> {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** TanStack Table column definitions */
  columns: ColumnDef<TData, unknown>[];
  /** Data array */
  data: TData[];
  /** Pagination state */
  pagination?: DataTablePagination;
  onPaginationChange?: (page: number) => void;
  /** Sorting state */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter slots (rendered inside FilterBar alongside search) */
  filterSlots?: React.ReactNode;
  onResetFilters?: () => void;
  /** Create/Edit form rendered in Drawer */
  formContent?: (props: {
    item: TData | null;
    onClose: () => void;
  }) => React.ReactNode;
  /** Called when create button is clicked if no formContent */
  onCreateNew?: () => void;
  /** Delete handler */
  onDelete?: (item: TData) => void;
  /** Edit handler — opens drawer with item if formContent provided */
  onEdit?: (item: TData) => void;
  /** Row click handler */
  onRowClick?: (item: TData) => void;
  /** Loading state */
  loading?: boolean;
  /** Custom empty state */
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Whether to show the actions column */
  showActions?: boolean;
  /** Item display name for delete dialog (e.g., "vendor") */
  entityName?: string;
  /** Get a display label for the item being deleted */
  getItemLabel?: (item: TData) => string;
  className?: string;
}

/* ─── Component ─── */

function CrudTable<TData>({
  title,
  subtitle,
  columns,
  data,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterSlots,
  onResetFilters,
  formContent,
  onCreateNew,
  onDelete,
  onEdit,
  onRowClick,
  loading = false,
  emptyIcon,
  emptyTitle = "No items found",
  emptyDescription = "Get started by creating a new item.",
  showActions = true,
  entityName = "item",
  getItemLabel,
  className,
}: CrudTableProps<TData>) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<TData | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<TData | null>(null);

  function handleCreate() {
    if (formContent) {
      setEditingItem(null);
      setDrawerOpen(true);
    } else {
      onCreateNew?.();
    }
  }

  function handleEdit(item: TData) {
    if (formContent) {
      setEditingItem(item);
      setDrawerOpen(true);
    } else {
      onEdit?.(item);
    }
  }

  function handleCloseDrawer() {
    setDrawerOpen(false);
    setEditingItem(null);
  }

  function handleConfirmDelete() {
    if (deleteItem && onDelete) {
      onDelete(deleteItem);
    }
    setDeleteItem(null);
  }

  /* Build columns with actions */
  const allColumns = React.useMemo(() => {
    if (!showActions || (!onEdit && !onDelete && !formContent)) return columns;

    const actionsCol: ColumnDef<TData, unknown> = {
      id: "actions",
      header: "",
      size: 48,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              label="Actions"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(onEdit || formContent) && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row.original);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                destructive
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteItem(row.original);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    };

    return [...columns, actionsCol];
  }, [columns, showActions, onEdit, onDelete, formContent]);

  const deleteLabel = deleteItem && getItemLabel ? getItemLabel(deleteItem) : entityName;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters + Actions */}
      {(onSearchChange || filterSlots || formContent || onCreateNew) && (
        <div className="flex flex-wrap items-end gap-4">
          <FilterBar onReset={onResetFilters} className="flex-1 min-w-0">
            {onSearchChange && (
              <div className="w-full sm:w-64">
                <TextInput
                  variant="search"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}
            {filterSlots}
          </FilterBar>
          {(formContent || onCreateNew) && (
            <Button size="sm" className="shrink-0" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Add {entityName}
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={allColumns}
        data={data}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        onRowClick={onRowClick}
        loading={loading}
        emptyState={
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={
              (formContent || onCreateNew) && (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4" />
                  Add {entityName}
                </Button>
              )
            }
          />
        }
      />

      {/* Create/Edit Drawer */}
      {formContent && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {editingItem ? `Edit ${entityName}` : `New ${entityName}`}
              </DrawerTitle>
            </DrawerHeader>
            <DrawerBody>
              {formContent({ item: editingItem, onClose: handleCloseDrawer })}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}

      {/* Delete Confirmation */}
      {onDelete && (
        <ConfirmDialog
          open={deleteItem !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteItem(null);
          }}
          title={`Delete ${entityName}`}
          description={`Are you sure you want to delete "${deleteLabel}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export { CrudTable, type CrudTableProps };
