"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Shipment, ShipmentStatus, CostBreakdown } from "@/lib/types";

const statusVariant: Record<ShipmentStatus, BadgeVariant> = {
  submitted: "success",
  pending: "warning",
  void: "error",
};

const wasteCategoryVariant: Record<string, BadgeVariant> = {
  "Non Haz": "neutral",
  "Hazardous Waste": "error",
  Recycling: "success",
  Medical: "warning",
  "E-Waste": "info",
};

function totalCost(cost?: CostBreakdown): number {
  if (!cost) return 0;
  return (
    cost.haulCharge +
    cost.disposalFeeTotal +
    cost.fuelFee +
    cost.environmentalFee +
    cost.otherFees -
    cost.rebate
  );
}

interface ShipmentColumnActions {
  onView: (shipment: Shipment) => void;
  onDelete: (shipment: Shipment) => void;
}

/** All available columns — the page determines default visibility */
export function getShipmentColumns(
  actions: ShipmentColumnActions
): ColumnDef<Shipment, unknown>[] {
  return [
    {
      accessorKey: "shipmentDate",
      header: "Date",
      size: 110,
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return new Date(val + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      },
    },
    {
      accessorKey: "siteName",
      header: "Site",
      size: 180,
    },
    {
      accessorKey: "clientName",
      header: "Client",
      size: 160,
    },
    {
      accessorKey: "vendorName",
      header: "Vendor",
      size: 160,
    },
    {
      accessorKey: "wasteTypeName",
      header: "Waste Type",
      size: 140,
    },
    {
      accessorKey: "wasteCategory",
      header: "Category",
      size: 130,
      cell: ({ getValue }) => {
        const cat = getValue() as string | undefined;
        if (!cat) return <span className="text-text-muted">—</span>;
        return (
          <Badge variant={wasteCategoryVariant[cat] ?? "neutral"}>
            {cat === "Hazardous Waste" ? "Haz" : cat}
          </Badge>
        );
      },
    },
    {
      accessorKey: "treatmentMethod",
      header: "Treatment",
      size: 130,
      cell: ({ getValue }) => {
        const val = getValue() as string | undefined;
        return val ? (
          <span className="text-text-secondary">{val}</span>
        ) : (
          <span className="text-text-muted">—</span>
        );
      },
    },
    {
      accessorKey: "weightValue",
      header: "Weight",
      size: 120,
      cell: ({ row }) => (
        <span>
          {row.original.weightValue.toLocaleString()} {row.original.weightUnit}
        </span>
      ),
    },
    {
      accessorKey: "manifestNumber",
      header: "Manifest #",
      size: 140,
      cell: ({ getValue }) => {
        const val = getValue() as string | undefined;
        return val ? (
          <span className="font-mono text-xs">{val}</span>
        ) : (
          <span className="text-text-muted">—</span>
        );
      },
    },
    {
      accessorKey: "receivingFacility",
      header: "Facility",
      size: 160,
      cell: ({ getValue }) => {
        const val = getValue() as string | undefined;
        return val ? (
          <span className="text-text-secondary">{val}</span>
        ) : (
          <span className="text-text-muted">—</span>
        );
      },
    },
    {
      accessorKey: "transporterName",
      header: "Transporter",
      size: 150,
      cell: ({ getValue }) => {
        const val = getValue() as string | undefined;
        return val ? (
          <span className="text-text-secondary">{val}</span>
        ) : (
          <span className="text-text-muted">—</span>
        );
      },
    },
    {
      id: "mpsCostTotal",
      header: "MPS Cost",
      size: 110,
      accessorFn: (row) => totalCost(row.mpsCost),
      cell: ({ getValue }) => {
        const val = getValue() as number;
        return val > 0 ? (
          <span className="font-mono text-xs">
            ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        );
      },
    },
    {
      id: "custCostTotal",
      header: "Cust. Cost",
      size: 110,
      accessorFn: (row) => totalCost(row.customerCost),
      cell: ({ getValue }) => {
        const val = getValue() as number;
        return val > 0 ? (
          <span className="font-mono text-xs">
            ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        );
      },
    },
    {
      id: "margin",
      header: "Margin",
      size: 100,
      accessorFn: (row) => totalCost(row.customerCost) - totalCost(row.mpsCost),
      cell: ({ getValue }) => {
        const val = getValue() as number;
        if (val === 0) return <span className="text-text-muted">—</span>;
        return (
          <Badge variant={val >= 0 ? "success" : "error"}>
            ${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Badge>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      size: 180,
      enableSorting: false,
      cell: ({ getValue }) => {
        const val = getValue() as string | undefined;
        if (!val) return <span className="text-text-muted">—</span>;
        return (
          <span className="truncate block max-w-[180px]" title={val}>
            {val}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      meta: { align: "center" },
      cell: ({ getValue }) => {
        const status = getValue() as ShipmentStatus;
        return (
          <Badge variant={statusVariant[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
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
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                actions.onView(row.original);
              }}
            >
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              destructive
              onClick={(e) => {
                e.stopPropagation();
                actions.onDelete(row.original);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
