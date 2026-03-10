import * as React from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onReset?: () => void;
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ className, children, onReset, ...props }, ref) => {
    const [spinning, setSpinning] = React.useState(false);

    function handleReset() {
      setSpinning(true);
      onReset?.();
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-wrap items-end gap-4",
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
    );
  }
);
FilterBar.displayName = "FilterBar";

export { FilterBar, type FilterBarProps };
