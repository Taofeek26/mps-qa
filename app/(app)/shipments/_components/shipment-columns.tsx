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
import type { Shipment, ShipmentStatus } from "@/lib/types";

const statusVariant: Record<ShipmentStatus, BadgeVariant> = {
  submitted: "success",
  pending: "warning",
  void: "error",
};

interface ShipmentColumnActions {
  onView: (shipment: Shipment) => void;
  onDelete: (shipment: Shipment) => void;
}

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
