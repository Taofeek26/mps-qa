"use client";

import * as React from "react";
import type { Shipment } from "@/lib/types";

export function useTabPdfExport(tabId: string, shipments: Shipment[], filterSummary: string) {
  const [isPdfExporting, setIsPdfExporting] = React.useState(false);

  const handleExportPdf = React.useCallback(async () => {
    setIsPdfExporting(true);
    try {
      // Dynamic import to avoid loading react-pdf until needed
      const { exportTabPdf } = await import("./tab-pdf-export");
      await exportTabPdf(tabId, shipments, filterSummary);
    } finally {
      setIsPdfExporting(false);
    }
  }, [tabId, shipments, filterSummary]);

  return { isPdfExporting, handleExportPdf };
}
