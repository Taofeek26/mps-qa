"use client";

import * as React from "react";
import { Tooltip as RadixTooltip } from "radix-ui";
import { cn } from "@/lib/utils";

function Tooltip({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTooltip.Root>) {
  return (
    <RadixTooltip.Root disableHoverableContent {...props}>
      {children}
    </RadixTooltip.Root>
  );
}

const TooltipTrigger = RadixTooltip.Trigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof RadixTooltip.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <RadixTooltip.Portal>
    <RadixTooltip.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-[var(--radius-sm)] bg-gray-900 px-3 py-1.5 text-xs font-medium text-text-inverse shadow-lg",
        "data-[state=delayed-open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-150",
        className
      )}
      {...props}
    />
  </RadixTooltip.Portal>
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent };
