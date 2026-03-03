/* ============================================
   MPS Platform — Shared Type Definitions
   ============================================ */

/* ─── Enums ─── */

export type WeightUnit = "lbs" | "tons" | "kg";
export type VolumeUnit = "gal" | "L" | "m3";
export type UserRole = "site_user" | "admin" | "system_admin";
export type ShipmentStatus = "submitted" | "pending" | "void";

/* ─── Core Entities ─── */

export interface Client {
  id: string;
  name: string;
  industry?: string;
  active: boolean;
}

export interface Site {
  id: string;
  clientId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  region?: string;
  active: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  vendorType: string;
  city?: string;
  state?: string;
  phone?: string;
  active: boolean;
}

export interface WasteType {
  id: string;
  name: string;
  hazardousFlag: boolean;
  description?: string;
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  assignedSiteIds?: string[];
}

export interface Shipment {
  id: string;
  clientId: string;
  siteId: string;
  vendorId: string;
  wasteTypeId: string;
  shipmentDate: string;
  weightValue: number;
  weightUnit: WeightUnit;
  volumeValue?: number;
  volumeUnit?: VolumeUnit;
  notes?: string;
  status: ShipmentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /* Denormalized display names (populated by mock helpers) */
  siteName: string;
  clientName: string;
  vendorName: string;
  wasteTypeName: string;
  createdByName: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: { name: string; avatarUrl?: string };
  actionType: string;
  entityType: string;
  entityId: string;
  summary: string;
  payload?: Record<string, unknown>;
}

/* ─── Query / Filter Helpers ─── */

export interface ShipmentFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  siteIds?: string[];
  clientIds?: string[];
  vendorIds?: string[];
  wasteTypeIds?: string[];
  status?: ShipmentStatus;
}

export interface AuditLogFilters {
  dateFrom?: string;
  dateTo?: string;
  actorId?: string;
  actionType?: string;
  entityType?: string;
}

export interface SortParams<T> {
  field: keyof T;
  direction: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ─── New Shipment Entry Row (editable grid) ─── */

export interface ShipmentEntryRow {
  [key: string]: unknown;
  _rowId: string;
  siteId: string;
  clientId: string;
  vendorId: string;
  wasteTypeId: string;
  shipmentDate: string;
  weightValue: number | null;
  weightUnit: WeightUnit | "";
  volumeValue: number | null;
  notes: string;
}
