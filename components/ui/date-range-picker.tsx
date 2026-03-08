"use client";

import * as React from "react";
import { Popover as RadixPopover } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { calendarClassNames, rangeClassNames, CalendarChevron } from "@/lib/calendar-config";
import { Button } from "@/components/ui/button";

interface DateRangePreset {
  label: string;
  range: DateRange;
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: "Last 7 days",
    range: { from: subDays(new Date(), 7), to: new Date() },
  },
  {
    label: "Last 30 days",
    range: { from: subDays(new Date(), 30), to: new Date() },
  },
  {
    label: "This month",
    range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
  },
];

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onChange: (range: DateRange | undefined) => void;
  presets?: DateRangePreset[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

function formatPendingLabel(range: DateRange | undefined): string {
  if (!range?.from) return "Select start date";
  if (!range.to) return `${format(range.from, "MMM d, yyyy")} — select end date`;
  return `${format(range.from, "MMM d, yyyy")} — ${format(range.to, "MMM d, yyyy")}`;
}

function DateRangePicker({
  from,
  to,
  onChange,
  presets = DEFAULT_PRESETS,
  placeholder = "Select date range",
  error,
  disabled,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<DateRange | undefined>(
    from || to ? { from, to } : undefined
  );

  // Sync pending state when popover opens
  React.useEffect(() => {
    if (open) {
      setPending(from || to ? { from, to } : undefined);
    }
  }, [open, from, to]);

  const committed: DateRange | undefined =
    from || to ? { from, to } : undefined;

  function formatRange(): string {
    if (!from) return placeholder;
    if (!to) return format(from, "MMM d, yyyy");
    return `${format(from, "MMM d")} — ${format(to, "MMM d, yyyy")}`;
  }

  function handlePreset(range: DateRange) {
    // Presets are complete ranges — apply immediately
    onChange(range);
    setOpen(false);
  }

  function handleApply() {
    onChange(pending);
    setOpen(false);
  }

  function handleClear() {
    onChange(undefined);
    setOpen(false);
  }

  function handleCancel() {
    setPending(committed);
    setOpen(false);
  }

  const rangeCalendarClassNames = {
    ...calendarClassNames,
    months: "relative flex flex-col sm:flex-row gap-4",
    ...rangeClassNames,
  };

  const hasPendingSelection = !!(pending?.from && pending?.to);

  return (
    <RadixPopover.Root open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setPending(committed);
      }
      setOpen(isOpen);
    }}>
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-[var(--radius-sm)] border bg-bg-card px-3 text-sm text-left transition-colors duration-150 cursor-pointer",
            "focus-ring",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-gray-100",
            error
              ? "border-error-400"
              : "border-border-default hover:border-border-strong",
            from ? "text-text-primary" : "text-text-muted",
            className
          )}
        >
          <Calendar className="h-4 w-4 text-text-muted shrink-0" />
          <span className="flex-1 truncate">{formatRange()}</span>
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
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="z-50 rounded-[var(--radius-sm)] border border-border-default bg-bg-card shadow-lg"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Presets */}
                  {presets.length > 0 && (
                    <div className="border-b sm:border-b-0 sm:border-r border-border-default p-3 sm:w-36 flex sm:flex-col gap-1">
                      {presets.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="ghost"
                          size="sm"
                          className="justify-start text-xs w-full"
                          onClick={() => handlePreset(preset.range)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Calendar + Footer */}
                  <div className="p-3 flex flex-col">
                    <DayPicker
                      mode="range"
                      selected={pending}
                      onSelect={(range) => setPending(range)}
                      numberOfMonths={2}
                      classNames={rangeCalendarClassNames}
                      components={{ Chevron: CalendarChevron }}
                    />

                    {/* Selection summary + actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-default">
                      <span className="text-xs text-text-muted">
                        {formatPendingLabel(pending)}
                      </span>
                      <div className="flex items-center gap-2">
                        {committed && (
                          <Button variant="ghost" size="sm" onClick={handleClear}>
                            <X className="h-3.5 w-3.5" />
                            Clear
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleApply} disabled={!hasPendingSelection}>
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
}

export { DateRangePicker, type DateRangePickerProps, type DateRangePreset };
