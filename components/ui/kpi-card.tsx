import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardVariant = "default" | "success" | "warning" | "error";

interface KpiCardTrend {
  value: number;
  direction: "up" | "down";
}

interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: KpiCardTrend;
  variant?: KpiCardVariant;
}

/* Icon box: background #F9FAFB, border #F3F4F6, icon #99A1AF */
const iconBoxStyles =
  "bg-bg-app border border-border-default text-[var(--color-icon-muted)]";

const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ className, title, value, subtitle, icon: Icon, trend, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] border border-border-default bg-bg-card p-5 transition-colors duration-150 hover:border-border-strong",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted truncate">{title}</p>
            <p className="mt-1.5 text-[26px] font-extrabold text-text-primary leading-tight tracking-tight">
              {value}
            </p>
            {trend && (
              <div
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
                  trend.direction === "up" ? "text-success-600" : "text-error-600"
                )}
              >
                {trend.direction === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>{trend.value}%</span>
              </div>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                iconBoxStyles
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
    );
  }
);
KpiCard.displayName = "KpiCard";

export { KpiCard, type KpiCardProps, type KpiCardVariant, type KpiCardTrend };
