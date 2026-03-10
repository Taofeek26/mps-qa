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
  // Charts
  | "chart-volume-trend"
  | "chart-cost-comparison"
  | "chart-waste-donut"
  | "chart-top-streams"
  | "chart-cost-waterfall"
  | "chart-vendor-spend"
  // Tables
  | "table-shipment-detail"
  | "table-waste-summary"
  | "table-cost-by-site"
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
