"use client";

import * as React from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onReset?: () => void;
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ className, children, onReset, ...props }, ref) => {
    const [spinning, setSpinning] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    function handleReset() {
      setSpinning(true);
      onReset?.();
    }

    return (
      <>
        {/* Desktop: inline filter bar */}
        <div
          ref={ref}
          className={cn(
            "hidden sm:flex flex-wrap items-end gap-4",
            className
          )}
          {...props}
        >
          {children}
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="shrink-0"
            >
              <RotateCcw
                className={cn(
                  "h-3.5 w-3.5",
                  spinning && "animate-spin-once"
                )}
                onAnimationEnd={() => setSpinning(false)}
              />
              Reset
            </Button>
          )}
        </div>

        {/* Mobile: single filter icon button */}
        <div className="sm:hidden">
          <IconButton
            variant="secondary"
            size="sm"
            label="Filters"
            onClick={() => setMobileOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </IconButton>
        </div>

        {/* Mobile: filter dialog */}
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {children}
            </div>
            <DialogFooter>
              {onReset && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleReset();
                    setMobileOpen(false);
                  }}
                >
                  <RotateCcw
                    className={cn(
                      "h-3.5 w-3.5",
                      spinning && "animate-spin-once"
                    )}
                    onAnimationEnd={() => setSpinning(false)}
                  />
                  Reset
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setMobileOpen(false)}
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);
FilterBar.displayName = "FilterBar";

export { FilterBar, type FilterBarProps };
