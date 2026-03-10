"use client";

import * as React from "react";
import { AgGridReact, AgGridProvider } from "ag-grid-react";
import {
  AllCommunityModule,
  type ColDef,
  type CellValueChangedEvent,
  type GridReadyEvent,
  type GridApi,
  type CellClassParams,
  type ITooltipParams,
  createTheme,
} from "ag-grid-community";
import { ChevronDown, Copy, Plus, Trash2, Upload } from "lucide-react";
import { read, utils } from "xlsx";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const modules = [AllCommunityModule];

/* Minimal theme — all styling via CSS custom properties in .ag-theme-mps */
const mpsTheme = createTheme();

/* ─── Types ─── */

interface CellError {
  rowIndex: number;
  field: string;
  message: string;
}

interface AGGridWrapperProps<TData> {
  columnDefs: ColDef<TData>[];
  rowData: TData[];
  onRowDataChange?: (data: TData[]) => void;
  onCellValueChanged?: (event: CellValueChangedEvent<TData>) => void;
  cellErrors?: CellError[];
  defaultRow?: Partial<TData>;
  onImport?: (rows: Record<string, unknown>[]) => void;
  showRowNumbers?: boolean;
  showToolbar?: boolean;
  /** Show "Add 10 / 25 / 50 rows" dropdown */
  showAddNRows?: boolean;
  /** Show "Duplicate selected" button */
  showDuplicate?: boolean;
  /** Show "Fill down" button (copy focused cell value down the column) */
  showFillDown?: boolean;
  height?: number | string;
  className?: string;
}

/* ─── Component ─── */

