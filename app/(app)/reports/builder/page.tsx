"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ReportBuilder } from "./_components/report-builder";

export default function ReportBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <Spinner size="lg" />
        </div>
      }
    >
      <ReportBuilder />
    </Suspense>
  );
}
