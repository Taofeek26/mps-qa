"use client";

import * as React from "react";
import { type CustomCellEditorProps } from "ag-grid-react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectOption } from "./cell-renderers";

/**
 * Custom AG Grid select cell editor.
 * Renders as a popup (use with `cellEditorPopup: true`).
 * Visually matches the design system Select component.
 * Includes a search box for filtering when > 5 options.
 *
 * Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to cancel,
 * type to filter (when search visible).
 */
function SelectCellEditor(
  props: CustomCellEditorProps & { options: SelectOption[] }
) {
  const { value, onValueChange, options, stopEditing, column } = props;
  const [search, setSearch] = React.useState("");
  const [highlighted, setHighlighted] = React.useState(() => {
    const idx = options.findIndex((o) => o.value === value);
    return idx >= 0 ? idx : 0;
  });
  const listRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());

  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const showSearch = options.length > 5;

  /* Focus search input (or the list container) on mount */
  React.useEffect(() => {
    if (showSearch) {
      searchRef.current?.focus();
    } else {
      listRef.current?.focus();
    }
  }, [showSearch]);

  /* Reset highlight when filtered list changes */
  React.useEffect(() => {
    setHighlighted(0);
  }, [filtered.length]);

  /* Auto-scroll highlighted item into view */
  React.useEffect(() => {
    const el = itemRefs.current.get(highlighted);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  /* Keyboard navigation */
  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && highlighted < filtered.length) {
          onValueChange(filtered[highlighted].value);
          stopEditing();
        }
        break;
      case "Escape":
        e.preventDefault();
        stopEditing();
        break;
    }
  }

  function handleSelect(val: string) {
    onValueChange(val);
    stopEditing();
  }

  const cellWidth = column.getActualWidth();
  const highlightedId =
    highlighted >= 0 && highlighted < filtered.length
      ? `select-opt-${filtered[highlighted].value}`
      : undefined;

  return (
    <div
      ref={listRef}
      role="dialog"
      aria-label="Select an option"
      tabIndex={-1}
      className="overflow-hidden rounded-[var(--radius-sm)] border border-border-default bg-bg-card shadow-lg outline-none"
      style={{ minWidth: cellWidth }}
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      {showSearch && (
        <div className="border-b border-border-default px-2 py-1.5">
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-bg-subtle px-2 py-1">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              aria-label="Filter options"
              aria-controls="select-listbox"
              aria-activedescendant={highlightedId}
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
          </div>
        </div>
      )}

      <div
        id="select-listbox"
        role="listbox"
        aria-label="Options"
        className="overflow-y-auto p-1 max-h-56"
      >
        {/* Deselect option */}
        {!search && (
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect("")}
            className={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-[var(--radius-sm)] py-2 pl-8 pr-2 text-sm outline-none transition-colors",
              "text-text-muted hover:bg-gray-100"
            )}
          >
            <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
              {!value && <Check className="h-3.5 w-3.5 text-primary-400" />}
            </span>
            <span className="italic">None</span>
          </button>
        )}

        {/* Filtered options */}
        {filtered.map((opt, i) => {
          const isSelected = opt.value === value;
          const isHighlighted = i === highlighted;
          return (
            <button
              key={opt.value}
              id={`select-opt-${opt.value}`}
              ref={(el) => {
                if (el) itemRefs.current.set(i, el);
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(opt.value)}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-[var(--radius-sm)] py-2 pl-8 pr-2 text-sm outline-none transition-colors",
                "text-text-primary",
                isHighlighted && "bg-gray-100",
                !isHighlighted && "hover:bg-gray-100"
              )}
            >
              <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-primary-400" />
                )}
              </span>
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}

        {/* No results */}
        {filtered.length === 0 && (
          <div className="py-3 text-center text-sm text-text-muted">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}

export { SelectCellEditor };
