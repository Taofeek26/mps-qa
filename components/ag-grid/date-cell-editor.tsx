"use client";

import * as React from "react";
import { type CustomCellEditorProps } from "ag-grid-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { calendarClassNames, CalendarChevron } from "@/lib/calendar-config";

/**
 * Custom AG Grid date cell editor.
 * Renders as a popup (use with `cellEditorPopup: true`).
 * Shows the same DayPicker calendar as the design system DatePicker.
 *
 * Keyboard: DayPicker native arrow keys to navigate days,
 * Enter to select, Escape to close without saving.
 */
function DateCellEditor(props: CustomCellEditorProps) {
  const { value, onValueChange, stopEditing } = props;

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  function handleSelect(date: Date | undefined) {
    if (date) {
      onValueChange(format(date, "yyyy-MM-dd"));
      stopEditing();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      stopEditing();
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Choose a date"
      className="rounded-[var(--radius-sm)] border border-border-default bg-bg-card px-3 pb-3 pt-4 shadow-lg"
      onKeyDown={handleKeyDown}
    >
      <DayPicker
        mode="single"
        selected={selectedDate}
        defaultMonth={selectedDate ?? new Date()}
        onSelect={handleSelect}
        classNames={calendarClassNames}
        components={{ Chevron: CalendarChevron }}
      />
    </div>
  );
}

export { DateCellEditor };
