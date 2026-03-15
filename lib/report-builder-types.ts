/* ============================================
   MPS Platform — Report Builder Types
   ============================================ */

import type { LucideIcon } from "lucide-react";

/* ─── Section types ─── */

export type SectionCategory = "kpi" | "chart" | "table" | "content";

export type SectionType =
  // KPI blocks
  | "kpi-waste-volume"
  | "kpi-cost-summary"
  | "kpi-compliance"
  | "kpi-diversion"
  | "kpi-operational"
  | "kpi-safety"
  | "kpi-platform"
  | "kpi-customer"
  // Charts
  | "chart-volume-trend"
  | "chart-cost-comparison"
  | "chart-waste-donut"
  | "chart-top-streams"
  | "chart-cost-waterfall"
  | "chart-vendor-spend"
  | "chart-cost-composition"
  | "chart-margin-heatmap"
  | "chart-ghg-emissions"
  | "chart-diversion-trend"
  | "chart-efficiency-scatter"
  | "chart-treemap"
  | "chart-incident-trend"
  | "chart-csat-trend"
  | "chart-ar-aging"
  | "chart-facility-utilization"
  // Tables
  | "table-shipment-detail"
  | "table-waste-summary"
  | "table-cost-by-site"
  | "table-route-margin"
  | "table-vendor-risk"
  | "table-quality-breakdown"
  // Content
  | "notes-block";

/* ─── Section instance ─── */

export interface ReportSection {
  id: string;
  type: SectionType;
  config: SectionConfig;
}

export interface SectionConfig {
  /** Notes block text */
  notes?: string;
  /** Table row limit for PDF */
  tableRowLimit?: number;
  /** KPI blocks: which individual KPI keys to show. Undefined = show all. */
  visibleKpis?: string[];
}

/* ─── Widget catalog entry ─── */

export interface WidgetDefinition {
  type: SectionType;
  label: string;
  description: string;
  category: SectionCategory;
  icon: LucideIcon;
  defaultConfig: SectionConfig;
}

/* ─── Builder filters ─── */

export interface ReportBuilderFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  siteId?: string;
}
