"use client";

import * as React from "react";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterChips, type FilterChip } from "@/components/ui/filter-chips";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import type { DateRange } from "react-day-picker";
import type { ShipmentFilters as Filters } from "@/lib/types";
import { getSites, getClients, getVendors, getWasteTypes } from "@/lib/mock-data";

interface ShipmentFiltersBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onReset: () => void;
  /** If set, only these sites are shown in the Sites filter (for site_user role) */
  allowedSiteIds?: string[];
}

export function ShipmentFiltersBar({
  filters,
  onChange,
  onReset,
  allowedSiteIds,
}: ShipmentFiltersBarProps) {
  const sites = React.useMemo(() => {
    const all = getSites();
    if (allowedSiteIds) return all.filter((s) => allowedSiteIds.includes(s.id));
    return all;
  }, [allowedSiteIds]);
  const clients = React.useMemo(() => getClients(), []);
  const vendors = React.useMemo(() => getVendors(), []);
  const wasteTypes = React.useMemo(() => getWasteTypes(), []);

  const siteOptions: MultiSelectOption[] = sites.map((s) => ({ value: s.id, label: s.name }));
  const clientOptions: MultiSelectOption[] = clients.map((c) => ({ value: c.id, label: c.name }));
  const vendorOptions: MultiSelectOption[] = vendors.map((v) => ({ value: v.id, label: v.name }));
  const wasteTypeOptions: MultiSelectOption[] = wasteTypes.map((w) => ({ value: w.id, label: w.name }));

  /* Build active filter chips */
  const chips: FilterChip[] = React.useMemo(() => {
    const result: FilterChip[] = [];

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

    return result;
  }, [filters, sites, clients, vendors, wasteTypes]);

  function handleDateChange(range: DateRange | undefined) {
    onChange({
      ...filters,
      dateFrom: range?.from?.toISOString().split("T")[0],
      dateTo: range?.to?.toISOString().split("T")[0],
    });
  }

  function handleRemoveChip(key: string) {
    const updated = { ...filters };
    if (key === "date") {
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
    }
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <FilterBar onReset={onReset}>
        <div className="w-full sm:w-48">
          <DateRangePicker
            from={filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : undefined}
            to={filters.dateTo ? new Date(filters.dateTo + "T00:00:00") : undefined}
            onChange={handleDateChange}
            placeholder="Date range"
          />
        </div>
        <div className="w-full sm:w-44">
          <MultiSelect
            options={siteOptions}
            value={filters.siteIds ?? []}
            onChange={(v) => onChange({ ...filters, siteIds: v.length ? v : undefined })}
            placeholder="Sites"
          />
        </div>
        <div className="w-full sm:w-44">
          <MultiSelect
            options={clientOptions}
            value={filters.clientIds ?? []}
            onChange={(v) => onChange({ ...filters, clientIds: v.length ? v : undefined })}
            placeholder="Clients"
          />
        </div>
        <div className="w-full sm:w-44">
          <MultiSelect
            options={vendorOptions}
            value={filters.vendorIds ?? []}
            onChange={(v) => onChange({ ...filters, vendorIds: v.length ? v : undefined })}
            placeholder="Vendors"
          />
        </div>
        <div className="w-full sm:w-44">
          <MultiSelect
            options={wasteTypeOptions}
            value={filters.wasteTypeIds ?? []}
            onChange={(v) => onChange({ ...filters, wasteTypeIds: v.length ? v : undefined })}
            placeholder="Waste Types"
          />
        </div>
      </FilterBar>

      <FilterChips
        filters={chips}
        onRemove={handleRemoveChip}
        onClearAll={onReset}
      />
    </div>
  );
}
