import * as React from "react";
import { cn } from "@/lib/utils";

interface StatRowProps extends React.HTMLAttributes<HTMLDivElement> {}

const StatRow = React.forwardRef<HTMLDivElement, StatRowProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StatRow.displayName = "StatRow";

export { StatRow, type StatRowProps };
