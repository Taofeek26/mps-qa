"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-app p-4 text-center">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-error-400 bg-error-100 p-6">
        <h1 className="text-lg font-bold text-error-600">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button className="mt-4" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
