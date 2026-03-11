"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Spinner } from "@/components/ui/spinner";
import { WasteTrendsContent } from "./_components/waste-trends-content";
import { CostAnalysisContent } from "./_components/cost-analysis-content";
import { LightLoadContent } from "./_components/light-load-content";
import { RegulatoryContent } from "./_components/regulatory-content";
import { OperationsContent } from "./_components/operations-content";
import { DataQualityContent } from "./_components/data-quality-content";
import { VendorIntelContent } from "./_components/vendor-intel-content";
import { LogisticsContent } from "./_components/logistics-content";
import { EmissionsContent } from "./_components/emissions-content";

const REPORT_CONTENT: Record<string, React.ComponentType> = {
  "waste-trends": WasteTrendsContent,
  "cost-analysis": CostAnalysisContent,
  "light-load": LightLoadContent,
  regulatory: RegulatoryContent,
  operations: OperationsContent,
  "data-quality": DataQualityContent,
  "vendor-intel": VendorIntelContent,
  logistics: LogisticsContent,
  emissions: EmissionsContent,
};

function ReportsContent() {
  const [tab] = useQueryState("tab", parseAsString.withDefault("waste-trends"));

  const Content = REPORT_CONTENT[tab] ?? WasteTrendsContent;

  return <Content />;
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
