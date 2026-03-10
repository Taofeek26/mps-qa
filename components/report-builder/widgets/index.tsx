"use client";

import type { Shipment } from "@/lib/types";
import type { SectionType, SectionConfig } from "@/lib/report-builder-types";

import { KpiWasteVolume } from "./kpi-waste-volume";
import { KpiCostSummary } from "./kpi-cost-summary";
import { KpiCompliance } from "./kpi-compliance";
import { KpiDiversion } from "./kpi-diversion";
import { ChartVolumeTrend } from "./chart-volume-trend";
import { ChartCostComparison } from "./chart-cost-comparison";
import { ChartWasteDonut } from "./chart-waste-donut";
import { ChartTopStreams } from "./chart-top-streams";
import { ChartCostWaterfall } from "./chart-cost-waterfall";
import { ChartVendorSpend } from "./chart-vendor-spend";
import { TableShipmentDetail } from "./table-shipment-detail";
import { TableWasteSummary } from "./table-waste-summary";
import { TableCostBySite } from "./table-cost-by-site";
import { NotesBlock } from "./notes-block";

interface WidgetProps {
  shipments: Shipment[];
  config: SectionConfig;
  onConfigChange?: (config: Partial<SectionConfig>) => void;
  readOnly?: boolean;
}

export function renderWidget(type: SectionType, props: WidgetProps) {
  const { shipments, config, onConfigChange, readOnly } = props;

  switch (type) {
    case "kpi-waste-volume":
      return <KpiWasteVolume shipments={shipments} config={config} />;
    case "kpi-cost-summary":
      return <KpiCostSummary shipments={shipments} config={config} />;
    case "kpi-compliance":
      return <KpiCompliance shipments={shipments} config={config} />;
    case "kpi-diversion":
      return <KpiDiversion shipments={shipments} config={config} />;
    case "chart-volume-trend":
      return <ChartVolumeTrend shipments={shipments} />;
    case "chart-cost-comparison":
      return <ChartCostComparison shipments={shipments} />;
    case "chart-waste-donut":
      return <ChartWasteDonut shipments={shipments} />;
    case "chart-top-streams":
      return <ChartTopStreams shipments={shipments} />;
    case "chart-cost-waterfall":
      return <ChartCostWaterfall shipments={shipments} />;
    case "chart-vendor-spend":
      return <ChartVendorSpend shipments={shipments} />;
    case "table-shipment-detail":
      return <TableShipmentDetail shipments={shipments} config={config} />;
    case "table-waste-summary":
      return <TableWasteSummary shipments={shipments} config={config} />;
    case "table-cost-by-site":
      return <TableCostBySite shipments={shipments} config={config} />;
    case "notes-block":
      return <NotesBlock config={config} onConfigChange={onConfigChange} readOnly={readOnly} />;
    default:
      return null;
  }
}
