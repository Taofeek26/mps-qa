"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getSavedReport, updateSavedReport } from "@/lib/saved-reports";
import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { ReportBuilder } from "../_components/report-builder";

export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const reportId = typeof params.id === "string" ? params.id : null;
  const [savedReport, setSavedReport] = React.useState<ReturnType<typeof getSavedReport>>(undefined);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user || !reportId) return;
    setSavedReport(getSavedReport(user.id, reportId));
  }, [user, reportId]);

  if (!user) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-8 text-center text-text-muted">
        Sign in to edit reports.
      </div>
    );
  }

  if (savedReport === undefined) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (savedReport === null) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-8 text-center">
        <p className="text-text-muted">Report not found.</p>
        <Link href="/reports/builder" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
          Back to my reports
        </Link>
      </div>
    );
  }

  const initialState = {
    title: savedReport.title,
    name: savedReport.name,
    dateRange: savedReport.dateRange,
    clientId: savedReport.clientId ?? "",
    siteId: savedReport.siteId ?? "",
    sections: savedReport.sections,
  };

  function handleSave(data: {
    name: string;
    title: string;
    dateRange: { from: string; to: string } | null;
    clientId: string;
    siteId: string;
    sections: { id: string; type: string; config: Record<string, unknown> }[];
  }) {
    if (!reportId) return;
    setIsSaving(true);
    try {
      updateSavedReport(user.id, reportId, {
        name: data.name,
        title: data.title,
        dateRange: data.dateRange,
        clientId: data.clientId,
        siteId: data.siteId,
        sections: data.sections,
      });
      toast.success("Report updated", { description: `"${data.name}" has been saved.` });
      router.push("/reports/builder");
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "Could not save report." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ReportBuilder
      initialState={initialState}
      reportId={reportId}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
