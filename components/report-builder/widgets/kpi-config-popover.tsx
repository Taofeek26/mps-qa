"use client";

import { Settings2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { KPI_DEFINITIONS, getKpiKeys } from "@/lib/report-builder-data";
import type { SectionType, SectionConfig } from "@/lib/report-builder-types";

interface KpiConfigPopoverProps {
  sectionType: SectionType;
  config: SectionConfig;
  onConfigChange: (config: Partial<SectionConfig>) => void;
}

export function KpiConfigPopover({ sectionType, config, onConfigChange }: KpiConfigPopoverProps) {
  const definitions = KPI_DEFINITIONS[sectionType];
  if (!definitions) return null;

  const allKeys = getKpiKeys(sectionType);
  // If visibleKpis is undefined, all are visible
  const visibleKpis = config.visibleKpis ?? allKeys;

  function handleToggle(key: string, checked: boolean) {
    let next: string[];
    if (checked) {
      // Add key, maintain original order
      next = allKeys.filter((k) => k === key || visibleKpis.includes(k));
    } else {
      next = visibleKpis.filter((k) => k !== key);
    }
    // If all are selected, store undefined (show all)
    onConfigChange({
      visibleKpis: next.length === allKeys.length ? undefined : next,
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center w-7 h-7 rounded-md bg-bg-card border border-border-default text-text-muted hover:text-text-primary hover:border-primary-300 transition-colors"
          title="Configure KPIs"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-56 p-0">
        <div className="px-3 py-2.5 border-b border-border-default">
          <p className="text-xs font-semibold text-text-primary">Select KPIs</p>
          <p className="text-[11px] text-text-muted mt-0.5">Choose which metrics to display</p>
        </div>
        <div className="p-2 space-y-0.5">
          {definitions.map((def) => {
            const isChecked = visibleKpis.includes(def.key);
            const isLastChecked = isChecked && visibleKpis.length === 1;

            return (
              <label
                key={def.key}
                className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-bg-subtle transition-colors cursor-pointer"
              >
                <Checkbox
                  checked={isChecked}
                  disabled={isLastChecked}
                  onCheckedChange={(checked) => handleToggle(def.key, checked === true)}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary leading-tight">{def.label}</p>
                  <p className="text-[11px] text-text-muted leading-tight">{def.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
