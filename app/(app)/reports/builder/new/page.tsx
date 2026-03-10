"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { saveNewReport } from "@/lib/saved-reports";
import { toast } from "@/components/ui/toast";
import { ReportBuilder } from "../_components/report-builder";
import type { ReportSection } from "@/lib/report-builder-types";

export default function NewReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  if (!user) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-8 text-center text-text-muted">
        Sign in to create a report.
      </div>
    );
  }

  function handleSave(data: {
    name: string;
    title: string;
    dateRange: { from: string; to: string } | null;
    clientId: string;
    siteId: string;
    sections: ReportSection[];
  }) {
    if (!user) return;
    setIsSaving(true);
    try {
      const report = saveNewReport(user.id, {
        name: data.name,
        title: data.title,
        dateRange: data.dateRange,
        clientId: data.clientId,
        siteId: data.siteId,
        sections: data.sections,
      });
      toast.success("Report saved", { description: `"${report.name}" has been saved to your account.` });
      router.push("/reports/builder");
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "Could not save report." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ReportBuilder
      initialState={null}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
