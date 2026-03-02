"use client";

import * as React from "react";
import { Popover as RadixPopover } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const Popover = RadixPopover.Root;
const PopoverTrigger = RadixPopover.Trigger;
const PopoverAnchor = RadixPopover.Anchor;

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixPopover.Content> {}

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof RadixPopover.Content>,
  PopoverContentProps
>(({ className, align = "center", sideOffset = 6, children, ...props }, ref) => {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        ref={ref}
        asChild
        align={align}
        sideOffset={sideOffset}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "z-50 w-[calc(100vw-2rem)] sm:w-72 rounded-[var(--radius-sm)] border border-border-default bg-bg-card p-4 shadow-lg outline-none",
            className
          )}
        >
          {children}
        </motion.div>
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
});
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };
