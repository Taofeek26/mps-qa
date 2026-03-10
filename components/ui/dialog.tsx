"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

const Dialog = ({
  children,
  ...props
}: React.ComponentProps<typeof Drawer.Root>) => (
  <Drawer.Root direction="bottom" {...props}>
    {children}
  </Drawer.Root>
);
Dialog.displayName = "Dialog";

const DialogTrigger = Drawer.Trigger;
const DialogClose = Drawer.Close;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof Drawer.Content> {
  showHandle?: boolean;
}

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof Drawer.Content>,
  DialogContentProps
>(({ className, children, showHandle = true, ...props }, ref) => (
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
    <Drawer.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col",
        "rounded-t-[var(--radius-lg)] border border-b-0 border-border-default bg-bg-card shadow-xl",
        "focus:outline-none",
        className
      )}
      {...props}
    >
      {/* Drag handle */}
      {showHandle && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-text-muted/30" />
        </div>
      )}

      {/* Content wrapper */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-2">
        {children}
      </div>
    </Drawer.Content>
  </Drawer.Portal>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 space-y-1", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof Drawer.Title>,
  React.ComponentPropsWithoutRef<typeof Drawer.Title>
>(({ className, ...props }, ref) => (
  <Drawer.Title
    ref={ref}
    className={cn("text-base font-semibold text-text-primary", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof Drawer.Description>,
  React.ComponentPropsWithoutRef<typeof Drawer.Description>
>(({ className, ...props }, ref) => (
  <Drawer.Description
    ref={ref}
    className={cn("text-sm text-text-muted", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
