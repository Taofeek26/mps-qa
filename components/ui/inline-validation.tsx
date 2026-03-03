"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type InlineValidationVariant = "error" | "warning" | "success";

interface InlineValidationProps {
  message: string;
  variant?: InlineValidationVariant;
  className?: string;
}

const variantConfig: Record<
  InlineValidationVariant,
  { icon: React.ElementType; className: string }
> = {
  error: { icon: AlertCircle, className: "text-error-500" },
  warning: { icon: AlertTriangle, className: "text-warning-500" },
  success: { icon: CheckCircle2, className: "text-success-500" },
};

function InlineValidation({
  message,
  variant = "error",
  className,
}: InlineValidationProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium mt-1.5",
            config.className,
            className
          )}
          role="alert"
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export { InlineValidation, type InlineValidationProps, type InlineValidationVariant };
