"use client";

import { Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { WasteTrendsContent } from "./_components/waste-trends-content";
import { CostAnalysisContent } from "./_components/cost-analysis-content";
import { LightLoadContent } from "./_components/light-load-content";
import { RegulatoryContent } from "./_components/regulatory-content";
import { OperationsContent } from "./_components/operations-content";
import { DataQualityContent } from "./_components/data-quality-content";
import { VendorIntelContent } from "./_components/vendor-intel-content";
import { LogisticsContent } from "./_components/logistics-content";
import { EmissionsContent } from "./_components/emissions-content";

const REPORT_TABS = [
  { value: "waste-trends", label: "Waste Trends" },
  { value: "cost-analysis", label: "Cost Analysis" },
  { value: "light-load", label: "Light Load" },
  { value: "regulatory", label: "Regulatory" },
  { value: "operations", label: "Operations" },
  { value: "data-quality", label: "Data Quality" },
  { value: "vendor-intel", label: "Vendor Intel" },
  { value: "logistics", label: "Logistics" },
  { value: "emissions", label: "Emissions" },
];

function ReportsContent() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("waste-trends")
  );

  const currentLabel = REPORT_TABS.find((t) => t.value === tab)?.label ?? "Reports";

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-max sm:w-full">
          {REPORT_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="whitespace-nowrap text-xs sm:text-sm">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <PageHeader
        title={currentLabel}
        actions={
          <Link href="/reports/builder">
            <Button>
              <FileBarChart className="h-4 w-4" />
              Build Custom Report
            </Button>
          </Link>
        }
      />

      <TabsContent value="waste-trends" className="mt-0"><WasteTrendsContent /></TabsContent>
      <TabsContent value="cost-analysis" className="mt-0"><CostAnalysisContent /></TabsContent>
      <TabsContent value="light-load" className="mt-0"><LightLoadContent /></TabsContent>
      <TabsContent value="regulatory" className="mt-0"><RegulatoryContent /></TabsContent>
      <TabsContent value="operations" className="mt-0"><OperationsContent /></TabsContent>
      <TabsContent value="data-quality" className="mt-0"><DataQualityContent /></TabsContent>
      <TabsContent value="vendor-intel" className="mt-0"><VendorIntelContent /></TabsContent>
      <TabsContent value="logistics" className="mt-0"><LogisticsContent /></TabsContent>
      <TabsContent value="emissions" className="mt-0"><EmissionsContent /></TabsContent>
    </Tabs>
  );
}

export default function ReportsPage() {
  return (
    <div>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}>
        <ReportsContent />
      </Suspense>
    </div>
  );
}
