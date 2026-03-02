import * as React from "react";
import { cn } from "@/lib/utils";

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
  prefix?: string;
  suffix?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, error, prefix, suffix, ...props }, ref) => {
    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type="number"
          className={cn(
            "h-9 w-full rounded-[var(--radius-sm)] border bg-bg-card text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150",
            "focus-ring",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-gray-100",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            error ? "border-error-400" : "border-border-default hover:border-border-strong",
            prefix ? "pl-8" : "pl-3",
            suffix ? "pr-12" : "pr-3",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput, type NumberInputProps };
