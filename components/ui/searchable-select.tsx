"use client";

import * as React from "react";
import { Popover as RadixPopover } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  error,
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, search]);

  const selectedLabel = React.useMemo(() => {
    if (!value) return null;
    return options.find((o) => o.value === value)?.label ?? value;
  }, [options, value]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  return (
    <RadixPopover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-[var(--radius-sm)] border bg-bg-card px-3 text-sm text-left transition-colors duration-150 cursor-pointer",
            "focus-ring",
            disabled && "cursor-not-allowed opacity-40 bg-gray-100",
            error
              ? "border-error-400"
              : "border-border-default hover:border-border-strong",
            selectedLabel ? "text-text-primary" : "text-text-muted",
            className
          )}
        >
          <span className="truncate">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")} />
        </button>
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
                <div className="max-h-60 overflow-y-auto p-1">
                  {filtered.length === 0 && (
                    <p className="px-3 py-4 text-center text-xs text-text-muted">
                      No options found
                    </p>
                  )}
                  {filtered.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "relative flex w-full items-center rounded-[var(--radius-sm)] py-2 pl-8 pr-2 text-sm text-left transition-colors",
                          "hover:bg-gray-100 cursor-pointer",
                          isSelected && "text-primary-500"
                        )}
                      >
                        {isSelected && (
                          <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-primary-400" />
                          </span>
                        )}
                        <span className="truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
}

export {
  SearchableSelect,
  type SearchableSelectProps,
  type SearchableSelectOption,
};
