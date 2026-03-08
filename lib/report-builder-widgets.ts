/* ============================================
   MPS Platform — Widget Catalog
   Metadata for all report builder widgets
   ============================================ */

import {
  Package,
  DollarSign,
  ShieldCheck,
  Recycle,
  BarChart3,
  TrendingUp,
  PieChart,
  ListOrdered,
  Layers,
  Building2,
  Table2,
  FileSpreadsheet,
  MapPin,
  StickyNote,
} from "lucide-react";
import type { WidgetDefinition, SectionCategory } from "./report-builder-types";

export const WIDGET_CATALOG: WidgetDefinition[] = [
  // KPI blocks
  {
    type: "kpi-waste-volume",
    label: "Waste Volume Summary",
    description: "Total tons, shipments, avg load, container utilization",
    category: "kpi",
    icon: Package,
    defaultConfig: {},
  },
  {
    type: "kpi-cost-summary",
    label: "Cost Summary",
    description: "MPS cost, customer revenue, margin, cost per ton",
    category: "kpi",
    icon: DollarSign,
    defaultConfig: {},
  },
  {
    type: "kpi-compliance",
    label: "Compliance Summary",
    description: "Manifest coverage, hazardous %, on-time rate",
    category: "kpi",
    icon: ShieldCheck,
    defaultConfig: {},
  },
  {
    type: "kpi-diversion",
    label: "Diversion Summary",
    description: "Diversion rate, recycling tons, landfill tons",
    category: "kpi",
    icon: Recycle,
    defaultConfig: {},
  },
  // Charts
  {
    type: "chart-volume-trend",
    label: "Volume Trend",
    description: "Monthly tonnage bar chart over time",
    category: "chart",
    icon: BarChart3,
    defaultConfig: {},
  },
  {
    type: "chart-cost-comparison",
    label: "Cost Comparison",
    description: "MPS cost vs customer revenue by month",
    category: "chart",
    icon: TrendingUp,
    defaultConfig: {},
  },
  {
    type: "chart-waste-donut",
    label: "Waste Distribution",
    description: "Donut chart by waste category",
    category: "chart",
    icon: PieChart,
    defaultConfig: {},
  },
  {
    type: "chart-top-streams",
    label: "Top Waste Streams",
    description: "Top 10 waste streams by volume",
    category: "chart",
    icon: ListOrdered,
    defaultConfig: {},
  },
  {
    type: "chart-cost-waterfall",
    label: "Cost Waterfall",
    description: "Revenue to net margin flow breakdown",
    category: "chart",
    icon: Layers,
    defaultConfig: {},
  },
  {
    type: "chart-vendor-spend",
    label: "Vendor Spend",
    description: "Cost distribution by vendor",
    category: "chart",
    icon: Building2,
    defaultConfig: {},
  },
  // Tables
  {
    type: "table-shipment-detail",
    label: "Shipment Detail",
    description: "Detailed shipment records with key fields",
    category: "table",
    icon: Table2,
    defaultConfig: { tableRowLimit: 25 },
  },
  {
    type: "table-waste-summary",
    label: "Waste Stream Summary",
    description: "Aggregated by waste type — tons, shipments, cost",
    category: "table",
    icon: FileSpreadsheet,
    defaultConfig: { tableRowLimit: 25 },
  },
  {
    type: "table-cost-by-site",
    label: "Cost by Site",
    description: "Site-level cost and revenue rollup",
    category: "table",
    icon: MapPin,
    defaultConfig: { tableRowLimit: 25 },
  },
  // Content
  {
    type: "notes-block",
    label: "Notes / Commentary",
    description: "Free-text block for analyst notes",
    category: "content",
    icon: StickyNote,
    defaultConfig: { notes: "" },
  },
];

export const CATEGORY_LABELS: Record<SectionCategory, string> = {
  kpi: "Key Metrics",
  chart: "Charts",
  table: "Data Tables",
  content: "Content",
};

export const CATEGORY_ORDER: SectionCategory[] = ["kpi", "chart", "table", "content"];

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
  return WIDGET_CATALOG.find((w) => w.type === type);
}
