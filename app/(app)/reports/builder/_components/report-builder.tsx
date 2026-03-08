"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeft, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReportBuilder } from "./use-report-builder";
import { SectionGallery } from "./section-gallery";
import { ReportToolbar } from "./report-toolbar";
import { ReportPreview } from "./report-preview";
import { exportReportPdf } from "./pdf-export";
import type { SectionType } from "@/lib/report-builder-types";

export function ReportBuilder() {
  const builder = useReportBuilder();
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleExport = async () => {
    if (builder.sections.length === 0) return;
    builder.setIsExporting(true);
    try {
      await exportReportPdf({
        title: builder.title,
        filterSummary: builder.filterSummary,
        sections: builder.sections,
        shipments: builder.shipments,
      });
    } finally {
      builder.setIsExporting(false);
    }
  };

  const handleRemoveByType = (type: SectionType) => {
    const section = builder.sections.find((s) => s.type === type);
    if (section) builder.removeSection(section.id);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-subtle mb-4">
          <Monitor className="h-8 w-8 text-text-muted" />
        </div>
        <h3 className="text-base font-semibold text-text-primary mb-1">
          Larger screen required
        </h3>
        <p className="text-sm text-text-muted max-w-xs">
          The Report Builder requires a screen width of 1024px or wider. Please use a desktop or tablet device.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <ReportToolbar
        title={builder.title}
        onTitleChange={builder.setTitle}
        dateRange={builder.dateRange}
        onDateRangeChange={builder.setDateRange}
        clientId={builder.clientId}
        onClientChange={builder.setClientId}
        siteId={builder.siteId}
        onSiteChange={builder.setSiteId}
        clients={builder.clients}
        sites={builder.filteredSites}
        sectionCount={builder.sections.length}
        onExport={handleExport}
        isExporting={builder.isExporting}
      />

      {/* Main area: Sidebar + Preview */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div
          className={`flex-none border-r border-border-default bg-bg-app transition-all duration-200 ${
            sidebarOpen ? "w-[280px]" : "w-0"
          } overflow-hidden`}
        >
          <div className="w-[280px] h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Add Sections
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="h-7 w-7 p-0">
                <PanelLeftClose className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <SectionGallery
                onAdd={builder.addSection}
                onRemove={handleRemoveByType}
                isSectionAdded={builder.isSectionAdded}
              />
            </div>
            <div className="px-4 py-2.5 border-t border-border-default">
              <p className="text-[10px] text-text-muted">
                {builder.sections.length} section{builder.sections.length !== 1 ? "s" : ""} added &middot; {builder.shipments.length} shipments
              </p>
            </div>
          </div>
        </div>

        {/* Collapsed sidebar toggle */}
        {!sidebarOpen && (
          <div className="flex-none border-r border-border-default">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="m-2 h-8 w-8 p-0">
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto bg-bg-subtle">
          <ReportPreview
            title={builder.title}
            filterSummary={builder.filterSummary}
            sections={builder.sections}
            shipments={builder.shipments}
            onMoveSection={builder.moveSection}
            onRemoveSection={builder.removeSection}
            onUpdateConfig={builder.updateConfig}
            previewRef={previewRef}
          />
        </div>
      </div>
    </div>
  );
}
