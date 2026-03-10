import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("transition-opacity duration-150 ease-out", className)} {...props}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1 transition-transform duration-150 ease-out">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-gray-400 transition-opacity duration-150 ease-out" />
              )}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    "px-1 transition-colors duration-150 ease-out",
                    isLast
                      ? "font-medium text-text-primary"
                      : "text-text-muted"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="px-1 text-text-secondary hover:text-text-primary transition-colors duration-150 ease-out rounded-[var(--radius-sm)] focus-ring"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumbs, type BreadcrumbsProps, type BreadcrumbItem };
