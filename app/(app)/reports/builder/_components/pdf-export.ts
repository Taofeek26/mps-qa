/* ============================================
   MPS Platform — PDF Export via @react-pdf/renderer
   Generates a native PDF from React components
   and triggers a browser download.
   ============================================ */

import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { ReportPdfDocument } from "./pdf-document";
import type { ReportSection } from "@/lib/report-builder-types";
import type { Shipment } from "@/lib/types";

interface PdfExportOptions {
  title: string;
  filterSummary: string;
  sections: ReportSection[];
  shipments: Shipment[];
}

export async function exportReportPdf({ title, filterSummary, sections, shipments }: PdfExportOptions): Promise<void> {
  // Create the PDF document element
  const doc = createElement(ReportPdfDocument, {
    title,
    filterSummary,
    sections,
    shipments,
  });

  // Generate the PDF blob
  const blob = await pdf(doc).toBlob();

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") || "Report"}_MPS.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
