/* ============================================
   MPS Platform — Tab PDF Export
   Generates and downloads a PDF for a report tab.
   ============================================ */

import { pdf } from "@react-pdf/renderer";
import { getTabPdfDocument } from "./tab-pdf-document";
import type { Shipment } from "@/lib/types";

const TAB_LABELS: Record<string, string> = {
  "waste-trends": "Waste Trends",
  "cost-analysis": "Cost Analysis",
  "light-load": "Light Load",
  "regulatory": "Regulatory",
  "operations": "Operations",
  "data-quality": "Data Quality",
  "vendor-intel": "Vendor Intel",
  "logistics": "Logistics",
  "emissions": "Emissions",
};

export async function exportTabPdf(tabId: string, shipments: Shipment[], filterSummary: string): Promise<void> {
  const doc = getTabPdfDocument(tabId, { shipments, filterSummary });
  if (!doc) return;

  const blob = await pdf(doc as any).toBlob();

  const label = TAB_LABELS[tabId] || "Report";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MPS_${label.replace(/\s+/g, "_")}_Report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
