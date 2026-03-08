"use client";

import * as React from "react";
import { Select as RadixSelect } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = RadixSelect.Root;
const SelectGroup = RadixSelect.Group;
const SelectValue = RadixSelect.Value;

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger> & {
    error?: boolean;
  }
>(({ className, children, error, ...props }, ref) => (
  <RadixSelect.Trigger
    ref={ref}
    className={cn(
      "group flex h-9 w-full items-center justify-between rounded-[var(--radius-sm)] border bg-bg-card px-3 text-sm text-text-primary transition-colors duration-150 cursor-pointer",
      "focus-ring",
      "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-gray-100",
      error
        ? "border-error-400"
        : "border-border-default hover:border-border-strong",
      className
    )}
    {...props}
  >
    {children}
    <RadixSelect.Icon asChild>
      <ChevronDown className="h-4 w-4 text-text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </RadixSelect.Icon>
  </RadixSelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <RadixSelect.Portal>
    <RadixSelect.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-[var(--radius-sm)] border border-border-default bg-bg-card shadow-lg",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <RadixSelect.ScrollUpButton className="flex items-center justify-center h-6 cursor-default">
        <ChevronUp className="h-4 w-4 text-text-muted" />
      </RadixSelect.ScrollUpButton>
      <RadixSelect.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </RadixSelect.Viewport>
      <RadixSelect.ScrollDownButton className="flex items-center justify-center h-6 cursor-default">
        <ChevronDown className="h-4 w-4 text-text-muted" />
      </RadixSelect.ScrollDownButton>
    </RadixSelect.Content>
  </RadixSelect.Portal>
));
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Label>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Label>
>(({ className, ...props }, ref) => (
  <RadixSelect.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-xs font-medium text-text-muted",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ className, children, ...props }, ref) => (
  <RadixSelect.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-[var(--radius-sm)] py-2 pl-8 pr-2 text-sm text-text-primary outline-none transition-colors",
      "focus:bg-gray-100",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <RadixSelect.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-primary-400" />
      </RadixSelect.ItemIndicator>
    </span>
    <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
  </RadixSelect.Item>
));
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Separator>
>(({ className, ...props }, ref) => (
  <RadixSelect.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border-default", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
