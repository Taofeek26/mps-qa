"use client";

import * as React from "react";
import { useAutoPageSize } from "@/lib/use-auto-page-size";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Plus, Truck, Columns3 } from "lucide-react";
import { type SortingState, type VisibilityState } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { shipmentsApi } from "@/lib/api-client";
import { useShipments } from "@/lib/hooks/use-api-data";
import { useAuth } from "@/lib/auth-context";
import type { Shipment, ShipmentFilters } from "@/lib/types";
import { getShipmentColumns, SHIPMENT_COLUMN_OPTIONS } from "./_components/shipment-columns";
import { ShipmentFiltersBar } from "./_components/shipment-filters";
import { ExportDialog } from "./_components/export-dialog";
import { ShipmentDetailsDrawer } from "./_components/shipment-details-drawer";


export default function ShipmentsPage() {
  return (
    <React.Suspense fallback={null}>
      <ShipmentsContent />
    </React.Suspense>
  );
}

function ShipmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const isLimitedRole = user?.role !== "admin";
  const allowedSiteIds = isLimitedRole ? user?.assignedSiteIds : undefined;

  /* ─── Derive state from URL ─── */
  const page = Number(searchParams.get("page") ?? "1");

  const tableRef = React.useRef<HTMLDivElement>(null);
  const pageSize = useAutoPageSize(tableRef);
  const urlFilters: ShipmentFilters = React.useMemo(
    () => ({
      search: searchParams.get("search") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      siteIds: searchParams.get("siteIds")?.split(",").filter(Boolean) ?? undefined,
      clientIds: searchParams.get("clientIds")?.split(",").filter(Boolean) ?? undefined,
      vendorIds: searchParams.get("vendorIds")?.split(",").filter(Boolean) ?? undefined,
      wasteTypeIds: searchParams.get("wasteTypeIds")?.split(",").filter(Boolean) ?? undefined,
    }),
    [searchParams]
  );

  /* Merge with site scoping for non-admin users */
  const filters: ShipmentFilters = React.useMemo(() => {
    if (!allowedSiteIds) return urlFilters;
    /* If user selected specific sites, intersect with allowed; otherwise use all allowed */
    const userSelectedSites = urlFilters.siteIds;
    const scopedSites = userSelectedSites
      ? userSelectedSites.filter((id) => allowedSiteIds.includes(id))
      : allowedSiteIds;
    return { ...urlFilters, siteIds: scopedSites };
  }, [urlFilters, allowedSiteIds]);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "shipmentDate", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [selectedShipment, setSelectedShipment] = React.useState<Shipment | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Shipment | null>(null);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  /* ─── Fetch data from API ─── */
  const sortParam = sorting[0]
    ? { field: sorting[0].id as keyof Shipment, direction: (sorting[0].desc ? "desc" : "asc") as "asc" | "desc" }
    : undefined;

  // Build query params for API
  const apiParams = React.useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
    };
    if (sortParam) {
      params.sortField = sortParam.field;
      params.sortDirection = sortParam.direction;
    }
    if (filters.search) params.search = filters.search;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.siteIds?.length) params.siteIds = filters.siteIds.join(',');
    if (filters.clientIds?.length) params.clientIds = filters.clientIds.join(',');
    if (filters.vendorIds?.length) params.vendorIds = filters.vendorIds.join(',');
    if (filters.wasteTypeIds?.length) params.wasteTypeIds = filters.wasteTypeIds.join(',');
    return params;
  }, [filters, page, pageSize, sortParam]);

  const { shipments, total, loading, refetch } = useShipments(apiParams);

  const result = React.useMemo(() => ({
    data: shipments,
    total,
    page,
    pageSize,
  }), [shipments, total, page, pageSize]);

  /* All data for export - same as filtered data for now */
  const allData = React.useMemo(() => ({
    data: shipments,
    total,
    page: 1,
    pageSize: total,
  }), [shipments, total]);

  /* ─── URL state helpers ─── */
  function updateUrl(newFilters: ShipmentFilters, newPage = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (newFilters.search?.trim()) params.set("search", newFilters.search.trim());
    if (newFilters.dateFrom) params.set("dateFrom", newFilters.dateFrom);
    if (newFilters.dateTo) params.set("dateTo", newFilters.dateTo);
    if (newFilters.siteIds?.length) params.set("siteIds", newFilters.siteIds.join(","));
    if (newFilters.clientIds?.length) params.set("clientIds", newFilters.clientIds.join(","));
    if (newFilters.vendorIds?.length) params.set("vendorIds", newFilters.vendorIds.join(","));
    if (newFilters.wasteTypeIds?.length) params.set("wasteTypeIds", newFilters.wasteTypeIds.join(","));
    const qs = params.toString();
    router.push(qs ? `/shipments?${qs}` : "/shipments");
  }

  function handleFiltersChange(newFilters: ShipmentFilters) {
    updateUrl(newFilters, 1);
  }

  function handleResetFilters() {
    router.push("/shipments");
  }

  function handlePageChange(newPage: number) {
    updateUrl(filters, newPage);
  }

  function handleRefresh() {
    refetch();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      const result = await shipmentsApi.delete(deleteTarget.id);
      if (result.error) {
        toast.error("Failed to delete", { description: result.error });
      } else {
        toast.success("Shipment deleted", {
          description: `${deleteTarget.id} has been removed`,
        });
        refetch();
      }
    } catch {
      toast.error("Failed to delete shipment");
    }
    setDeleteTarget(null);
  }

  /* ─── Columns ─── */
  const columns = React.useMemo(
    () =>
      getShipmentColumns({
        onView: (s) => setSelectedShipment(s),
        onDelete: (s) => setDeleteTarget(s),
      }),
    []
  );

  return (
    <>
      <div className="space-y-6">
        <ShipmentFiltersBar
          filters={urlFilters}
          onChange={handleFiltersChange}
          onReset={handleResetFilters}
          allowedSiteIds={allowedSiteIds}
          trailing={
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    <Columns3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-[min(70vh,400px)] overflow-y-auto w-56">
                  {SHIPMENT_COLUMN_OPTIONS.map(({ id, label }) => (
                    <DropdownMenuItem
                      key={id}
                      onSelect={(e) => e.preventDefault()}
                      className="gap-2"
                    >
                      <Checkbox
                        checked={columnVisibility[id] !== false}
                        onCheckedChange={(checked) => {
                          setColumnVisibility((prev) => ({
                            ...prev,
                            [id]: checked !== false,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Toggle ${label}`}
                      />
                      <span>{label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExportOpen(true)}
              >
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
              </Button>
              <Link href="/shipments/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Shipment</span>
                </Button>
              </Link>
            </>
          }
        />

        <div ref={tableRef}>
        <DataTable
          columns={columns}
          data={result.data}
          getRowId={(row) => row.id}
          pagination={{
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
          }}
          onPaginationChange={handlePageChange}
          sorting={sorting}
          onSortingChange={setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onRowClick={(row) => setSelectedShipment(row)}
          loading={false}
          emptyState={
            <EmptyState
              icon={<Truck className="h-10 w-10" />}
              title="No shipments found"
              description="Try adjusting your filters or create a new shipment."
              action={
                <Link href="/shipments/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> New Shipment
                  </Button>
                </Link>
              }
            />
          }
        />
        </div>
      </div>

      <ShipmentDetailsDrawer
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onDeleted={handleRefresh}
        onUpdated={handleRefresh}
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        data={allData.data}
        filters={filters}
        totalCount={allData.total}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete shipment"
        description={`Are you sure you want to delete ${deleteTarget?.id}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
