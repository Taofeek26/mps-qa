"use client";

import * as React from "react";
import { Dialog as RadixDialog } from "radix-ui";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawerSide = "right" | "left";

const Drawer = RadixDialog.Root;
const DrawerTrigger = RadixDialog.Trigger;
const DrawerClose = RadixDialog.Close;

interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  side?: DrawerSide;
}

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof RadixDialog.Content>,
  DrawerContentProps
>(({ className, children, side = "right", ...props }, ref) => (
  <RadixDialog.Portal>
    <RadixDialog.Overlay asChild>
      <motion.div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      />
    </RadixDialog.Overlay>
    <RadixDialog.Content ref={ref} asChild {...props}>
      <motion.div
        initial={{ x: side === "right" ? "100%" : "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: side === "right" ? "100%" : "-100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className={cn(
          "fixed top-0 z-50 flex h-full w-full max-w-md flex-col bg-bg-card shadow-2xl focus:outline-none",
          side === "right" ? "right-0" : "left-0",
          className
        )}
      >
        {/* Top accent strip */}
        <div
          className={cn(
            "h-1 shrink-0 bg-gradient-to-r from-primary-400 to-primary-300",
            side === "right" ? "rounded-tl-sm" : "rounded-tr-sm"
          )}
        />

        {/* Close button */}
        <RadixDialog.Close
          className={cn(
            "absolute top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-gray-200 transition-colors cursor-pointer focus-ring",
            side === "right" ? "right-4" : "left-4"
          )}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span className="sr-only">Close</span>
        </RadixDialog.Close>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </RadixDialog.Content>
  </RadixDialog.Portal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "border-b border-border-default bg-bg-subtle px-6 pb-4 pt-5 space-y-1",
      className
    )}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerTitle = React.forwardRef<
  React.ComponentRef<typeof RadixDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(({ className, ...props }, ref) => (
  <RadixDialog.Title
    ref={ref}
    className={cn("text-base font-bold text-text-primary", className)}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  React.ComponentRef<typeof RadixDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ className, ...props }, ref) => (
  <RadixDialog.Description
    ref={ref}
    className={cn("text-sm text-text-muted font-mono", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-5", className)} {...props} />
);
DrawerBody.displayName = "DrawerBody";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "shrink-0 border-t border-border-default bg-bg-subtle px-6 py-4 flex items-center justify-end gap-2",
      className
    )}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  type DrawerSide,
};
