import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[80px] w-full rounded-[var(--radius-sm)] border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150",
          "focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-gray-100",
          error ? "border-error-400" : "border-border-default hover:border-border-strong",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea, type TextareaProps };
