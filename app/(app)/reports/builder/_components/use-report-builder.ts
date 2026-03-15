"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import type { ReportSection, SectionType, SectionConfig } from "@/lib/report-builder-types";
import type { SavedReport } from "@/lib/saved-reports";
import { getWidgetDefinition } from "@/lib/report-builder-widgets";
import { getAllShipments, getClients, getSites } from "@/lib/mock-data";
import type { ShipmentFilters, ServiceFrequency } from "@/lib/types";

let nextId = 1;
function generateId(): string {
  return `section-${nextId++}`;
}

function savedToDateRange(saved: SavedReport["dateRange"]): DateRange | undefined {
  if (!saved?.from) return undefined;
  return {
    from: new Date(saved.from),
    to: saved.to ? new Date(saved.to) : new Date(saved.from),
  };
}

export interface ReportBuilderInitialState {
  title: string;
  name: string;
  dateRange: SavedReport["dateRange"];
  clientId: string;
  siteId: string;
  sections: ReportSection[];
}

export function useReportBuilder(initialState?: ReportBuilderInitialState | null) {
  const [title, setTitle] = React.useState(initialState?.title ?? "Untitled Report");
  const [sections, setSections] = React.useState<ReportSection[]>(initialState?.sections ?? []);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    initialState ? savedToDateRange(initialState.dateRange) : undefined
  );
  const [clientId, setClientId] = React.useState(initialState?.clientId ?? "");
  const [siteId, setSiteId] = React.useState(initialState?.siteId ?? "");
  const [transporterName, setTransporterName] = React.useState("");
  const [containerType, setContainerType] = React.useState("");
  const [receivingState, setReceivingState] = React.useState("");
  const [wasteCategory, setWasteCategory] = React.useState("");
  const [serviceFrequency, setServiceFrequency] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);

  const loadState = React.useCallback((saved: ReportBuilderInitialState | null) => {
    if (!saved) {
      setTitle("Untitled Report");
      setSections([]);
      setDateRange(undefined);
      setClientId("");
      setSiteId("");
      setTransporterName("");
      setContainerType("");
      setReceivingState("");
      setWasteCategory("");
      setServiceFrequency("");
      return;
    }
    setTitle(saved.title);
    setSections(saved.sections);
    setDateRange(savedToDateRange(saved.dateRange));
    setClientId(saved.clientId ?? "");
    setSiteId(saved.siteId ?? "");
  }, []);

  const clients = React.useMemo(() => getClients(), []);
  const allSites = React.useMemo(() => getSites(), []);
  const filteredSites = clientId ? allSites.filter((s) => s.clientId === clientId) : allSites;

  const shipments = React.useMemo(() => {
    const filters: ShipmentFilters = {};
    if (clientId) filters.clientIds = [clientId];
    if (siteId) filters.siteIds = [siteId];
    if (dateRange?.from) filters.dateFrom = dateRange.from.toISOString().slice(0, 10);
    if (dateRange?.to) filters.dateTo = dateRange.to.toISOString().slice(0, 10);
    if (transporterName) filters.transporterName = transporterName;
    if (containerType) filters.containerType = containerType;
    if (receivingState) filters.receivingState = receivingState;
    if (wasteCategory) filters.wasteCategory = wasteCategory as ShipmentFilters["wasteCategory"];
    if (serviceFrequency) filters.serviceFrequency = serviceFrequency as ServiceFrequency;
    return getAllShipments(filters);
  }, [clientId, siteId, dateRange, transporterName, containerType, receivingState, wasteCategory, serviceFrequency]);

  /* Unique option lists */
  const allShipmentsForOptions = React.useMemo(() => getAllShipments(), []);

  const transporterOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipmentsForOptions.forEach((s) => { if (s.transporterName) set.add(s.transporterName); });
    return Array.from(set).sort();
  }, [allShipmentsForOptions]);

  const containerTypeOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipmentsForOptions.forEach((s) => { if (s.containerType) set.add(s.containerType); });
    return Array.from(set).sort();
  }, [allShipmentsForOptions]);

  const receivingStateOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipmentsForOptions.forEach((s) => { if (s.receivingState) set.add(s.receivingState); });
    return Array.from(set).sort();
  }, [allShipmentsForOptions]);

  const wasteCategoryOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipmentsForOptions.forEach((s) => { if (s.wasteCategory) set.add(s.wasteCategory); });
    return Array.from(set).sort();
  }, [allShipmentsForOptions]);

  const serviceFrequencyOptions = React.useMemo(() => {
    const set = new Set<string>();
    allShipmentsForOptions.forEach((s) => { if (s.serviceFrequency) set.add(s.serviceFrequency); });
    return Array.from(set).sort();
  }, [allShipmentsForOptions]);

  const addSection = React.useCallback((type: SectionType) => {
    const def = getWidgetDefinition(type);
    if (!def) return;
    setSections((prev) => [
      ...prev,
      { id: generateId(), type, config: { ...def.defaultConfig } },
    ]);
  }, []);

  const removeSection = React.useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const moveSection = React.useCallback((id: string, direction: "up" | "down") => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  const updateConfig = React.useCallback((id: string, config: Partial<SectionConfig>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, config: { ...s.config, ...config } } : s))
    );
  }, []);

  const isSectionAdded = React.useCallback(
    (type: SectionType) => sections.some((s) => s.type === type),
    [sections]
  );

  const handleClientChange = React.useCallback((val: string) => {
    setClientId(val === "all" ? "" : val);
    setSiteId("");
  }, []);

  const handleSiteChange = React.useCallback((val: string) => {
    setSiteId(val === "all" ? "" : val);
  }, []);

  const filterSummary = React.useMemo(() => {
    const parts: string[] = [];
    if (dateRange?.from) {
      const from = dateRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const to = dateRange.to ? dateRange.to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Present";
      parts.push(`${from} — ${to}`);
    } else {
      parts.push("All time");
    }
    if (clientId) {
      const client = clients.find((c) => c.id === clientId);
      if (client) parts.push(client.name);
    }
    if (siteId) {
      const site = allSites.find((s) => s.id === siteId);
      if (site) parts.push(site.name);
    }
    if (transporterName) parts.push(transporterName);
    if (containerType) parts.push(containerType);
    if (receivingState) parts.push(receivingState);
    if (wasteCategory) parts.push(wasteCategory);
    if (serviceFrequency) parts.push(serviceFrequency);
    return parts.join(" \u00b7 ");
  }, [dateRange, clientId, siteId, clients, allSites, transporterName, containerType, receivingState, wasteCategory, serviceFrequency]);

  const snapshot = React.useMemo(
    () => ({
      title,
      dateRange: dateRange?.from
        ? {
            from: dateRange.from.toISOString().slice(0, 10),
            to: dateRange.to ? dateRange.to.toISOString().slice(0, 10) : dateRange.from.toISOString().slice(0, 10),
          }
        : null,
      clientId,
      siteId,
      sections,
    }),
    [title, dateRange, clientId, siteId, sections]
  );

  return {
    title,
    setTitle,
    sections,
    addSection,
    removeSection,
    moveSection,
    updateConfig,
    isSectionAdded,
    loadState,
    snapshot,
    // Filters
    dateRange,
    setDateRange,
    clientId,
    setClientId: handleClientChange,
    siteId,
    setSiteId: handleSiteChange,
    clients,
    filteredSites,
    filterSummary,
    // Extended filters
    transporterName,
    setTransporterName: (v: string) => setTransporterName(v === "all" ? "" : v),
    containerType,
    setContainerType: (v: string) => setContainerType(v === "all" ? "" : v),
    receivingState,
    setReceivingState: (v: string) => setReceivingState(v === "all" ? "" : v),
    wasteCategory,
    setWasteCategory: (v: string) => setWasteCategory(v === "all" ? "" : v),
    serviceFrequency,
    setServiceFrequency: (v: string) => setServiceFrequency(v === "all" ? "" : v),
    // Option lists
    transporterOptions,
    containerTypeOptions,
    receivingStateOptions,
    wasteCategoryOptions,
    serviceFrequencyOptions,
    // Data
    shipments,
    // Export
    isExporting,
    setIsExporting,
  };
}
