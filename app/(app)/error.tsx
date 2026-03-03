"use client";

import { AlertTriangle } from "lucide-react";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <AlertTriangle className="h-12 w-12 text-error-400 mb-4" />
      <AlertBanner variant="error" className="max-w-lg">
        <div>
          <p className="font-semibold">Something went wrong</p>
          <p className="text-sm mt-1">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>
      </AlertBanner>
      <Button className="mt-6" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
