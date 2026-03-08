import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Shared DayPicker classNames used by DatePicker, DateRangePicker,
 * and the AG Grid date cell editor to ensure visual consistency.
 */
export const calendarClassNames = {
  months: "relative flex flex-col gap-4",
  month_caption: "flex justify-center items-center h-7 mb-2",
  caption_label: "text-sm font-medium text-text-primary",
  nav: "absolute top-0 left-0 right-0 flex items-center justify-between h-7 z-10",
  button_previous:
    "inline-flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] text-text-muted hover:bg-gray-100 transition-colors cursor-pointer",
  button_next:
    "inline-flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)] text-text-muted hover:bg-gray-100 transition-colors cursor-pointer",
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday: "text-text-muted w-9 text-xs font-medium text-center",
  week: "flex w-full mt-1",
  day: "h-9 w-9 text-center text-sm p-0 relative",
  day_button:
    "h-9 w-9 rounded-[var(--radius-sm)] text-text-primary hover:bg-gray-100 inline-flex items-center justify-center cursor-pointer transition-colors",
  selected:
    "bg-primary-400 text-text-inverse hover:bg-primary-500 rounded-[var(--radius-sm)]",
  today: "font-bold",
  outside: "text-text-muted opacity-50",
  disabled: "text-text-muted opacity-40 cursor-not-allowed",
};

/** Range-specific classNames — merged with calendarClassNames for DateRangePicker. */
export const rangeClassNames = {
  range_start: "rounded-r-none",
  range_end: "rounded-l-none",
  range_middle: "bg-primary-50 text-primary-500 rounded-none",
};

/** Shared chevron component for DayPicker navigation. */
export function CalendarChevron({ orientation }: { orientation?: string }) {
  return orientation === "left" ? (
    <ChevronLeft className="h-4 w-4" />
  ) : (
    <ChevronRight className="h-4 w-4" />
  );
}
