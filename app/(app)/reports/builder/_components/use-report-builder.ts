"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import type { ReportSection, SectionType, SectionConfig } from "@/lib/report-builder-types";
import type { SavedReport } from "@/lib/saved-reports";
import { getWidgetDefinition } from "@/lib/report-builder-widgets";
import { getAllShipments, getClients, getSites } from "@/lib/mock-data";
import type { ShipmentFilters } from "@/lib/types";

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
  const [isExporting, setIsExporting] = React.useState(false);

  const loadState = React.useCallback((saved: ReportBuilderInitialState | null) => {
    if (!saved) {
      setTitle("Untitled Report");
      setSections([]);
      setDateRange(undefined);
      setClientId("");
      setSiteId("");
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
    return getAllShipments(filters);
  }, [clientId, siteId, dateRange]);

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
    return parts.join(" \u00b7 ");
  }, [dateRange, clientId, siteId, clients, allSites]);

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
    // Data
    shipments,
    // Export
    isExporting,
    setIsExporting,
  };
}
