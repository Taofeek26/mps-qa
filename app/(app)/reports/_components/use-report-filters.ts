"use client";

import * as React from "react";
import { subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { DateRangePreset } from "@/components/ui/date-range-picker";
import { getAllShipments, getClients, getSites } from "@/lib/mock-data";
import type { ShipmentFilters } from "@/lib/types";

export const REPORT_PRESETS: DateRangePreset[] = [
  { label: "Last 6 months", range: { from: subMonths(new Date(), 6), to: new Date() } },
  { label: "Last 12 months", range: { from: subMonths(new Date(), 12), to: new Date() } },
  { label: "Year to date", range: { from: new Date(new Date().getFullYear(), 0, 1), to: new Date() } },
];

interface UseReportFiltersOptions {
  includeSite?: boolean;
}

export function useReportFilters(options: UseReportFiltersOptions = {}) {
  const { includeSite = true } = options;

  const clients = React.useMemo(() => getClients(), []);
  const allSites = React.useMemo(() => getSites(), []);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [clientId, setClientId] = React.useState("");
  const [siteId, setSiteId] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredSites = clientId
    ? allSites.filter((s) => s.clientId === clientId)
    : allSites;

  const hasFilters = !!(clientId || siteId || dateRange?.from || searchQuery);

  function resetFilters() {
    setClientId("");
    setSiteId("");
    setDateRange(undefined);
    setSearchQuery("");
  }

  function handleClientChange(val: string) {
    setClientId(val === "all" ? "" : val);
    setSiteId("");
  }

  function handleSiteChange(val: string) {
    setSiteId(val === "all" ? "" : val);
  }

  const shipments = React.useMemo(() => {
    const filters: ShipmentFilters = {};
    if (clientId) filters.clientIds = [clientId];
    if (includeSite && siteId) filters.siteIds = [siteId];
    if (dateRange?.from) filters.dateFrom = dateRange.from.toISOString().slice(0, 10);
    if (dateRange?.to) filters.dateTo = dateRange.to.toISOString().slice(0, 10);
    return getAllShipments(filters);
  }, [clientId, siteId, dateRange, includeSite]);

  return {
    clients,
    allSites,
    filteredSites,
    dateRange,
    setDateRange,
    clientId,
    setClientId: handleClientChange,
    siteId,
    setSiteId: handleSiteChange,
    searchQuery,
    setSearchQuery,
    hasFilters,
    resetFilters,
    shipments,
  };
}
