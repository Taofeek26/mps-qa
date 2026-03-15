"use client";

import type { Shipment } from "@/lib/types";
import type { SectionType, SectionConfig } from "@/lib/report-builder-types";

import { KpiWasteVolume } from "./kpi-waste-volume";
import { KpiCostSummary } from "./kpi-cost-summary";
import { KpiCompliance } from "./kpi-compliance";
import { KpiDiversion } from "./kpi-diversion";
import { KpiOperational } from "./kpi-operational";
import { KpiSafety } from "./kpi-safety";
import { KpiPlatform } from "./kpi-platform";
import { KpiCustomer } from "./kpi-customer";
import { ChartVolumeTrend } from "./chart-volume-trend";
import { ChartCostComparison } from "./chart-cost-comparison";
import { ChartWasteDonut } from "./chart-waste-donut";
import { ChartTopStreams } from "./chart-top-streams";
import { ChartCostWaterfall } from "./chart-cost-waterfall";
import { ChartVendorSpend } from "./chart-vendor-spend";
import { ChartCostComposition } from "./chart-cost-composition";
import { ChartMarginHeatmap } from "./chart-margin-heatmap";
import { ChartGhgEmissions } from "./chart-ghg-emissions";
import { ChartDiversionTrend } from "./chart-diversion-trend";
import { ChartEfficiencyScatter } from "./chart-efficiency-scatter";
import { ChartTreemap } from "./chart-treemap";
import { ChartIncidentTrend } from "./chart-incident-trend";
import { ChartCsatTrend } from "./chart-csat-trend";
import { ChartArAging } from "./chart-ar-aging";
import { ChartFacilityUtilization } from "./chart-facility-utilization";
import { TableShipmentDetail } from "./table-shipment-detail";
import { TableWasteSummary } from "./table-waste-summary";
import { TableCostBySite } from "./table-cost-by-site";
import { TableRouteMargin } from "./table-route-margin";
import { TableVendorRisk } from "./table-vendor-risk";
import { TableQualityBreakdown } from "./table-quality-breakdown";
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
    case "kpi-operational":
      return <KpiOperational shipments={shipments} config={config} />;
    case "kpi-safety":
      return <KpiSafety config={config} />;
    case "kpi-platform":
      return <KpiPlatform config={config} />;
    case "kpi-customer":
      return <KpiCustomer config={config} />;
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
    case "chart-cost-composition":
      return <ChartCostComposition shipments={shipments} />;
    case "chart-margin-heatmap":
      return <ChartMarginHeatmap shipments={shipments} />;
    case "chart-ghg-emissions":
      return <ChartGhgEmissions shipments={shipments} />;
    case "chart-diversion-trend":
      return <ChartDiversionTrend shipments={shipments} />;
    case "chart-efficiency-scatter":
      return <ChartEfficiencyScatter shipments={shipments} />;
    case "chart-treemap":
      return <ChartTreemap shipments={shipments} />;
    case "chart-incident-trend":
      return <ChartIncidentTrend />;
    case "chart-csat-trend":
      return <ChartCsatTrend />;
    case "chart-ar-aging":
      return <ChartArAging />;
    case "chart-facility-utilization":
      return <ChartFacilityUtilization />;
    case "table-shipment-detail":
      return <TableShipmentDetail shipments={shipments} config={config} />;
    case "table-waste-summary":
      return <TableWasteSummary shipments={shipments} config={config} />;
    case "table-cost-by-site":
      return <TableCostBySite shipments={shipments} config={config} />;
    case "table-route-margin":
      return <TableRouteMargin shipments={shipments} config={config} />;
    case "table-vendor-risk":
      return <TableVendorRisk shipments={shipments} config={config} />;
    case "table-quality-breakdown":
      return <TableQualityBreakdown shipments={shipments} config={config} />;
    case "notes-block":
      return <NotesBlock config={config} onConfigChange={onConfigChange} readOnly={readOnly} />;
    default:
      return null;
  }
}
