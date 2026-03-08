import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportContentLayoutProps {
  kpiCards: React.ReactNode;
  filters: React.ReactNode;
  children: React.ReactNode;
  onExport?: () => void;
  exportDisabled?: boolean;
}

export function ReportContentLayout({
  kpiCards,
  filters,
  children,
  onExport,
  exportDisabled,
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
          {onExport && (
            <div className="sm:ml-auto">
              <Button onClick={onExport} disabled={exportDisabled}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Sub-tabs + Content */}
      {children}
    </div>
  );
}
