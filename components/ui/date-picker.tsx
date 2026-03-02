"use client";

import * as React from "react";
import { Popover as RadixPopover } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
                  classNames={{
                    months: "flex flex-col gap-4",
                    month_caption:
                      "flex justify-center items-center h-7 relative",
                    caption_label: "text-sm font-medium text-text-primary",
                    nav: "flex items-center gap-1",
                    button_previous:
                      "absolute left-0 inline-flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] text-text-muted hover:bg-gray-100 transition-colors",
                    button_next:
                      "absolute right-0 inline-flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] text-text-muted hover:bg-gray-100 transition-colors",
                    month_grid: "w-full border-collapse",
                    weekdays: "flex",
                    weekday:
                      "text-text-muted w-9 text-xs font-medium text-center",
                    week: "flex w-full mt-1",
                    day: "h-9 w-9 text-center text-sm p-0 relative",
                    day_button:
                      "h-9 w-9 rounded-[var(--radius-sm)] text-text-primary hover:bg-gray-100 inline-flex items-center justify-center cursor-pointer transition-colors",
                    selected:
                      "bg-primary-400 text-text-inverse hover:bg-primary-500 rounded-[var(--radius-sm)]",
                    today: "font-bold",
                    outside: "text-text-muted opacity-50",
                    disabled:
                      "text-text-muted opacity-40 cursor-not-allowed",
                  }}
                  components={{
                    Chevron: ({ orientation }) =>
                      orientation === "left" ? (
                        <ChevronLeft className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      ),
                  }}
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
