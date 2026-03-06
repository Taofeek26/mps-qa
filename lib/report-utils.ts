/* ============================================
   MPS Platform — Report Utilities
   Data aggregation and CSV export helpers
   ============================================ */

import type { Shipment, CostBreakdown } from "./types";

/* ─── Cost helpers ─── */

export function totalMpsCost(s: Shipment): number {
  if (!s.mpsCost) return 0;
  return s.mpsCost.haulCharge + s.mpsCost.disposalFeeTotal + s.mpsCost.fuelFee + s.mpsCost.environmentalFee + s.mpsCost.otherFees;
}

export function totalCustomerCost(s: Shipment): number {
  if (!s.customerCost) return 0;
  return s.customerCost.haulCharge + s.customerCost.disposalFeeTotal + s.customerCost.fuelFee + s.customerCost.environmentalFee + s.customerCost.otherFees - s.customerCost.rebate;
}

export function totalCostBreakdown(cost: CostBreakdown): number {
  return cost.haulCharge + cost.disposalFeeTotal + cost.fuelFee + cost.environmentalFee + cost.otherFees - cost.rebate;
}

/* ─── Month key helpers ─── */

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

/* ─── Load efficiency ─── */

export function loadEfficiency(s: Shipment): number | null {
  if (!s.standardizedVolumeLbs || !s.targetLoadWeight || s.targetLoadWeight === 0) return null;
  return Math.round((s.standardizedVolumeLbs / s.targetLoadWeight) * 100);
}

/* ─── CSV Export ─── */

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvContent = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ─── GMR2 (GM Waste Report) CSV formatter ─── */

export function exportGMR2(shipments: Shipment[]) {
  const headers = [
    "PLANT ID", "SOURCE", "SHIPMENT DATE", "Waste Stream or Approval ID", "WASTE NAME",
    "QUANTITY", "UNITS", "MANAGEMENT METHOD", "FINAL DISPOSITION",
    "NUMBER OF CONTAINERS", "CONTAINER TYPE", "DOCUMENT NO.", "MANIFEST NO.",
    "ITEM NUMBER", "DISPOSAL LOCATION CODE", "TRI WASTE CODE",
  ];

  const rows = shipments.map((s) => [
    s.plantId ?? "550781",
    "MPS",
    s.shipmentDate ? new Date(s.shipmentDate + "T00:00:00").toLocaleDateString("en-US") : "",
    s.approvalId ?? s.wasteStreamName ?? "",
    s.wasteTypeName,
    String(s.weightValue),
    "LB",
    s.managementMethod ?? "",
    s.finalDisposition ?? "OFFO",
    String(s.numberOfContainers ?? 1),
    s.containerType ?? "",
    s.documentNo ?? s.manifestNumber ?? "",
    s.manifestNumber ?? "",
    "1",
    s.disposalLocationCode ?? s.receivingEpaId ?? "",
    s.triWasteCode ?? "",
  ]);

  downloadCsv("GMR2_Report.csv", headers, rows);
}

/* ─── GEM (Ford) CSV formatter ─── */

export function exportGEM(shipments: Shipment[]) {
  const headers = [
    "Ship Date", "Waste Name", "Waste Category", "Waste Codes", "Treatment Method",
    "Quantity (lbs)", "Container Type", "Receiving Facility", "Receiving City",
    "Receiving State", "EPA ID", "Transporter", "Manifest #",
  ];

  const rows = shipments.map((s) => [
    s.shipmentDate ? new Date(s.shipmentDate + "T00:00:00").toLocaleDateString("en-US") : "",
    s.wasteTypeName,
    s.wasteCategory ?? "",
    s.wasteCodes ?? "",
    s.treatmentMethod ?? "",
    String(s.weightValue),
    s.containerType ?? "",
    s.receivingFacility ?? "",
    s.receivingCity ?? "",
    s.receivingState ?? "",
    s.receivingEpaId ?? "",
    s.transporterName ?? "",
    s.manifestNumber ?? "",
  ]);

  downloadCsv("GEM_Report.csv", headers, rows);
}

/* ─── Biennial Hazardous Waste Report CSV ─── */

export function exportBiennial(shipments: Shipment[]) {
  const hazShipments = shipments.filter((s) => s.wasteCategory === "Hazardous Waste");

  const headers = [
    "Ship Date", "Waste Name", "EPA Waste Codes", "Source Code", "Form Code",
    "Treatment Code", "Quantity (lbs)", "Management Method", "Receiving Facility",
    "EPA ID", "Treatment Method",
  ];

  const rows = hazShipments.map((s) => [
    s.shipmentDate ? new Date(s.shipmentDate + "T00:00:00").toLocaleDateString("en-US") : "",
    s.wasteTypeName,
    s.wasteCodes ?? "",
    s.sourceCode ?? "",
    s.formCode ?? "",
    s.treatmentCode ?? "",
    String(s.weightValue),
    s.managementMethod ?? "",
    s.receivingFacility ?? "",
    s.receivingEpaId ?? "",
    s.treatmentMethod ?? "",
  ]);

  downloadCsv("Biennial_Hazardous_Waste_Report.csv", headers, rows);
}
