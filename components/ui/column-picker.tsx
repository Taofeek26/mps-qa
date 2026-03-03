"use client";

import * as React from "react";
import { Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface ColumnPickerColumn {
  id: string;
  label: string;
  visible: boolean;
}

interface ColumnPickerProps {
  columns: ColumnPickerColumn[];
  onChange: (id: string, visible: boolean) => void;
  onReset: () => void;
  onSelectAll: () => void;
  className?: string;
}

function ColumnPicker({
  columns,
  onChange,
  onReset,
  onSelectAll,
  className,
}: ColumnPickerProps) {
  const allVisible = columns.every((c) => c.visible);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton
          variant="secondary"
          size="sm"
          label="Toggle columns"
          className={className}
        >
          <Columns3 className="h-4 w-4" />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
          <p className="text-xs font-semibold text-text-primary">Columns</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className={cn(
                "text-xs font-medium transition-colors",
                allVisible
                  ? "text-text-muted"
                  : "text-primary-400 hover:text-primary-500"
              )}
              disabled={allVisible}
            >
              Select all
            </button>
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-0.5">
          {columns.map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Checkbox
                checked={col.visible}
                onCheckedChange={(checked) =>
                  onChange(col.id, checked === true)
                }
              />
              <span className="truncate">{col.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { ColumnPicker, type ColumnPickerProps, type ColumnPickerColumn };
