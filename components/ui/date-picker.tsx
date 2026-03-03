"use client";

import * as React from "react";
import { Popover as RadixPopover } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { calendarClassNames, CalendarChevron } from "@/lib/calendar-config";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  error,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

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
            value ? "text-text-primary" : "text-text-muted"
          )}
        >
          <Calendar className="h-4 w-4 text-text-muted shrink-0" />
          {value ? format(value, "MMM d, yyyy") : placeholder}
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
                className="z-50 rounded-[var(--radius-sm)] border border-border-default bg-bg-card p-3 shadow-lg"
              >
                <DayPicker
                  mode="single"
                  selected={value}
                  onSelect={(date) => {
                    onChange?.(date);
                    setOpen(false);
                  }}
                  classNames={calendarClassNames}
                  components={{ Chevron: CalendarChevron }}
                />
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
}

export { DatePicker, type DatePickerProps };