function AGGridWrapper<TData extends Record<string, unknown>>({
  columnDefs,
  rowData,
  onRowDataChange,
  onCellValueChanged,
  cellErrors = [],
  defaultRow = {} as Partial<TData>,
  onImport,
  showRowNumbers = true,
  showToolbar = true,
  showAddNRows = false,
  showDuplicate = false,
  showFillDown = false,
  height = 500,
  className,
}: AGGridWrapperProps<TData>) {
  const gridRef = React.useRef<AgGridReact<TData>>(null);
  const [api, setApi] = React.useState<GridApi<TData> | null>(null);

  /* Build error lookup map: "rowIndex:field" → message */
  const errorMap = React.useMemo(() => {
    const map = new Map<string, string>();
    cellErrors.forEach((err) => {
      map.set(`${err.rowIndex}:${err.field}`, err.message);
    });
    return map;
  }, [cellErrors]);

  /* Merge row number column + user columns */
  const allColumnDefs: ColDef<TData>[] = React.useMemo(() => {
    const cols: ColDef<TData>[] = [];

    if (showRowNumbers) {
      cols.push({
        headerName: "#",
        valueGetter: (params) =>
          params.node?.rowIndex != null ? params.node.rowIndex + 1 : "",
        width: 50,
        pinned: "left",
        editable: false,
        sortable: false,
        cellClass: "text-text-muted font-mono text-xs",
      });
    }

    cols.push(
      ...columnDefs.map((col) => ({
        ...col,
        cellClass: (params: CellClassParams<TData>) => {
          const field = col.field as string;
          const idx = params.node?.rowIndex;
          if (idx != null && errorMap.has(`${idx}:${field}`)) {
            return "cell-error";
          }
          return "";
        },
        tooltipValueGetter: (params: ITooltipParams<TData>) => {
          const field = col.field as string;
          const idx = params.node?.rowIndex;
          if (idx != null) {
            return errorMap.get(`${idx}:${field}`) ?? "";
          }
          return "";
        },
      }))
    );

    return cols;
  }, [columnDefs, showRowNumbers, errorMap]);

  function onGridReady(event: GridReadyEvent<TData>) {
    setApi(event.api);
  }

  const gridContainerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* ─── ResizeObserver — auto-fit columns when container size changes ─── */
  React.useEffect(() => {
    const container = gridContainerRef.current;
    if (!container || !api) return;

    const observer = new ResizeObserver(() => {
      api.sizeColumnsToFit();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [api]);

  React.useEffect(() => {
    const container = gridContainerRef.current;
    if (!container || !api) return;

    function handlePaste(e: ClipboardEvent) {
      /* Only intercept if no text input/textarea is focused (i.e. not editing a text cell) */
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        return; // let native paste happen in text editors
      }

      const clipboardText = e.clipboardData?.getData("text/plain");
      if (!clipboardText) return;

      e.preventDefault();

      const focusedCell = api!.getFocusedCell();
      if (!focusedCell) return;

      /* Parse TSV: rows split by newline, cells split by tab */
      const pastedRows = clipboardText
        .split(/\r?\n/)
        .filter((line) => line.length > 0)
        .map((line) => line.split("\t"));

      if (pastedRows.length === 0) return;

      /* Get editable columns (skip row number, checkbox columns) */
      const allCols = api!.getAllDisplayedColumns();
      const editableCols = allCols.filter((c) => {
        const colDef = c.getColDef();
        return colDef.editable !== false && colDef.field;
      });

      const startColId = focusedCell.column.getColId();
      const startColIdx = editableCols.findIndex(
        (c) => c.getColId() === startColId
      );
      if (startColIdx < 0) return;

      const startRowIdx = focusedCell.rowIndex;
      const updated = [...rowData];

      pastedRows.forEach((cells, rowOffset) => {
        const targetRowIdx = startRowIdx + rowOffset;

        /* Auto-expand rows if pasting beyond existing data */
        while (targetRowIdx >= updated.length) {
          updated.push({ ...defaultRow } as TData);
        }

        cells.forEach((cellValue, colOffset) => {
          const targetCol = editableCols[startColIdx + colOffset];
          if (!targetCol) return;

          const field = targetCol.getColDef().field;
          if (!field) return;

          /* Coerce numbers for numeric columns */
          const colDef = targetCol.getColDef();
          let parsed: unknown = cellValue.trim();
          if (colDef.type === "numericColumn" || colDef.cellEditor === "agNumberCellEditor") {
            const num = parseFloat(cellValue.trim());
            parsed = isNaN(num) ? null : num;
          }

          (updated[targetRowIdx] as Record<string, unknown>)[field] = parsed;
        });
      });

      onRowDataChange?.(updated);

      /* Refresh the grid to show the pasted data */
      api!.refreshCells({ force: true });
    }

    container.addEventListener("paste", handlePaste);
    return () => container.removeEventListener("paste", handlePaste);
  }, [api, rowData, onRowDataChange, defaultRow]);

  /* ─── File Import (xlsx/csv → JSON rows) ─── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return;
        const rows = utils.sheet_to_json<Record<string, unknown>>(
          workbook.Sheets[sheetName]
        );
        onImport(rows);
      } catch {
        /* Parse errors are handled by the consumer via toast */
        onImport([]);
      }
    };
    reader.readAsArrayBuffer(file);

    /* Reset so the same file can be re-imported */
    e.target.value = "";
  }

  function handleAddRow() {
    const newData = [...rowData, { ...defaultRow } as TData];
    onRowDataChange?.(newData);
  }

  function handleRemoveSelected() {
    if (!api) return;
    const selectedNodes = api.getSelectedNodes();
    if (selectedNodes.length === 0) return;
    const selectedIndices = new Set(selectedNodes.map((n) => n.rowIndex));
    const newData = rowData.filter((_, i) => !selectedIndices.has(i));
    onRowDataChange?.(newData);
  }

  function handleAddNRows(n: number) {
    const newRows = Array.from({ length: n }, () => ({ ...defaultRow } as TData));
    onRowDataChange?.([...rowData, ...newRows]);
  }

  function handleDuplicateRows() {
    if (!api) return;
    const selected = api.getSelectedNodes();
    if (selected.length === 0) return;
    const clones = selected.map((node) => {
      const data = node.data as TData & { _rowId?: string };
      return { ...data, _rowId: crypto.randomUUID() } as TData;
    });
    onRowDataChange?.([...rowData, ...clones]);
  }

  function handleFillDown() {
    if (!api) return;
    const focused = api.getFocusedCell();
    const colDef = focused?.column.getColDef();
    const field = colDef?.field as string | undefined;
    if (focused?.rowIndex == null || !field) return;
    const value = (rowData[focused.rowIndex] as Record<string, unknown>)[field];
    const updated = [...rowData];
    for (let i = focused.rowIndex + 1; i < updated.length; i++) {
      updated[i] = { ...updated[i], [field]: value } as TData;
    }
    onRowDataChange?.(updated);
    api.refreshCells({ force: true });
  }

  function handleCellChanged(event: CellValueChangedEvent<TData>) {
    onCellValueChanged?.(event);
    /* If onRowDataChange provided, update the data immutably */
    if (onRowDataChange && event.rowIndex != null) {
      const updated = [...rowData];
      updated[event.rowIndex] = { ...event.data } as TData;
      onRowDataChange(updated);
    }
  }

  const defaultColDef: ColDef<TData> = React.useMemo(
    () => ({
      editable: true,
      flex: 1,
      minWidth: 100,
      sortable: false,
      resizable: true,
    }),
    []
  );

  return (
    <div className={cn("space-y-3", className)}>
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleAddRow}>
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
          {showAddNRows && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  Add 10 / 25 / 50 rows
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleAddNRows(10)}>Add 10 rows</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddNRows(25)}>Add 25 rows</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAddNRows(50)}>Add 50 rows</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {showDuplicate && (
            <Button variant="ghost" size="sm" onClick={handleDuplicateRows}>
              <Copy className="h-4 w-4" />
              Duplicate selected
            </Button>
          )}
          {showFillDown && (
            <Button variant="ghost" size="sm" onClick={handleFillDown}>
              Fill down
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveSelected}
          >
            <Trash2 className="h-4 w-4" />
            Remove Selected
          </Button>
          {onImport && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />
            </>
          )}
        </div>
      )}
      <AgGridProvider modules={modules}>
        <div
          ref={gridContainerRef}
          className="ag-theme-mps"
          style={{ height, width: "100%" }}
        >
          <AgGridReact<TData>
            ref={gridRef}
            rowData={rowData}
            columnDefs={allColumnDefs}
            defaultColDef={defaultColDef}
            theme={mpsTheme}
            onGridReady={onGridReady}
            onCellValueChanged={handleCellChanged}
            rowSelection={{ mode: "multiRow", checkboxes: true }}
            suppressMovableColumns
            singleClickEdit
            stopEditingWhenCellsLoseFocus
            enterNavigatesVertically
            enterNavigatesVerticallyAfterEdit
            tabToNextCell={(params) => params.nextCellPosition ?? params.previousCellPosition}
          />
        </div>
      </AgGridProvider>
    </div>
  );
}

export {
  AGGridWrapper,
  type AGGridWrapperProps,
  type CellError,
};
