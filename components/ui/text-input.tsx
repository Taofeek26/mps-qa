import * as React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type TextInputVariant = "default" | "search";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: TextInputVariant;
  error?: boolean;
}

const baseStyles =
  "h-9 w-full rounded-[var(--radius-sm)] border bg-bg-card text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-gray-100";

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, variant = "default", error, ...props }, ref) => {
    if (variant === "search") {
      return (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            ref={ref}
            type="text"
            className={cn(
              baseStyles,
              "pl-9 pr-3",
              error ? "border-error-400" : "border-border-default hover:border-border-strong",
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type="text"
        className={cn(
          baseStyles,
          "px-3",
          error ? "border-error-400" : "border-border-default hover:border-border-strong",
          className
        )}
        {...props}
      />
    );
  }
);
TextInput.displayName = "TextInput";

export { TextInput, type TextInputProps, type TextInputVariant };
