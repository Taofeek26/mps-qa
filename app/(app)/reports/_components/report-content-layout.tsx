"use client";

import * as React from "react";
import { Download, FileDown, Loader2, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ReportContentLayoutProps {
  kpiCards: React.ReactNode;
  /** Primary filters — always visible inline on desktop */
  filters: React.ReactNode;
  /** Secondary filters — collapsed behind "More Filters" on desktop */
  moreFilters?: React.ReactNode;
  children: React.ReactNode;
  onExport?: () => void;
  exportDisabled?: boolean;
  onExportPdf?: () => void;
  isPdfExporting?: boolean;
  onResetFilters?: () => void;
  hasFilters?: boolean;
}

export function ReportContentLayout({
  kpiCards,
  filters,
  moreFilters,
  children,
  onExport,
  exportDisabled,
  onExportPdf,
  isPdfExporting,
  onResetFilters,
  hasFilters,
}: ReportContentLayoutProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* 1. Filters Row */}
      <div className="-mx-4 lg:-mx-6 px-4 lg:px-6 py-3">
        {/* Desktop: inline filters */}
        <div className="hidden sm:flex flex-wrap items-center gap-3">
          {filters}
          {moreFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMoreOpen((p) => !p)}
              className="text-text-muted"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              More Filters
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} />
            </Button>
          )}
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

        {/* Desktop: expanded secondary filters */}
        {moreFilters && moreOpen && (
          <div className="hidden sm:flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border-default">
            {moreFilters}
          </div>
        )}

        {/* Mobile: filter icon + icon-only export buttons */}
        <div className="flex sm:hidden items-center gap-2">
          <div className="relative">
            <IconButton
              variant="secondary"
              size="sm"
              label="Filters"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </IconButton>
            {hasFilters && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-primary-400" />
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {onExportPdf && (
              <IconButton
                variant="secondary"
                size="sm"
                label={isPdfExporting ? "Generating PDF..." : "Export PDF"}
                onClick={onExportPdf}
                disabled={exportDisabled || isPdfExporting}
              >
                {isPdfExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
              </IconButton>
            )}
            {onExport && (
              <IconButton
                variant="primary"
                size="sm"
                label="Export CSV"
                onClick={onExport}
                disabled={exportDisabled}
              >
                <Download className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        </div>

        {/* Mobile: filter dialog — shows ALL filters */}
        <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {filters}
              {moreFilters}
            </div>
            <DialogFooter>
              {onResetFilters && hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onResetFilters();
                    setMobileFiltersOpen(false);
                  }}
                >
                  Clear all
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. KPI Cards */}
      <div className="kpi-grid grid grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 sm:gap-4">
        {kpiCards}
      </div>

      {/* 3. Sub-tabs + Content */}
      {children}
    </div>
  );
}
