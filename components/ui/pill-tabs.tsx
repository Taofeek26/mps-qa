"use client";

import * as React from "react";
import { Tabs as RadixTabs } from "radix-ui";
import { cn } from "@/lib/utils";

const PillTabs = RadixTabs.Root;

const PillTabsList = React.forwardRef<
  React.ComponentRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
    <RadixTabs.List
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-border-default bg-bg-subtle p-1",
        className
      )}
      {...props}
    />
  </div>
));
PillTabsList.displayName = "PillTabsList";

interface PillTabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger> {
  count?: number;
}

const PillTabsTrigger = React.forwardRef<
  React.ComponentRef<typeof RadixTabs.Trigger>,
  PillTabsTriggerProps
>(({ className, count, children, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    className={cn(
      "group inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-4 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer",
      "text-text-muted hover:text-text-primary",
      "data-[state=active]:bg-bg-card data-[state=active]:text-text-primary data-[state=active]:font-semibold data-[state=active]:shadow-sm",
      "focus-ring",
      "disabled:pointer-events-none disabled:opacity-40",
      className
    )}
    {...props}
  >
    {children}
    {count !== undefined && (
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-bg-subtle text-text-secondary text-[10px] font-bold px-1 group-data-[state=active]:bg-gray-200 group-data-[state=active]:text-text-primary">
        {count}
      </span>
    )}
  </RadixTabs.Trigger>
));
PillTabsTrigger.displayName = "PillTabsTrigger";

const PillTabsContent = React.forwardRef<
  React.ComponentRef<typeof RadixTabs.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    className={cn("mt-4 focus-visible:outline-none", className)}
    {...props}
  />
));
PillTabsContent.displayName = "PillTabsContent";

export { PillTabs, PillTabsList, PillTabsTrigger, PillTabsContent };
export type { PillTabsTriggerProps };
