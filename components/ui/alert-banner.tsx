import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
  info: "bg-primary-50 border-primary-200 text-primary-700",
  success: "bg-success-100 border-success-400/40 text-success-600",
  warning: "bg-warning-100 border-warning-400/40 text-warning-600",
  error: "bg-error-100 border-error-400/40 text-error-600",
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="h-4 w-4 shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />,
  error: <XCircle className="h-4 w-4 shrink-0 mt-0.5" />,
};

const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({ className, variant = "info", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex items-start gap-3 rounded-[var(--radius-sm)] border px-4 py-3 text-sm",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {variantIcons[variant]}
        <div>{children}</div>
      </div>
    );
  }
);
AlertBanner.displayName = "AlertBanner";

export { AlertBanner, type AlertBannerProps, type AlertVariant };
