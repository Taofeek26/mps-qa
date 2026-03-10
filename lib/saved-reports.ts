/* ============================================
   MPS Platform — Saved Report Builder reports
   Persisted per user (localStorage) for demo.
   ============================================ */

import type { ReportSection } from "@/lib/report-builder-types";

/** Serializable date range for storage */
export interface SavedDateRange {
  from: string; // ISO date
  to: string;
}

export interface SavedReport {
  id: string;
  /** Display name in "My Reports" list */
  name: string;
  /** Report title (used in PDF header) */
  title: string;
  createdAt: string; // ISO
  updatedAt: string;
  createdBy: string; // user id
  dateRange: SavedDateRange | null;
  clientId: string;
  siteId: string;
  sections: ReportSection[];
}

const STORAGE_PREFIX = "mps_saved_reports_";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadRaw(userId: string): SavedReport[] {
  try {
    const json = localStorage.getItem(storageKey(userId));
    if (!json) return [];
    const parsed = JSON.parse(json) as SavedReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(userId: string, reports: SavedReport[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(reports));
}

let idCounter = 1;
function generateId(): string {
  return `rpt-${Date.now()}-${idCounter++}`;
}

export function getSavedReports(userId: string): SavedReport[] {
  return loadRaw(userId).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getSavedReport(userId: string, reportId: string): SavedReport | null {
  return loadRaw(userId).find((r) => r.id === reportId) ?? null;
}

export function saveNewReport(
  userId: string,
  data: Omit<SavedReport, "id" | "createdAt" | "updatedAt" | "createdBy">
): SavedReport {
  const reports = loadRaw(userId);
  const now = new Date().toISOString();
  const report: SavedReport = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
  };
  reports.unshift(report);
  saveRaw(userId, reports);
  return report;
}

export function updateSavedReport(
  userId: string,
  reportId: string,
  data: Partial<Pick<SavedReport, "name" | "title" | "dateRange" | "clientId" | "siteId" | "sections">>
): SavedReport | null {
  const reports = loadRaw(userId);
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  reports[idx] = {
    ...reports[idx],
    ...data,
    updatedAt: now,
  };
  saveRaw(userId, reports);
  return reports[idx];
}

export function deleteSavedReport(userId: string, reportId: string): boolean {
  const reports = loadRaw(userId).filter((r) => r.id !== reportId);
  if (reports.length === loadRaw(userId).length) return false;
  saveRaw(userId, reports);
  return true;
}
