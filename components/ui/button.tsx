"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-400 text-text-inverse shadow-sm hover:bg-primary-500 hover:shadow-md active:bg-primary-600",
  secondary:
    "bg-bg-card text-text-primary border border-border-strong shadow-sm hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200",
  ghost:
    "text-text-secondary hover:bg-gray-100 hover:text-text-primary active:bg-gray-200",
  destructive:
    "bg-error-500 text-text-inverse shadow-sm hover:bg-error-600 hover:shadow-md active:bg-error-600",
  success:
    "bg-success-500 text-text-inverse shadow-sm hover:bg-success-600 hover:shadow-md active:bg-success-600",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-9 px-4 text-sm gap-2 rounded-[var(--radius-sm)]",
  lg: "h-11 px-5 text-sm gap-2 rounded-[var(--radius-sm)]",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer select-none",
          "focus-ring",
          "disabled:pointer-events-none disabled:opacity-40",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 w-8 rounded-[var(--radius-sm)]",
  md: "h-9 w-9 rounded-[var(--radius-sm)]",
  lg: "h-11 w-11 rounded-[var(--radius-sm)]",
};

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, variant = "ghost", size = "md", label, children, ...props },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.93 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-150 cursor-pointer",
          "focus-ring",
          "disabled:pointer-events-none disabled:opacity-40",
          variantStyles[variant],
          iconSizeStyles[size],
          className
        )}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {children}
      </motion.button>
    );
  }
);
IconButton.displayName = "IconButton";

export {
  Button,
  IconButton,
  type ButtonProps,
  type IconButtonProps,
  type ButtonVariant,
  type ButtonSize,
};
