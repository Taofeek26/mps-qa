"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { Dialog as RadixDialog } from "radix-ui";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/* ─── Responsive hook ─── */

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

/* ─── Context to pass open state to content ─── */

const DialogContext = React.createContext<{ open: boolean; isMobile: boolean }>({
  open: false,
  isMobile: false,
});

/* ─── Dialog Root ─── */

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  const isMobile = useIsMobile();
  // Track internal open state for uncontrolled usage
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open ?? internalOpen;
  const handleOpenChange = onOpenChange ?? setInternalOpen;

  if (isMobile) {
    return (
      <DialogContext.Provider value={{ open: isOpen, isMobile: true }}>
        <Drawer.Root
          direction="bottom"
          open={isOpen}
          onOpenChange={handleOpenChange}
        >
          {children}
        </Drawer.Root>
      </DialogContext.Provider>
    );
  }

  return (
    <DialogContext.Provider value={{ open: isOpen, isMobile: false }}>
      <RadixDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        {children}
      </RadixDialog.Root>
    </DialogContext.Provider>
  );
};
Dialog.displayName = "Dialog";

/* ─── Trigger / Close ─── */

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean }
>(({ asChild, ...props }, ref) => {
  const { isMobile } = React.useContext(DialogContext);
  if (isMobile) {
    return <Drawer.Trigger ref={ref} asChild={asChild} {...props} />;
  }
  return <RadixDialog.Trigger ref={ref} asChild={asChild} {...props} />;
});
DialogTrigger.displayName = "DialogTrigger";

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean }
>(({ asChild, ...props }, ref) => {
  const { isMobile } = React.useContext(DialogContext);
  if (isMobile) {
    return <Drawer.Close ref={ref} asChild={asChild} {...props} />;
  }
  return <RadixDialog.Close ref={ref} asChild={asChild} {...props} />;
});
DialogClose.displayName = "DialogClose";

/* ─── Content ─── */

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  showHandle?: boolean;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, showHandle = true, ...props }, ref) => {
    const { open, isMobile } = React.useContext(DialogContext);

    /* ── Mobile: Vaul bottom sheet (handles its own animations) ── */
    if (isMobile) {
      return (
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
            {showHandle && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1.5 w-10 rounded-full bg-text-muted/30" />
              </div>
            )}
            <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-2">
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      );
    }

    /* ── Desktop: Radix Dialog + motion enter/exit ── */
    return (
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </RadixDialog.Overlay>
            <RadixDialog.Content ref={ref} asChild forceMount {...props}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.8,
                }}
                className={cn(
                  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
                  "flex w-[min(90vw,28rem)] flex-col",
                  "rounded-[var(--radius-lg)] border border-border-default bg-bg-card shadow-xl",
                  "px-6 pb-6 pt-6",
                  "focus:outline-none",
                  className
                )}
              >
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06, duration: 0.2 }}
                >
                  {children}
                </motion.div>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    );
  }
);
DialogContent.displayName = "DialogContent";

/* ─── Header / Title / Description / Footer ─── */

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 space-y-1", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = React.useContext(DialogContext);
  const classes = cn("text-base font-semibold text-text-primary", className);

  if (isMobile) {
    return <Drawer.Title ref={ref} className={classes} {...props} />;
  }
  return <RadixDialog.Title ref={ref} className={classes} {...props} />;
});
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = React.useContext(DialogContext);
  const classes = cn("text-sm text-text-muted", className);

  if (isMobile) {
    return <Drawer.Description ref={ref} className={classes} {...props} />;
  }
  return <RadixDialog.Description ref={ref} className={classes} {...props} />;
});
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
