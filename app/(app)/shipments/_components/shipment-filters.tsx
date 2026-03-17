"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterChips, type FilterChip } from "@/components/ui/filter-chips";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import type { DateRange } from "react-day-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TextInput } from "@/components/ui/text-input";
import { PullToSearch } from "@/components/ui/pull-to-search";
import { cn } from "@/lib/utils";
import type { ShipmentFilters as Filters, ShipmentStatus, WasteCategory } from "@/lib/types";
import { useSites, useClients, useVendors, useWasteTypes } from "@/lib/hooks/use-api-data";

interface ShipmentFiltersBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  /** If set, only these sites are shown in the Sites filter (for non-admin roles) */
  allowedSiteIds?: string[];
  /** Optional trailing content rendered in the compact bar (e.g. Columns picker) */
  trailing?: React.ReactNode;
}

export function ShipmentFiltersBar({
  filters,
  onChange,
  onReset,
  allowedSiteIds,
  trailing,
}: ShipmentFiltersBarProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Fetch reference data from API
  const { sites: allSites } = useSites();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const { wasteTypes } = useWasteTypes();

  const sites = React.useMemo(() => {
    if (allowedSiteIds) return allSites.filter((s) => allowedSiteIds.includes(s.id));
    return allSites;
  }, [allSites, allowedSiteIds]);

  const siteOptions: MultiSelectOption[] = sites.map((s) => ({ value: s.id, label: s.name }));
  const clientOptions: MultiSelectOption[] = clients.map((c) => ({ value: c.id, label: c.name }));
  const vendorOptions: MultiSelectOption[] = vendors.map((v) => ({ value: v.id, label: v.name }));
  const wasteTypeOptions: MultiSelectOption[] = wasteTypes.map((w) => ({ value: w.id, label: w.name }));

  /* Build active filter chips */
  const chips: FilterChip[] = React.useMemo(() => {
    const result: FilterChip[] = [];

    if (filters.search?.trim()) {
      result.push({ key: "search", label: "Search", value: filters.search.trim() });
    }
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ?? "...";
      const to = filters.dateTo ?? "...";
      result.push({ key: "date", label: "Date", value: `${from} – ${to}` });
    }
    filters.siteIds?.forEach((id) => {
      const site = sites.find((s) => s.id === id);
      if (site) result.push({ key: `site-${id}`, label: "Site", value: site.name });
    });
    filters.clientIds?.forEach((id) => {
      const client = clients.find((c) => c.id === id);
      if (client) result.push({ key: `client-${id}`, label: "Client", value: client.name });
    });
    filters.vendorIds?.forEach((id) => {
      const vendor = vendors.find((v) => v.id === id);
      if (vendor) result.push({ key: `vendor-${id}`, label: "Vendor", value: vendor.name });
    });
    filters.wasteTypeIds?.forEach((id) => {
      const wt = wasteTypes.find((w) => w.id === id);
      if (wt) result.push({ key: `wasteType-${id}`, label: "Waste Type", value: wt.name });
    });
    if (filters.status) {
      result.push({ key: "status", label: "Status", value: filters.status.charAt(0).toUpperCase() + filters.status.slice(1) });
    }
    if (filters.wasteCategory) {
      result.push({ key: "category", label: "Category", value: filters.wasteCategory });
    }

    return result;
  }, [filters, sites, clients, vendors, wasteTypes]);

  /** Count of advanced filters (everything except search) */
  const advancedCount = chips.filter((c) => c.key !== "search").length;
  const totalFilterCount = chips.length;

  function handleDateChange(range: DateRange | undefined) {
    onChange({
      ...filters,
      dateFrom: range?.from?.toISOString().split("T")[0],
      dateTo: range?.to?.toISOString().split("T")[0],
    });
  }

  function handleRemoveChip(key: string) {
    const updated = { ...filters };
    if (key === "search") {
      updated.search = undefined;
    } else if (key === "date") {
      updated.dateFrom = undefined;
      updated.dateTo = undefined;
    } else if (key.startsWith("site-")) {
      updated.siteIds = updated.siteIds?.filter((id) => id !== key.replace("site-", ""));
    } else if (key.startsWith("client-")) {
      updated.clientIds = updated.clientIds?.filter((id) => id !== key.replace("client-", ""));
    } else if (key.startsWith("vendor-")) {
      updated.vendorIds = updated.vendorIds?.filter((id) => id !== key.replace("vendor-", ""));
    } else if (key.startsWith("wasteType-")) {
      updated.wasteTypeIds = updated.wasteTypeIds?.filter((id) => id !== key.replace("wasteType-", ""));
    } else if (key === "status") {
      updated.status = undefined;
    } else if (key === "category") {
      updated.wasteCategory = undefined;
    }
    onChange(updated);
  }

  /* Filter fields for the mobile dialog (no search — handled by pull-to-search) */
  const filterFields = (
    <>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-medium text-text-muted">
          Date range
        </label>
        <DateRangePicker
          from={filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : undefined}
          to={filters.dateTo ? new Date(filters.dateTo + "T00:00:00") : undefined}
          onChange={handleDateChange}
          placeholder="Select dates"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-medium text-text-muted">
          Sites
        </label>
        <MultiSelect
          options={siteOptions}
          value={filters.siteIds ?? []}
          onChange={(v) => onChange({ ...filters, siteIds: v.length ? v : undefined })}
          placeholder="All sites"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-medium text-text-muted">
          Clients
        </label>
        <MultiSelect
          options={clientOptions}
          value={filters.clientIds ?? []}
          onChange={(v) => onChange({ ...filters, clientIds: v.length ? v : undefined })}
          placeholder="All clients"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-medium text-text-muted">
          Vendors
        </label>
        <MultiSelect
          options={vendorOptions}
          value={filters.vendorIds ?? []}
          onChange={(v) => onChange({ ...filters, vendorIds: v.length ? v : undefined })}
          placeholder="All vendors"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-medium text-text-muted">
          Waste types
        </label>
        <MultiSelect
          options={wasteTypeOptions}
          value={filters.wasteTypeIds ?? []}
          onChange={(v) => onChange({ ...filters, wasteTypeIds: v.length ? v : undefined })}
          placeholder="All types"
        />
      </div>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-medium text-text-muted">
          Status
        </label>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => onChange({ ...filters, status: v === "all" ? undefined : v as ShipmentStatus })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-medium text-text-muted">
          Category
        </label>
        <Select
          value={filters.wasteCategory ?? "all"}
          onValueChange={(v) => onChange({ ...filters, wasteCategory: v === "all" ? undefined : v as WasteCategory })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="Non Haz">Non Haz</SelectItem>
            <SelectItem value="Hazardous Waste">Hazardous</SelectItem>
            <SelectItem value="Recycling">Recycling</SelectItem>
            <SelectItem value="Medical">Medical</SelectItem>
            <SelectItem value="E-Waste">E-Waste</SelectItem>
            <SelectItem value="Universal">Universal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
    <div className="space-y-3">
      {/* ─── Mobile: pull-to-reveal search ─── */}
      <PullToSearch
        value={filters.search ?? ""}
        onChange={(v) => onChange({ ...filters, search: v || undefined })}
        placeholder="Search manifest, site, client, vendor..."
      />

      {/* ─── Mobile: filter icon + trailing actions ─── */}
      <div className="flex sm:hidden items-center gap-3">
        <div className="relative">
          <IconButton
            variant="secondary"
            size="sm"
            label="Filters"
            onClick={() => setMobileOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </IconButton>
          {totalFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-400 px-1 text-[10px] font-bold text-text-inverse">
              {totalFilterCount}
            </span>
          )}
        </div>
        {trailing && <div className="ml-auto flex items-center gap-3">{trailing}</div>}
      </div>

      {/* Mobile filter dialog */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {filterFields}
          </div>
          <DialogFooter>
            {totalFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReset();
                  setMobileOpen(false);
                }}
              >
                Clear all
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setMobileOpen(false)}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Desktop: compact toolbar row ─── */}
      <div className="hidden sm:flex flex-wrap items-center gap-3">
        <TextInput
          variant="search"
          placeholder="Search manifest, site, client, vendor..."
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          className="w-full sm:w-72"
        />

        <Button
          variant={panelOpen ? "primary" : "secondary"}
          size="sm"
          onClick={() => setPanelOpen((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {advancedCount > 0 && !panelOpen && (
            <Badge variant="info" className="ml-1 rounded-full px-1.5 py-0 text-[10px] leading-4">
              {advancedCount}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              panelOpen && "rotate-180"
            )}
          />
        </Button>

        {advancedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-text-muted hover:text-text-primary"
          >
            Clear all
          </Button>
        )}

        {/* Trailing slot — Columns picker, etc. */}
        {trailing && <div className="ml-auto flex items-center gap-3">{trailing}</div>}
      </div>

      {/* ─── Desktop: collapsible advanced filters panel ─── */}
      <AnimatePresence initial={false}>
        {panelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="hidden sm:block overflow-hidden"
          >
            <div className="rounded-lg border border-border-default bg-bg-card p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Date range
                  </label>
                  <DateRangePicker
                    from={filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : undefined}
                    to={filters.dateTo ? new Date(filters.dateTo + "T00:00:00") : undefined}
                    onChange={handleDateChange}
                    placeholder="Select dates"
                  />
                </div>
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Sites
                  </label>
                  <MultiSelect
                    options={siteOptions}
                    value={filters.siteIds ?? []}
                    onChange={(v) => onChange({ ...filters, siteIds: v.length ? v : undefined })}
                    placeholder="All sites"
                  />
                </div>
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Clients
                  </label>
                  <MultiSelect
                    options={clientOptions}
                    value={filters.clientIds ?? []}
                    onChange={(v) => onChange({ ...filters, clientIds: v.length ? v : undefined })}
                    placeholder="All clients"
                  />
                </div>
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Vendors
                  </label>
                  <MultiSelect
                    options={vendorOptions}
                    value={filters.vendorIds ?? []}
                    onChange={(v) => onChange({ ...filters, vendorIds: v.length ? v : undefined })}
                    placeholder="All vendors"
                  />
                </div>
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Waste types
                  </label>
                  <MultiSelect
                    options={wasteTypeOptions}
                    value={filters.wasteTypeIds ?? []}
                    onChange={(v) => onChange({ ...filters, wasteTypeIds: v.length ? v : undefined })}
                    placeholder="All types"
                  />
                </div>
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Status
                  </label>
                  <Select
                    value={filters.status ?? "all"}
                    onValueChange={(v) => onChange({ ...filters, status: v === "all" ? undefined : v as ShipmentStatus })}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="void">Void</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Category
                  </label>
                  <Select
                    value={filters.wasteCategory ?? "all"}
                    onValueChange={(v) => onChange({ ...filters, wasteCategory: v === "all" ? undefined : v as WasteCategory })}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="All categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="Non Haz">Non Haz</SelectItem>
                      <SelectItem value="Hazardous Waste">Hazardous</SelectItem>
                      <SelectItem value="Recycling">Recycling</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                      <SelectItem value="E-Waste">E-Waste</SelectItem>
                      <SelectItem value="Universal">Universal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Desktop: filter chips — only when panel is collapsed and filters are active ─── */}
      <AnimatePresence initial={false}>
        {!panelOpen && chips.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="hidden sm:block overflow-hidden"
          >
            <FilterChips
              filters={chips}
              onRemove={handleRemoveChip}
              onClearAll={onReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
