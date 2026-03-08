"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Shipment } from "@/lib/types";
import type { SectionConfig } from "@/lib/report-builder-types";
import { totalMpsCost, totalCustomerCost } from "@/lib/report-utils";

function fmt(v: number): string {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const columns: ColumnDef<Shipment, unknown>[] = [
  { accessorKey: "shipmentDate", header: "Date", size: 90 },
  { accessorKey: "siteName", header: "Site", size: 120 },
  { accessorKey: "clientName", header: "Client", size: 100 },
  { accessorKey: "wasteTypeName", header: "Waste Type", size: 140 },
  { accessorKey: "wasteCategory", header: "Category", size: 100 },
  {
    accessorKey: "weightValue",
    header: "Weight (lbs)",
    size: 90,
    cell: ({ getValue }) => (getValue() as number).toLocaleString(),
  },
  {
    id: "mpsCost",
    header: "MPS Cost",
    size: 90,
    cell: ({ row }) => fmt(totalMpsCost(row.original)),
  },
  {
    id: "custCost",
    header: "Revenue",
    size: 90,
    cell: ({ row }) => fmt(totalCustomerCost(row.original)),
  },
  { accessorKey: "manifestNumber", header: "Manifest #", size: 100 },
  { accessorKey: "status", header: "Status", size: 80 },
];

export function TableShipmentDetail({ shipments, config }: { shipments: Shipment[]; config: SectionConfig }) {
  const limit = config.tableRowLimit ?? 25;
  const data = shipments.slice(0, limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Shipment Detail</CardTitle>
        <p className="text-xs text-text-muted">
          Showing {data.length} of {shipments.length} records
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-default">
                {columns.map((col) => (
                  <th
                    key={col.id ?? (col as { accessorKey?: string }).accessorKey ?? ""}
                    className="px-3 py-2 text-left font-medium text-text-muted whitespace-nowrap"
                  >
                    {col.header as string}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-border-default last:border-0">
                  {columns.map((col) => {
                    const key = col.id ?? (col as { accessorKey?: string }).accessorKey ?? "";
                    let value: React.ReactNode;
                    if (col.cell) {
                      value = (col.cell as (info: { row: { original: Shipment }; getValue: () => unknown }) => React.ReactNode)({
                        row: { original: row },
                        getValue: () => (row as unknown as Record<string, unknown>)[(col as { accessorKey?: string }).accessorKey ?? ""],
                      });
                    } else {
                      value = String((row as unknown as Record<string, unknown>)[(col as { accessorKey?: string }).accessorKey ?? ""] ?? "");
                    }
                    return (
                      <td key={key} className="px-3 py-2 text-text-secondary whitespace-nowrap">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
