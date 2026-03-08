"use client";

import { ChevronUp, ChevronDown, X } from "lucide-react";
import { getWidgetDefinition } from "@/lib/report-builder-widgets";
import type { SectionType } from "@/lib/report-builder-types";

interface SectionWrapperProps {
  type: SectionType;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  children: React.ReactNode;
  /** Hide controls during PDF export */
  hideControls?: boolean;
}

export function SectionWrapper({
  type,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  children,
  hideControls,
}: SectionWrapperProps) {
  const def = getWidgetDefinition(type);

  return (
    <div className="group relative">
      {!hideControls && (
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-bg-card border border-border-default text-text-muted hover:text-text-primary hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-bg-card border border-border-default text-text-muted hover:text-text-primary hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-bg-card border border-border-default text-text-muted hover:text-error-500 hover:border-error-300 transition-colors"
            title="Remove section"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!hideControls && def && (
        <div className="mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
            {def.label}
          </span>
        </div>
      )}

      {children}
    </div>
  );
}
