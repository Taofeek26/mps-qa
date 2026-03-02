"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  ...props
}: PaginationProps) {
  const pages = React.useMemo(() => {
    const items: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) items.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) items.push(i);
      if (currentPage < totalPages - 2) items.push("ellipsis");
      items.push(totalPages);
    }
    return items;
  }, [currentPage, totalPages]);

  const btnBase =
    "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-150 cursor-pointer focus-ring";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          btnBase,
          "text-text-muted hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-8 w-8 items-center justify-center text-sm text-text-muted"
          >
            ...
          </span>
        ) : (
          <motion.button
            key={page}
            whileTap={{ scale: 0.92 }}
            onClick={() => onPageChange(page)}
            className={cn(
              btnBase,
              page === currentPage
                ? "bg-primary-400 text-text-inverse shadow-sm"
                : "text-text-primary hover:bg-gray-100"
            )}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </motion.button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          btnBase,
          "text-text-muted hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export { Pagination, type PaginationProps };
