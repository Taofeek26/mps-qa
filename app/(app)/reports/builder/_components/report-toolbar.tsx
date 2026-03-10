"use client";

import Link from "next/link";
import { FileDown, Loader2, ArrowLeft, Save } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Client, Site } from "@/lib/types";

const PRESETS = [
  { label: "Last 6 months", range: { from: new Date(Date.now() - 180 * 86400000), to: new Date() } },
  { label: "Last 12 months", range: { from: new Date(Date.now() - 365 * 86400000), to: new Date() } },
  { label: "Year to date", range: { from: new Date(new Date().getFullYear(), 0, 1), to: new Date() } },
];

interface ReportToolbarProps {
  title: string;
  onTitleChange: (title: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  clientId: string;
  onClientChange: (val: string) => void;
  siteId: string;
  onSiteChange: (val: string) => void;
  clients: Client[];
  sites: Site[];
  sectionCount: number;
  onExport: () => void;
  isExporting: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  showBack?: boolean;
}

export function ReportToolbar({
  title,
  onTitleChange,
  dateRange,
  onDateRangeChange,
  clientId,
  onClientChange,
  siteId,
  onSiteChange,
  clients,
  sites,
  sectionCount,
  onExport,
  isExporting,
  onSave,
  isSaving = false,
  showBack = false,
}: ReportToolbarProps) {
  return (
    <div className="border-b border-border-default px-4 lg:px-6 py-3">
      {/* Row 1: Back + Title */}
      <div className="flex items-center gap-2 mb-3">
        {showBack && (
          <Link href="/reports/builder">
            <Button variant="ghost" size="sm" className="text-text-muted hover:text-text-primary -ml-1">
              <ArrowLeft className="h-4 w-4" />
              Back to my reports
            </Button>
          </Link>
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="flex-1 min-w-0 text-lg font-bold text-text-primary bg-transparent border-none outline-none placeholder:text-text-muted"
          placeholder="Report title..."
        />
      </div>

      {/* Row 2: Filters + Save + Export */}
      <div className="flex flex-wrap items-center gap-2.5">
        <DateRangePicker
          from={dateRange?.from}
          to={dateRange?.to}
          onChange={onDateRangeChange}
          presets={PRESETS}
          placeholder="All time"
          className="w-[200px]"
        />
        <SearchableSelect
          options={[
            { value: "all", label: "All Customers" },
            ...clients.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={clientId || "all"}
          onChange={onClientChange}
          placeholder="All Customers"
          className="w-[180px]"
        />
        <SearchableSelect
          options={[
            { value: "all", label: "All Sites" },
            ...sites.map((s) => ({ value: s.id, label: s.name })),
          ]}
          value={siteId || "all"}
          onChange={onSiteChange}
          placeholder="All Sites"
          className="w-[180px]"
        />
        <div className="ml-auto flex items-center gap-2">
          {onSave && (
            <Button variant="secondary" onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save report"}
            </Button>
          )}
          <Button onClick={onExport} disabled={sectionCount === 0 || isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isExporting ? "Generating..." : "Export PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
