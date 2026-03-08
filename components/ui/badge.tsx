import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "error" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-gray-200 text-gray-700",
  success: "bg-success-100 text-success-600",
  warning: "bg-warning-100 text-warning-600",
  error: "bg-error-100 text-error-600",
  info: "bg-primary-100 text-primary-500",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, type BadgeProps, type BadgeVariant };
