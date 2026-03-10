"use client";

import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIDGET_CATALOG, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/report-builder-widgets";
import type { SectionType } from "@/lib/report-builder-types";

interface SectionGalleryProps {
  onAdd: (type: SectionType) => void;
  onRemove: (type: SectionType) => void;
  isSectionAdded: (type: SectionType) => boolean;
}

export function SectionGallery({ onAdd, onRemove, isSectionAdded }: SectionGalleryProps) {
  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map((category) => {
        const widgets = WIDGET_CATALOG.filter((w) => w.category === category);
        if (widgets.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2.5 px-1">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="space-y-1.5">
              {widgets.map((widget) => {
                const added = isSectionAdded(widget.type);
                const Icon = widget.icon;

                return (
                  <button
                    key={widget.type}
                    type="button"
                    onClick={() => (added ? onRemove(widget.type) : onAdd(widget.type))}
                    className={cn(
                      "w-full flex items-start gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors",
                      added
                        ? "bg-button-50 border border-button-200"
                        : "bg-bg-card border border-border-default hover:border-border-strong hover:bg-bg-subtle"
                    )}
                  >
                    <div
                      className={cn(
                        "flex-none flex items-center justify-center w-7 h-7 rounded-md mt-0.5",
                        added ? "bg-button-400 text-text-inverse" : "bg-bg-subtle text-text-muted"
                      )}
                    >
                      {added ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-xs font-medium truncate", added ? "text-button-600" : "text-text-primary")}>
                          {widget.label}
                        </span>
                        {!added && <Plus className="h-3 w-3 flex-none text-text-muted opacity-0 group-hover:opacity-100" />}
                      </div>
                      <p className="text-[10px] text-text-muted leading-tight mt-0.5 line-clamp-1">
                        {widget.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
