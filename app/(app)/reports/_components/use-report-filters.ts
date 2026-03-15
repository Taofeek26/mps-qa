"use client";

import * as React from "react";
import { subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { DateRangePreset } from "@/components/ui/date-range-picker";
import { getAllShipments, getClients, getSites } from "@/lib/mock-data";
import type { ShipmentFilters, ServiceFrequency } from "@/lib/types";

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

  /* ── New filter dimensions ── */
  const [transporterName, setTransporterName] = React.useState("");
  const [containerType, setContainerType] = React.useState("");
  const [receivingState, setReceivingState] = React.useState("");
  const [receivingCompany, setReceivingCompany] = React.useState("");
  const [serviceFrequency, setServiceFrequency] = React.useState("");
  const [wasteStreamName, setWasteStreamName] = React.useState("");

  const filteredSites = clientId
    ? allSites.filter((s) => s.clientId === clientId)
    : allSites;

  const hasFilters = !!(
    clientId || siteId || dateRange?.from || searchQuery ||
    transporterName || containerType || receivingState ||
    receivingCompany || serviceFrequency || wasteStreamName
  );

  function resetFilters() {
    setClientId("");
    setSiteId("");
    setDateRange(undefined);
    setSearchQuery("");
    setTransporterName("");
    setContainerType("");
    setReceivingState("");
    setReceivingCompany("");
    setServiceFrequency("");
    setWasteStreamName("");
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
    if (transporterName) filters.transporterName = transporterName;
    if (containerType) filters.containerType = containerType;
    if (receivingState) filters.receivingState = receivingState;
    if (receivingCompany) filters.receivingCompany = receivingCompany;
    if (serviceFrequency) filters.serviceFrequency = serviceFrequency as ServiceFrequency;
    if (wasteStreamName) filters.wasteStreamName = wasteStreamName;
    return getAllShipments(filters);
  }, [clientId, siteId, dateRange, includeSite, transporterName, containerType, receivingState, receivingCompany, serviceFrequency, wasteStreamName]);

  /* ── Unique option lists derived from full dataset ── */
  const allShipments = React.useMemo(() => getAllShipments(), []);

  const transporterOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipments.forEach((s) => { if (s.transporterName) set.add(s.transporterName); });
    return Array.from(set).sort();
  }, [allShipments]);

  const containerTypeOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipments.forEach((s) => { if (s.containerType) set.add(s.containerType); });
    return Array.from(set).sort();
  }, [allShipments]);

  const receivingStateOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipments.forEach((s) => { if (s.receivingState) set.add(s.receivingState); });
    return Array.from(set).sort();
  }, [allShipments]);

  const receivingCompanyOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipments.forEach((s) => { if (s.receivingCompany) set.add(s.receivingCompany); });
    return Array.from(set).sort();
  }, [allShipments]);

  const serviceFrequencyOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipments.forEach((s) => { if (s.serviceFrequency) set.add(s.serviceFrequency); });
    return Array.from(set).sort();
  }, [allShipments]);

  const wasteStreamOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipments.forEach((s) => {
      if (s.wasteStreamName) set.add(s.wasteStreamName);
      if (s.wasteTypeName) set.add(s.wasteTypeName);
    });
    return Array.from(set).sort();
  }, [allShipments]);

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
    /* New filter dimensions */
    transporterName, setTransporterName: (v: string) => setTransporterName(v === "all" ? "" : v),
    containerType, setContainerType: (v: string) => setContainerType(v === "all" ? "" : v),
    receivingState, setReceivingState: (v: string) => setReceivingState(v === "all" ? "" : v),
    receivingCompany, setReceivingCompany: (v: string) => setReceivingCompany(v === "all" ? "" : v),
    serviceFrequency, setServiceFrequency: (v: string) => setServiceFrequency(v === "all" ? "" : v),
    wasteStreamName, setWasteStreamName: (v: string) => setWasteStreamName(v === "all" ? "" : v),
    /* Option lists for selects */
    transporterOptions,
    containerTypeOptions,
    receivingStateOptions,
    receivingCompanyOptions,
    serviceFrequencyOptions,
    wasteStreamOptions,
  };
}
