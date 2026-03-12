"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface MobileBackButtonProps {
  /** Label shown next to the arrow. Defaults to "Back" */
  label?: string;
  /** Override navigation — defaults to router.back() */
  href?: string;
}

export function MobileBackButton({ label = "Back", href }: MobileBackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  }

  return (
    <button
      onClick={handleClick}
      className="sm:hidden inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary active:text-text-primary mb-3"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
