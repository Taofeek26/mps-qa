"use client";

import { format } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface SelectOption {
  value: string;
  label: string;
}

/* ─── Select Cell Renderer ─── */

interface SelectCellRendererProps {
  value: string | null | undefined;
  options: SelectOption[];
  placeholder?: string;
}

function SelectCellRenderer({
  value,
  options,
  placeholder = "Select...",
}: SelectCellRendererProps) {
  const label = value
    ? options.find((o) => o.value === value)?.label ?? value
    : null;

  return (
    <div className="flex items-center justify-between w-full h-full gap-1">
      <span
        className={cn(
          "truncate text-sm",
          label ? "text-text-primary" : "text-text-muted"
        )}
      >
        {label ?? placeholder}
      </span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
    </div>
  );
}

/* ─── Date Cell Renderer ─── */

interface DateCellRendererProps {
  value: string | null | undefined;
  placeholder?: string;
}

function DateCellRenderer({
  value,
  placeholder = "Select date...",
}: DateCellRendererProps) {
  const formatted = value
    ? format(new Date(value + "T00:00:00"), "MMM d, yyyy")
    : null;

  return (
    <div className="flex items-center gap-2 w-full h-full">
      <Calendar className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      <span
        className={cn(
          "truncate text-sm",
          formatted ? "text-text-primary" : "text-text-muted"
        )}
      >
        {formatted ?? placeholder}
      </span>
    </div>
  );
}

/* ─── Number Cell Renderer ─── */

interface NumberCellRendererProps {
  value: number | null | undefined;
  placeholder?: string;
}

function NumberCellRenderer({
  value,
  placeholder = "—",
}: NumberCellRendererProps) {
  return (
    <div className="flex items-center justify-end w-full h-full">
      <span
        className={cn(
          "text-sm",
          value != null ? "text-text-primary" : "text-text-muted"
        )}
      >
        {value != null ? value.toLocaleString() : placeholder}
      </span>
    </div>
  );
}

/* ─── Text Cell Renderer ─── */

interface TextCellRendererProps {
  value: string | null | undefined;
  placeholder?: string;
}

function TextCellRenderer({
  value,
  placeholder = "—",
}: TextCellRendererProps) {
  return (
    <span
      className={cn(
        "truncate text-sm",
        value ? "text-text-primary" : "text-text-muted"
      )}
    >
      {value || placeholder}
    </span>
  );
}

export {
  SelectCellRenderer,
  DateCellRenderer,
  NumberCellRenderer,
  TextCellRenderer,
  type SelectOption,
};
