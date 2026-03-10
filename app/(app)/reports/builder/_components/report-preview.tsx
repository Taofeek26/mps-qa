"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import type { ReportSection, SectionConfig } from "@/lib/report-builder-types";
import type { Shipment } from "@/lib/types";
import { renderWidget } from "@/components/report-builder/widgets";
import { SectionWrapper } from "./section-wrapper";

interface ReportPreviewProps {
  title: string;
  filterSummary: string;
  sections: ReportSection[];
  shipments: Shipment[];
  onMoveSection: (id: string, direction: "up" | "down") => void;
  onRemoveSection: (id: string) => void;
  onUpdateConfig: (id: string, config: Partial<SectionConfig>) => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
  hideControls?: boolean;
}

export function ReportPreview({
  title,
  filterSummary,
  sections,
  shipments,
  onMoveSection,
  onRemoveSection,
  onUpdateConfig,
  previewRef,
  hideControls,
}: ReportPreviewProps) {
  if (sections.length === 0) {
    return (
      <div className="h-full p-6">
        <div className="flex flex-col items-center justify-center h-full rounded-lg bg-bg-card border border-border-default text-center px-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-bg-subtle mb-4">
            <FileText className="h-8 w-8 text-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            Start building your report
          </h3>
          <p className="text-sm text-text-muted max-w-xs">
            Select sections from the panel on the left to add KPIs, charts, tables, and notes to your custom report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 lg:px-6">
      <div
        ref={previewRef}
        className="w-full bg-white rounded-lg shadow-lg"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Report Header (branded) */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-4 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="MPS" className="h-8 object-contain" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary leading-tight">{title || "Untitled Report"}</h1>
              <p className="text-xs text-text-muted mt-0.5">{filterSummary}</p>
            </div>
          </div>
          <div className="h-0.5 bg-primary-400 rounded-full" />
        </div>

        {/* Report Sections */}
        <div className="px-8 pb-8 space-y-5">
          {sections.map((section, idx) => (
            <div key={section.id} className="print-section">
              <SectionWrapper
                type={section.type}
                isFirst={idx === 0}
                isLast={idx === sections.length - 1}
                onMoveUp={() => onMoveSection(section.id, "up")}
                onMoveDown={() => onMoveSection(section.id, "down")}
                onRemove={() => onRemoveSection(section.id)}
                hideControls={hideControls}
                config={section.config}
                onConfigChange={(cfg) => onUpdateConfig(section.id, cfg)}
              >
                {renderWidget(section.type, {
                  shipments,
                  config: section.config,
                  onConfigChange: (cfg) => onUpdateConfig(section.id, cfg),
                  readOnly: hideControls,
                })}
              </SectionWrapper>
            </div>
          ))}
        </div>

        {/* Report Footer */}
        <div className="px-8 pb-6">
          <div className="h-px bg-border-default mb-3" />
          <div className="flex items-center justify-between text-[9px] text-text-muted">
            <span>MPS Centralized Waste Shipment Platform</span>
            <span>Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
