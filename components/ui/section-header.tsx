import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  action?: React.ReactNode;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-4",
          className
        )}
        {...props}
      >
        <h2 className="text-base font-semibold text-text-primary tracking-tight">
          {title}
        </h2>
        {action && <div>{action}</div>}
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";

export { SectionHeader, type SectionHeaderProps };
