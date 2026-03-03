"use client";

import * as React from "react";
import { type ColDef } from "ag-grid-community";
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

/* ─── Grid Component ─── */

interface NewShipmentGridProps {
  rowData: ShipmentEntryRow[];
  onRowDataChange: (data: ShipmentEntryRow[]) => void;
  onImport?: (rows: Record<string, unknown>[]) => void;
  cellErrors: CellError[];
  /** If set, only these sites are shown in the Site dropdown (for site_user role) */
  allowedSiteIds?: string[];
  className?: string;
}

export function NewShipmentGrid({
  rowData,
  onRowDataChange,
  onImport,
  cellErrors,
  allowedSiteIds,
  className,
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

  return (
    <AGGridWrapper<ShipmentEntryRow>
      columnDefs={columnDefs}
      rowData={rowData}
      onRowDataChange={onRowDataChange}
      onImport={onImport}
      cellErrors={cellErrors}
      defaultRow={createEmptyRow()}
      height={460}
      className={className}
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
