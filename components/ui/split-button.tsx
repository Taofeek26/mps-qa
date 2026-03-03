"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonVariant, type ButtonSize } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface SplitButtonItem {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
}

interface SplitButtonProps {
  label: string;
  onClick: () => void;
  items: SplitButtonItem[];
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

function SplitButton({
  label,
  onClick,
  items,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  className,
}: SplitButtonProps) {
  return (
    <div className={cn("inline-flex", className)}>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
        onClick={onClick}
        className="rounded-r-none"
      >
        {label}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled}
            className="rounded-l-none -ml-px px-2"
            aria-label="More actions"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.label} onClick={item.onClick}>
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { SplitButton, type SplitButtonProps, type SplitButtonItem };
