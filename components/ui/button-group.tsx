import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex",
          "[&>*]:rounded-none [&>*]:shadow-none",
          "[&>*:first-child]:rounded-l-[var(--radius-sm)]",
          "[&>*:last-child]:rounded-r-[var(--radius-sm)]",
          "[&>*:not(:first-child)]:-ml-px",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup, type ButtonGroupProps };
