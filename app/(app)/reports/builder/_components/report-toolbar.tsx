"use client";

import * as React from "react";
import Link from "next/link";
import { FileDown, Loader2, ArrowLeft, Save, SlidersHorizontal, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import type { Client, Site } from "@/lib/types";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

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
  /* Extended filters */
  transporterName?: string;
  onTransporterChange?: (val: string) => void;
  transporterOptions?: string[];
  containerType?: string;
  onContainerTypeChange?: (val: string) => void;
  containerTypeOptions?: string[];
  receivingState?: string;
  onReceivingStateChange?: (val: string) => void;
  receivingStateOptions?: string[];
  wasteCategory?: string;
  onWasteCategoryChange?: (val: string) => void;
  wasteCategoryOptions?: string[];
  serviceFrequency?: string;
  onServiceFrequencyChange?: (val: string) => void;
  serviceFrequencyOptions?: string[];
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
  transporterName = "",
  onTransporterChange,
  transporterOptions = [],
  containerType = "",
  onContainerTypeChange,
  containerTypeOptions = [],
  receivingState = "",
  onReceivingStateChange,
  receivingStateOptions = [],
  wasteCategory = "",
  onWasteCategoryChange,
  wasteCategoryOptions = [],
  serviceFrequency = "",
  onServiceFrequencyChange,
  serviceFrequencyOptions = [],
}: ReportToolbarProps) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const hasMoreFilters = transporterOptions.length > 0 || containerTypeOptions.length > 0 ||
    receivingStateOptions.length > 0 || wasteCategoryOptions.length > 0 || serviceFrequencyOptions.length > 0;

  return (
    <div className="border-b border-border-default py-3">
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
          className="flex-1 min-w-0 h-9 rounded-[var(--radius-sm)] border border-border-default bg-bg-card px-3 text-sm font-semibold text-text-primary outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-colors placeholder:text-text-muted"
          placeholder="Report title..."
        />
      </div>

      {/* Row 2: Primary filters + Save + Export */}
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
        {hasMoreFilters && (
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

      {/* Row 3: Extended filters (collapsible) */}
      {hasMoreFilters && moreOpen && (
        <div className="flex flex-wrap items-center gap-2.5 mt-2.5 pt-2.5 border-t border-border-default">
          {transporterOptions.length > 0 && onTransporterChange && (
            <SearchableSelect
              options={[
                { value: "all", label: "All Transporters" },
                ...transporterOptions.map((t) => ({ value: t, label: t })),
              ]}
              value={transporterName || "all"}
              onChange={onTransporterChange}
              placeholder="All Transporters"
              className="w-[180px]"
            />
          )}
          {containerTypeOptions.length > 0 && onContainerTypeChange && (
            <SearchableSelect
              options={[
                { value: "all", label: "All Containers" },
                ...containerTypeOptions.map((c) => ({ value: c, label: c })),
              ]}
              value={containerType || "all"}
              onChange={onContainerTypeChange}
              placeholder="All Containers"
              className="w-[180px]"
            />
          )}
          {receivingStateOptions.length > 0 && onReceivingStateChange && (
            <SearchableSelect
              options={[
                { value: "all", label: "All States" },
                ...receivingStateOptions.map((s) => ({ value: s, label: STATE_NAMES[s] ?? s })),
              ]}
              value={receivingState || "all"}
              onChange={onReceivingStateChange}
              placeholder="All States"
              className="w-[180px]"
            />
          )}
          {wasteCategoryOptions.length > 0 && onWasteCategoryChange && (
            <SearchableSelect
              options={[
                { value: "all", label: "All Categories" },
                ...wasteCategoryOptions.map((w) => ({ value: w, label: w })),
              ]}
              value={wasteCategory || "all"}
              onChange={onWasteCategoryChange}
              placeholder="All Categories"
              className="w-[180px]"
            />
          )}
          {serviceFrequencyOptions.length > 0 && onServiceFrequencyChange && (
            <SearchableSelect
              options={[
                { value: "all", label: "All Frequencies" },
                ...serviceFrequencyOptions.map((f) => ({ value: f, label: f })),
              ]}
              value={serviceFrequency || "all"}
              onChange={onServiceFrequencyChange}
              placeholder="All Frequencies"
              className="w-[180px]"
            />
          )}
        </div>
      )}
    </div>
  );
}
