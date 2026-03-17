"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Download,
  Share2,
  Trash2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import type { SavedReport } from "@/lib/saved-reports";
import { getSavedReports, deleteSavedReport, updateSavedReport } from "@/lib/saved-reports";
import { useShipments } from "@/lib/hooks/use-api-data";
import { exportReportPdf } from "./pdf-export";
import { cn } from "@/lib/utils";
import { RenameReportDialog } from "./rename-report-dialog";
import { MobileBackButton } from "@/components/ui/mobile-back-button";

interface ReportListProps {
  userId: string;
}

export function ReportList({ userId }: ReportListProps) {
  const [reports, setReports] = React.useState<SavedReport[]>([]);
  const [deleteTarget, setDeleteTarget] = React.useState<SavedReport | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<SavedReport | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const { shipments: allShipments } = useShipments();

  const loadReports = React.useCallback(() => {
    setReports(getSavedReports(userId));
  }, [userId]);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const ok = deleteSavedReport(userId, deleteTarget.id);
    if (ok) {
      toast.success("Report deleted", { description: `"${deleteTarget.name}" has been removed.` });
      loadReports();
    }
    setDeleteTarget(null);
  }

  function handleRenameSave(newName: string) {
    if (!renameTarget) return;
    updateSavedReport(userId, renameTarget.id, { name: newName, title: newName });
    toast.success("Report renamed", { description: `Renamed to "${newName}".` });
    loadReports();
    setRenameTarget(null);
  }

  async function handleDownload(report: SavedReport) {
    setDownloadingId(report.id);
    try {
      // Filter shipments client-side based on report filters
      let shipments = allShipments;
      if (report.dateRange?.from) {
        shipments = shipments.filter((s) => s.shipmentDate >= report.dateRange!.from!);
      }
      if (report.dateRange?.to) {
        shipments = shipments.filter((s) => s.shipmentDate <= report.dateRange!.to!);
      }
      if (report.clientId) {
        shipments = shipments.filter((s) => s.clientId === report.clientId);
      }
      if (report.siteId) {
        shipments = shipments.filter((s) => s.siteId === report.siteId);
      }
      const filterParts: string[] = [];
      if (report.dateRange?.from) filterParts.push(`${report.dateRange.from} – ${report.dateRange.to ?? "Present"}`);
      if (report.clientId) filterParts.push("Customer filtered");
      if (report.siteId) filterParts.push("Site filtered");
      const filterSummary = filterParts.length ? filterParts.join(" · ") : "All data";
      await exportReportPdf({
        title: report.title,
        filterSummary,
        sections: report.sections,
        shipments,
      });
      toast.success("Download started", { description: `"${report.name}" is downloading.` });
    } catch (e) {
      toast.error("Download failed", { description: e instanceof Error ? e.message : "Could not generate PDF." });
    } finally {
      setDownloadingId(null);
    }
  }

  function handleShare(report: SavedReport) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/reports/builder/${report.id}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied", { description: "Report link copied to clipboard." }),
      () => toast.error("Copy failed", { description: "Could not copy link." })
    );
  }

  const isEmpty = reports.length === 0;

  return (
    <div className={cn("flex flex-col gap-6", isEmpty && "min-h-[calc(100dvh-10rem)]")}>
      <MobileBackButton label="More" href="/more" />

      <div className="flex items-center justify-end gap-4">
        <Link href="/reports/builder/new">
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create new report</span>
          </Button>
        </Link>
      </div>

      <div className={cn(
        "rounded-lg border border-border-default bg-bg-card overflow-hidden",
        isEmpty && "flex-1 flex flex-col"
      )}>
        <div className="border-b border-border-default bg-bg-card px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">My reports</h2>
          <p className="text-xs text-text-muted mt-0.5">
            When you create and save a report, it appears here. You can edit, share, download, rename, or delete it.
          </p>
        </div>
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-bg-subtle mb-4">
              <FileText className="h-7 w-7 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-primary">No reports yet</p>
            <p className="text-sm text-text-muted mt-1 max-w-sm">
              Create your first report with the builder. It will be saved to your account and listed here.
            </p>
            <Link href="/reports/builder/new" className="mt-4">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Create new report
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-default bg-bg-subtle">
                <th className="h-11 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Report name
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Created
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Last updated
                </th>
                <th className="h-11 w-12 px-2 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr
                  key={report.id}
                  className="border-b border-border-default transition-colors hover:bg-bg-hover"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/reports/builder/${report.id}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {report.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {format(new Date(report.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {format(new Date(report.updatedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton variant="ghost" size="sm" label="Actions" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </IconButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/reports/builder/${report.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(report)}>
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownload(report)}
                          disabled={downloadingId === report.id || report.sections.length === 0}
                        >
                          {downloadingId === report.id ? (
                            <span className="animate-pulse">Generating…</span>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" />
                              Download PDF
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRenameTarget(report)}>
                          <FileText className="h-3.5 w-3.5" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          destructive
                          onClick={() => setDeleteTarget(report)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete report"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {renameTarget && (
        <RenameReportDialog
          open={true}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          currentName={renameTarget.name}
          onSave={handleRenameSave}
        />
      )}
    </div>
  );
}

