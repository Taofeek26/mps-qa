"use client";

import * as React from "react";
import { Popover as RadixPopover } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { Calendar } from "lucide-react";
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

  const selected: DateRange | undefined =
    from || to ? { from, to } : undefined;

  function formatRange(): string {
    if (!from) return placeholder;
    if (!to) return format(from, "MMM d, yyyy");
    return `${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`;
  }

  function handlePreset(range: DateRange) {
    onChange(range);
    setOpen(false);
  }

  const rangeCalendarClassNames = {
    ...calendarClassNames,
    months: "flex flex-col sm:flex-row gap-4",
    ...rangeClassNames,
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-[var(--radius-sm)] border bg-bg-card px-3 text-sm text-left transition-colors duration-150",
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
          <span className="truncate">{formatRange()}</span>
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

                  {/* Calendar */}
                  <div className="p-3">
                    <DayPicker
                      mode="range"
                      selected={selected}
                      onSelect={(range) => onChange(range)}
                      numberOfMonths={2}
                      classNames={rangeCalendarClassNames}
                      components={{ Chevron: CalendarChevron }}
                    />
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
