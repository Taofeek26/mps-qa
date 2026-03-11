"use client";

import * as React from "react";
import { type ColDef } from "ag-grid-community";
import { Plus, ClipboardPaste, FileSpreadsheet } from "lucide-react";
import { AGGridWrapper, type CellError } from "@/components/ui/ag-grid-wrapper";
import {
  SelectCellRenderer,
  DateCellRenderer,
  NumberCellRenderer,
  TextCellRenderer,
} from "@/components/ag-grid/cell-renderers";
import { SelectCellEditor } from "@/components/ag-grid/select-cell-editor";
import { DateCellEditor } from "@/components/ag-grid/date-cell-editor";
import { getSites, getClients, getVendors, getWasteTypes } from "@/lib/mock-data";
import type { ShipmentEntryRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ─── Grid Component ─── */

interface NewShipmentGridProps {
  rowData: ShipmentEntryRow[];
  onRowDataChange: (data: ShipmentEntryRow[]) => void;
  onImport?: (rows: Record<string, unknown>[]) => void;
  cellErrors: CellError[];
  /** If set, only these sites are shown in the Site dropdown (for site_user role) */
  allowedSiteIds?: string[];
  className?: string;
  /** Content rendered at the far right of the toolbar */
  toolbarRight?: React.ReactNode;
}

export function NewShipmentGrid({
  rowData,
  onRowDataChange,
  onImport,
  cellErrors,
  allowedSiteIds,
  className,
  toolbarRight,
}: NewShipmentGridProps) {
  const sites = React.useMemo(() => {
    const all = getSites();
    if (allowedSiteIds) return all.filter((s) => allowedSiteIds.includes(s.id));
    return all;
  }, [allowedSiteIds]);
  const clients = React.useMemo(() => getClients(), []);
  const vendors = React.useMemo(() => getVendors(), []);
  const wasteTypes = React.useMemo(() => getWasteTypes(), []);

  const siteOptions = React.useMemo(
    () => sites.map((s) => ({ value: s.id, label: s.name })),
    [sites]
  );
  const clientOptions = React.useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients]
  );
  const vendorOptions = React.useMemo(
    () => vendors.map((v) => ({ value: v.id, label: v.name })),
    [vendors]
  );
  const wasteTypeOptions = React.useMemo(
    () => wasteTypes.map((w) => ({ value: w.id, label: w.name })),
    [wasteTypes]
  );

  const columnDefs: ColDef<ShipmentEntryRow>[] = React.useMemo(
    () => [
      {
        field: "siteId",
        headerName: "Site *",
        cellRenderer: SelectCellRenderer,
        cellRendererParams: { options: siteOptions, placeholder: "Select site..." },
        cellEditor: SelectCellEditor,
        cellEditorParams: { options: siteOptions },
        cellEditorPopup: true,
        valueFormatter: (p) =>
          siteOptions.find((o) => o.value === p.value)?.label ?? "",
        flex: 2,
        minWidth: 130,
      },
      {
        field: "clientId",
        headerName: "Client",
        cellRenderer: SelectCellRenderer,
        cellRendererParams: { options: clientOptions, placeholder: "Select client..." },
        cellEditor: SelectCellEditor,
        cellEditorParams: { options: clientOptions },
        cellEditorPopup: true,
        valueFormatter: (p) =>
          clientOptions.find((o) => o.value === p.value)?.label ?? "",
        flex: 2,
        minWidth: 130,
      },
      {
        field: "vendorId",
        headerName: "Vendor *",
        cellRenderer: SelectCellRenderer,
        cellRendererParams: { options: vendorOptions, placeholder: "Select vendor..." },
        cellEditor: SelectCellEditor,
        cellEditorParams: { options: vendorOptions },
        cellEditorPopup: true,
        valueFormatter: (p) =>
          vendorOptions.find((o) => o.value === p.value)?.label ?? "",
        flex: 2,
        minWidth: 130,
      },
      {
        field: "wasteTypeId",
        headerName: "Waste Type *",
        cellRenderer: SelectCellRenderer,
        cellRendererParams: { options: wasteTypeOptions, placeholder: "Select type..." },
        cellEditor: SelectCellEditor,
        cellEditorParams: { options: wasteTypeOptions },
        cellEditorPopup: true,
        valueFormatter: (p) =>
          wasteTypeOptions.find((o) => o.value === p.value)?.label ?? "",
        flex: 2,
        minWidth: 120,
      },
      {
        field: "shipmentDate",
        headerName: "Date *",
        cellRenderer: DateCellRenderer,
        cellRendererParams: { placeholder: "Select date..." },
        cellEditor: DateCellEditor,
        cellEditorPopup: true,
        flex: 1.5,
        minWidth: 130,
      },
      {
        field: "weightValue",
        headerName: "Weight *",
        cellRenderer: NumberCellRenderer,
        cellRendererParams: { placeholder: "0.00" },
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0 },
        type: "numericColumn",
        flex: 1,
        minWidth: 80,
        valueFormatter: (p) => (p.value != null ? String(p.value) : ""),
      },
      {
        field: "weightUnit",
        headerName: "Unit *",
        cellRenderer: SelectCellRenderer,
        cellRendererParams: {
          options: [
            { value: "lbs", label: "lbs" },
            { value: "tons", label: "tons" },
            { value: "kg", label: "kg" },
          ],
          placeholder: "Unit...",
        },
        cellEditor: SelectCellEditor,
        cellEditorParams: {
          options: [
            { value: "lbs", label: "lbs" },
            { value: "tons", label: "tons" },
            { value: "kg", label: "kg" },
          ],
        },
        cellEditorPopup: true,
        width: 85,
      },
      {
        field: "volumeValue",
        headerName: "Volume",
        cellRenderer: NumberCellRenderer,
        cellRendererParams: { placeholder: "Optional" },
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0 },
        type: "numericColumn",
        flex: 1,
        minWidth: 80,
        valueFormatter: (p) => (p.value != null ? String(p.value) : ""),
      },
      {
        field: "notes",
        headerName: "Notes",
        cellRenderer: TextCellRenderer,
        cellRendererParams: { placeholder: "Add notes..." },
        cellEditor: "agTextCellEditor",
        flex: 2,
        minWidth: 110,
      },
    ],
    [siteOptions, clientOptions, vendorOptions, wasteTypeOptions]
  );

  function handleAddRows(count: number) {
    const newRows = Array.from({ length: count }, () => createEmptyRow());
    onRowDataChange([...rowData, ...newRows]);
  }

  if (rowData.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-bg-subtle",
          "min-h-0 p-8 text-center",
          className
        )}
      >
        {/* Illustration */}
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-success-400/20 border border-success-400/30">
            <FileSpreadsheet className="h-10 w-10 text-success-600" strokeWidth={1.5} />
          </div>
          <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg-card border border-border-default shadow-sm">
            <ClipboardPaste className="h-4 w-4 text-text-muted" />
          </div>
        </div>

        <h3 className="text-base font-semibold text-text-primary mb-1">
          No shipment rows yet
        </h3>
        <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
          Add rows to start entering data. You can also paste directly from Excel once the grid is open.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => handleAddRows(1)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add row
          </Button>
          <Button variant="secondary" onClick={() => handleAddRows(10)}>
            Add 10 rows
          </Button>
          <Button variant="secondary" onClick={() => handleAddRows(25)}>
            Add 25 rows
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AGGridWrapper<ShipmentEntryRow>
      columnDefs={columnDefs}
      rowData={rowData}
      onRowDataChange={onRowDataChange}
      onImport={onImport}
      cellErrors={cellErrors}
      defaultRow={createEmptyRow()}
      height="100%"
      className={cn("flex-1 min-h-0", className)}
      gridClassName="ag-entry-grid"
      toolbarRight={toolbarRight}
      showAddNRows
      showDuplicate
      showFillDown
    />
  );
}

export function createEmptyRow(): ShipmentEntryRow {
  return {
    _rowId: crypto.randomUUID(),
    siteId: "",
    clientId: "",
    vendorId: "",
    wasteTypeId: "",
    shipmentDate: "",
    weightValue: null,
    weightUnit: "lbs",
    volumeValue: null,
    notes: "",
  };
}
