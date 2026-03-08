import * as React from "react";
import { Download, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportContentLayoutProps {
  kpiCards: React.ReactNode;
  filters: React.ReactNode;
  children: React.ReactNode;
  onExport?: () => void;
  exportDisabled?: boolean;
  onExportPdf?: () => void;
  isPdfExporting?: boolean;
}

export function ReportContentLayout({
  kpiCards,
  filters,
  children,
  onExport,
  exportDisabled,
  onExportPdf,
  isPdfExporting,
}: ReportContentLayoutProps) {
  return (
    <div className="space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 sm:gap-4">
        {kpiCards}
      </div>

      {/* 2. Filters Row */}
      <div className="-mx-4 lg:-mx-6 px-4 lg:px-6 py-3">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          {filters}
          <div className="sm:ml-auto flex items-center gap-2">
            {onExportPdf && (
              <Button variant="secondary" onClick={onExportPdf} disabled={exportDisabled || isPdfExporting}>
                {isPdfExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {isPdfExporting ? "Generating..." : "Export PDF"}
              </Button>
            )}
            {onExport && (
              <Button onClick={onExport} disabled={exportDisabled}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sub-tabs + Content */}
      {children}
    </div>
  );
}
