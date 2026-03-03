"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

function FilterChips({
  filters,
  onRemove,
  onClearAll,
  className,
}: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <AnimatePresence mode="popLayout">
        {filters.map((filter) => (
          <motion.span
            key={filter.key}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-500"
          >
            <span className="text-text-muted">{filter.label}:</span>
            <span>{filter.value}</span>
            <button
              type="button"
              onClick={() => onRemove(filter.key)}
              className="ml-0.5 rounded-full p-0.5 text-primary-300 hover:text-primary-500 hover:bg-primary-100 transition-colors"
              aria-label={`Remove ${filter.label} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

export { FilterChips, type FilterChipsProps, type FilterChip };
