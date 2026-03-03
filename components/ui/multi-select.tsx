"use client";

import * as React from "react";
import { Popover as RadixPopover } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  maxVisibleChips?: number;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = true,
  maxVisibleChips = 2,
  error,
  disabled,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, search]);

  const selectedLabels = React.useMemo(() => {
    const map = new Map(options.map((o) => [o.value, o.label]));
    return value.map((v) => ({ value: v, label: map.get(v) ?? v }));
  }, [options, value]);

  function toggle(val: string) {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  }

  function removeChip(val: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }

  const visibleChips = selectedLabels.slice(0, maxVisibleChips);
  const overflow = selectedLabels.length - maxVisibleChips;

  return (
    <RadixPopover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <RadixPopover.Trigger asChild>
        <div
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          aria-expanded={open}
          aria-disabled={disabled || undefined}
          className={cn(
            "flex min-h-[36px] w-full items-center gap-1.5 rounded-[var(--radius-sm)] border bg-bg-card px-2.5 text-sm text-left transition-colors duration-150 cursor-pointer",
            "focus-ring",
            disabled && "cursor-not-allowed opacity-40 bg-gray-100",
            error
              ? "border-error-400"
              : "border-border-default hover:border-border-strong",
            className
          )}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1 py-1">
            {value.length === 0 && (
              <span className="text-text-muted">{placeholder}</span>
            )}
            {visibleChips.map((chip) => (
              <span
                key={chip.value}
                className="inline-flex items-center gap-1 rounded-[4px] bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-primary"
              >
                {chip.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeChip(chip.value, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      removeChip(chip.value, e as unknown as React.MouseEvent);
                    }
                  }}
                  className="text-text-muted hover:text-text-primary cursor-pointer"
                  aria-label={`Remove ${chip.label}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))}
            {overflow > 0 && (
              <span className="text-xs font-medium text-text-muted">
                +{overflow} more
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {value.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={clearAll}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    clearAll(e as unknown as React.MouseEvent);
                  }
                }}
                className="text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                aria-label="Clear all"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </div>
        </div>
      </RadixPopover.Trigger>

      <AnimatePresence>
        {open && (
          <RadixPopover.Portal forceMount>
            <RadixPopover.Content
              asChild
              sideOffset={4}
              align="start"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[200px] rounded-[var(--radius-sm)] border border-border-default bg-bg-card shadow-lg"
              >
                {searchable && (
                  <div className="flex items-center gap-2 border-b border-border-default px-3 py-2">
                    <Search className="h-4 w-4 text-text-muted shrink-0" />
                    <input
                      ref={inputRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                    />
                  </div>
                )}
                <div className="max-h-60 overflow-y-auto p-1">
                  {filtered.length === 0 && (
                    <p className="px-3 py-4 text-center text-xs text-text-muted">
                      No options found
                    </p>
                  )}
                  {filtered.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggle(option.value)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-left transition-colors",
                          "hover:bg-gray-100 cursor-pointer",
                          isSelected && "text-primary-500"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                            isSelected
                              ? "bg-primary-400 border-primary-400 text-text-inverse"
                              : "border-border-strong bg-bg-card"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3" strokeWidth={3} />
                          )}
                        </div>
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Actions footer */}
                <div className="flex items-center justify-between border-t border-border-default px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onChange(options.map((o) => o.value))}
                    className="text-xs font-medium text-primary-400 hover:text-primary-500 transition-colors"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
}

export { MultiSelect, type MultiSelectProps, type MultiSelectOption };
