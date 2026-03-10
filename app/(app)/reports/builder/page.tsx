"use client";

import { Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { ReportList } from "./_components/report-list";

export default function ReportBuilderPage() {
  const { user } = useAuth();

  return (
    <Suspense fallback={null}>
      {user ? (
        <ReportList userId={user.id} />
      ) : (
        <div className="rounded-lg border border-border-default bg-bg-card p-8 text-center text-text-muted">
          Sign in to view and manage your reports.
        </div>
      )}
    </Suspense>
  );
}
