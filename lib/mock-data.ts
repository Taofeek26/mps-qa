/* ============================================
   MPS Platform — Mock Data Layer
   All data is static / in-memory. No API calls.
   ============================================ */

import type {
  Client,
  Site,
  Vendor,
  WasteType,
  User,
  Shipment,
  AuditLogEntry,
  ShipmentFilters,
  AuditLogFilters,
  SortParams,
  PaginatedResult,
  WeightUnit,
  ShipmentStatus,
} from "./types";

/* ─── Clients ─── */

export const CLIENTS: Client[] = [
  { id: "cli-1", name: "Acme Infrastructure", industry: "Construction", active: true },
  { id: "cli-2", name: "Metro Construction", industry: "Construction", active: true },
  { id: "cli-3", name: "Pacific Industries", industry: "Manufacturing", active: true },
  { id: "cli-4", name: "Eastside Properties", industry: "Real Estate", active: true },
  { id: "cli-5", name: "Northern Development", industry: "Government", active: true },
];

/* ─── Sites ─── */

export const SITES: Site[] = [
  { id: "site-1", clientId: "cli-1", name: "Downtown Tower Project", city: "Seattle", state: "WA", region: "Northwest", active: true },
  { id: "site-2", clientId: "cli-1", name: "Harbor Industrial Complex", city: "Tacoma", state: "WA", region: "Northwest", active: true },
  { id: "site-3", clientId: "cli-2", name: "Eastside Office Park", city: "Bellevue", state: "WA", region: "Northwest", active: true },
  { id: "site-4", clientId: "cli-2", name: "Southgate Mall Renovation", city: "Portland", state: "OR", region: "Northwest", active: true },
  { id: "site-5", clientId: "cli-3", name: "Pacific Manufacturing Plant", city: "Sacramento", state: "CA", region: "West", active: true },
  { id: "site-6", clientId: "cli-3", name: "Tech Park Campus", city: "San Jose", state: "CA", region: "West", active: true },
  { id: "site-7", clientId: "cli-4", name: "River Corridor Development", city: "Denver", state: "CO", region: "Mountain", active: true },
  { id: "site-8", clientId: "cli-5", name: "North Campus Expansion", city: "Minneapolis", state: "MN", region: "Midwest", active: true },
];

/* ─── Vendors ─── */

export const VENDORS: Vendor[] = [
  { id: "vnd-1", name: "Clean Earth Solutions", vendorType: "Hauler", city: "Seattle", state: "WA", active: true },
  { id: "vnd-2", name: "EcoHaul Transport", vendorType: "Hauler", city: "Portland", state: "OR", active: true },
  { id: "vnd-3", name: "GreenWaste Co.", vendorType: "Processor", city: "Sacramento", state: "CA", active: true },
  { id: "vnd-4", name: "SafeDisposal Inc.", vendorType: "Disposal", city: "Denver", state: "CO", active: true },
  { id: "vnd-5", name: "Hazmat Express", vendorType: "Hauler", city: "Phoenix", state: "AZ", active: true },
  { id: "vnd-6", name: "BioRecycle Partners", vendorType: "Recycler", city: "San Francisco", state: "CA", active: true },
  { id: "vnd-7", name: "Titan Waste Services", vendorType: "Hauler", city: "Tacoma", state: "WA", active: true },
  { id: "vnd-8", name: "Allied Environmental", vendorType: "Processor", city: "Boise", state: "ID", active: true },
  { id: "vnd-9", name: "Summit Disposal", vendorType: "Disposal", city: "Salt Lake City", state: "UT", active: true },
  { id: "vnd-10", name: "Pacific Waste Mgmt", vendorType: "Hauler", city: "Los Angeles", state: "CA", active: true },
];

/* ─── Waste Types ─── */

export const WASTE_TYPES: WasteType[] = [
  { id: "wt-1", name: "Construction Debris", hazardousFlag: false, description: "Concrete, wood, metal scraps", active: true },
  { id: "wt-2", name: "Hazardous Materials", hazardousFlag: true, description: "Chemicals, solvents, contaminated soil", active: true },
  { id: "wt-3", name: "Liquid Waste", hazardousFlag: false, description: "Wastewater, sludge", active: true },
  { id: "wt-4", name: "Organic Waste", hazardousFlag: false, description: "Food waste, green waste, compostable material", active: true },
  { id: "wt-5", name: "Electronic Waste", hazardousFlag: true, description: "Computers, batteries, circuit boards", active: true },
  { id: "wt-6", name: "Recyclables", hazardousFlag: false, description: "Paper, cardboard, plastics, glass", active: true },
];

/* ─── Users ─── */

export const USERS: User[] = [
  { id: "usr-1", email: "jane.cooper@mpsgrp.com", displayName: "Jane Cooper", role: "system_admin", active: true },
  { id: "usr-2", email: "michael.chen@mpsgrp.com", displayName: "Michael Chen", role: "admin", active: true },
  { id: "usr-3", email: "sarah.johnson@mpsgrp.com", displayName: "Sarah Johnson", role: "admin", active: true },
  { id: "usr-4", email: "david.williams@mpsgrp.com", displayName: "David Williams", role: "site_user", active: true, assignedSiteIds: ["site-1", "site-2"] },
  { id: "usr-5", email: "emily.martinez@mpsgrp.com", displayName: "Emily Martinez", role: "site_user", active: true, assignedSiteIds: ["site-3", "site-4"] },
  { id: "usr-6", email: "james.brown@mpsgrp.com", displayName: "James Brown", role: "site_user", active: true, assignedSiteIds: ["site-5", "site-6"] },
  { id: "usr-7", email: "olivia.davis@mpsgrp.com", displayName: "Olivia Davis", role: "site_user", active: true, assignedSiteIds: ["site-7"] },
  { id: "usr-8", email: "robert.wilson@mpsgrp.com", displayName: "Robert Wilson", role: "site_user", active: true, assignedSiteIds: ["site-8"] },
  { id: "usr-9", email: "amanda.taylor@mpsgrp.com", displayName: "Amanda Taylor", role: "admin", active: true },
  { id: "usr-10", email: "chris.anderson@mpsgrp.com", displayName: "Chris Anderson", role: "site_user", active: false, assignedSiteIds: ["site-1"] },
];

/* ─── Lookup helpers ─── */

let clientMap = new Map(CLIENTS.map((c) => [c.id, c]));
let siteMap = new Map(SITES.map((s) => [s.id, s]));
let vendorMap = new Map(VENDORS.map((v) => [v.id, v]));
let wasteTypeMap = new Map(WASTE_TYPES.map((w) => [w.id, w]));
let userMap = new Map(USERS.map((u) => [u.id, u]));

function rebuildMaps() {
  clientMap = new Map(CLIENTS.map((c) => [c.id, c]));
  siteMap = new Map(SITES.map((s) => [s.id, s]));
  vendorMap = new Map(VENDORS.map((v) => [v.id, v]));
  wasteTypeMap = new Map(WASTE_TYPES.map((w) => [w.id, w]));
  userMap = new Map(USERS.map((u) => [u.id, u]));
}

/* ─── Auto-increment ID counters ─── */

let nextClientId = CLIENTS.length + 1;
let nextSiteId = SITES.length + 1;
let nextVendorId = VENDORS.length + 1;
let nextWasteTypeId = WASTE_TYPES.length + 1;
let nextUserId = USERS.length + 1;

/* ─── CRUD: Clients ─── */

export function createClient(data: Omit<Client, "id">): Client {
  const client: Client = { id: `cli-${nextClientId++}`, ...data };
  CLIENTS.push(client);
  rebuildMaps();
  return client;
}

export function updateClient(id: string, patch: Partial<Client>): Client | undefined {
  const idx = CLIENTS.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  CLIENTS[idx] = { ...CLIENTS[idx], ...patch };
  rebuildMaps();
  return CLIENTS[idx];
}

export function deleteClient(id: string): boolean {
  const idx = CLIENTS.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  CLIENTS.splice(idx, 1);
  rebuildMaps();
  return true;
}

/* ─── CRUD: Sites ─── */

export function createSite(data: Omit<Site, "id">): Site {
  const site: Site = { id: `site-${nextSiteId++}`, ...data };
  SITES.push(site);
  rebuildMaps();
  return site;
}

export function updateSite(id: string, patch: Partial<Site>): Site | undefined {
  const idx = SITES.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  SITES[idx] = { ...SITES[idx], ...patch };
  rebuildMaps();
  return SITES[idx];
}

export function deleteSite(id: string): boolean {
  const idx = SITES.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  SITES.splice(idx, 1);
  rebuildMaps();
  return true;
}

/* ─── CRUD: Vendors ─── */

export function createVendor(data: Omit<Vendor, "id">): Vendor {
  const vendor: Vendor = { id: `vnd-${nextVendorId++}`, ...data };
  VENDORS.push(vendor);
  rebuildMaps();
  return vendor;
}

export function updateVendor(id: string, patch: Partial<Vendor>): Vendor | undefined {
  const idx = VENDORS.findIndex((v) => v.id === id);
  if (idx === -1) return undefined;
  VENDORS[idx] = { ...VENDORS[idx], ...patch };
  rebuildMaps();
  return VENDORS[idx];
}

export function deleteVendor(id: string): boolean {
  const idx = VENDORS.findIndex((v) => v.id === id);
  if (idx === -1) return false;
  VENDORS.splice(idx, 1);
  rebuildMaps();
  return true;
}

/* ─── CRUD: Waste Types ─── */

export function createWasteType(data: Omit<WasteType, "id">): WasteType {
  const wt: WasteType = { id: `wt-${nextWasteTypeId++}`, ...data };
  WASTE_TYPES.push(wt);
  rebuildMaps();
  return wt;
}

export function updateWasteType(id: string, patch: Partial<WasteType>): WasteType | undefined {
  const idx = WASTE_TYPES.findIndex((w) => w.id === id);
  if (idx === -1) return undefined;
  WASTE_TYPES[idx] = { ...WASTE_TYPES[idx], ...patch };
  rebuildMaps();
  return WASTE_TYPES[idx];
}

export function deleteWasteType(id: string): boolean {
  const idx = WASTE_TYPES.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  WASTE_TYPES.splice(idx, 1);
  rebuildMaps();
  return true;
}

/* ─── CRUD: Users ─── */

export function createUser(data: Omit<User, "id">): User {
  const user: User = { id: `usr-${nextUserId++}`, ...data };
  USERS.push(user);
  rebuildMaps();
  return user;
}

export function updateUser(id: string, patch: Partial<User>): User | undefined {
  const idx = USERS.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  USERS[idx] = { ...USERS[idx], ...patch };
  rebuildMaps();
  return USERS[idx];
}

export function deleteUser(id: string): boolean {
  const idx = USERS.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  USERS.splice(idx, 1);
  rebuildMaps();
  return true;
}

/* ─── Shipment data generation ─── */

function generateShipments(): Shipment[] {
  const statuses: ShipmentStatus[] = ["submitted", "submitted", "submitted", "pending", "void"];
  const units: WeightUnit[] = ["lbs", "tons", "kg"];
  const notes = [
    "Regular pickup",
    "Emergency cleanup from site incident",
    "Scheduled monthly haul",
    "Post-demolition waste removal",
    "Routine waste transfer",
    "End-of-project site cleanup",
    "Quarterly hazardous material disposal",
    "",
    "Overflow from weekend work",
    "Mixed load — sorted on-site",
  ];

  const shipments: Shipment[] = [];

  for (let i = 0; i < 58; i++) {
    const siteIdx = i % SITES.length;
    const site = SITES[siteIdx];
    const client = clientMap.get(site.clientId)!;
    const vendor = VENDORS[i % VENDORS.length];
    const wasteType = WASTE_TYPES[i % WASTE_TYPES.length];
    const creator = USERS[i % 4]; // first 4 users create shipments
    const daysAgo = Math.floor(i * 1.8) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const weightUnit = units[i % 3];
    const baseWeight = weightUnit === "tons" ? 2 + (i % 15) : weightUnit === "kg" ? 500 + (i % 2000) : 1000 + (i % 8000);

    shipments.push({
      id: `shp-${String(i + 1).padStart(4, "0")}`,
      clientId: client.id,
      siteId: site.id,
      vendorId: vendor.id,
      wasteTypeId: wasteType.id,
      shipmentDate: date.toISOString().split("T")[0],
      weightValue: Math.round(baseWeight * 100) / 100,
      weightUnit,
      volumeValue: i % 3 === 0 ? Math.round((10 + (i % 50)) * 10) / 10 : undefined,
      notes: notes[i % notes.length] || undefined,
      status: statuses[i % statuses.length],
      createdBy: creator.id,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      siteName: site.name,
      clientName: client.name,
      vendorName: vendor.name,
      wasteTypeName: wasteType.name,
      createdByName: creator.displayName,
    });
  }

  return shipments;
}

const ALL_SHIPMENTS = generateShipments();

/* ─── Audit Log data generation ─── */

function generateAuditLog(): AuditLogEntry[] {
  const entries: AuditLogEntry[] = [];
  const actions = ["create", "update", "delete", "export", "login"];
  const entities = ["shipment", "vendor", "site", "waste_type", "client", "user"];

  const summaries: Record<string, string[]> = {
    create: ["Created new {entity}", "Added {entity} record"],
    update: ["Updated {entity} details", "Modified {entity} fields"],
    delete: ["Deleted {entity}", "Removed {entity} record"],
    export: ["Exported shipment data as CSV", "Generated shipment report"],
    login: ["Signed in to the platform", "Authenticated via Microsoft SSO"],
  };

  for (let i = 0; i < 25; i++) {
    const user = USERS[i % USERS.length];
    const action = actions[i % actions.length];
    const entity = action === "login" ? "session" : entities[i % entities.length];
    const daysAgo = Math.floor(i * 0.8);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(8 + (i % 10), (i * 7) % 60);

    const summaryTemplates = summaries[action] ?? ["Performed action"];
    const summary = summaryTemplates[i % summaryTemplates.length].replace("{entity}", entity);

    entries.push({
      id: `aud-${String(i + 1).padStart(4, "0")}`,
      timestamp: date.toISOString(),
      actor: { name: user.displayName },
      actionType: action,
      entityType: entity,
      entityId: action === "login" ? user.id : `${entity.slice(0, 3)}-${String((i % 10) + 1).padStart(4, "0")}`,
      summary,
      payload:
        action === "login"
          ? undefined
          : { previousValues: { status: "pending" }, newValues: { status: "submitted" } },
    });
  }

  return entries;
}

const ALL_AUDIT_LOG = generateAuditLog();

/* ─── Query Functions ─── */

export function getShipments(
  filters?: ShipmentFilters,
  page = 1,
  pageSize = 10,
  sort?: SortParams<Shipment>
): PaginatedResult<Shipment> {
  let result = [...ALL_SHIPMENTS];

  if (filters) {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.siteName.toLowerCase().includes(q) ||
          s.clientName.toLowerCase().includes(q) ||
          s.vendorName.toLowerCase().includes(q) ||
          s.wasteTypeName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.notes?.toLowerCase().includes(q) ?? false)
      );
    }
    if (filters.dateFrom) {
      result = result.filter((s) => s.shipmentDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((s) => s.shipmentDate <= filters.dateTo!);
    }
    if (filters.siteIds?.length) {
      const set = new Set(filters.siteIds);
      result = result.filter((s) => set.has(s.siteId));
    }
    if (filters.clientIds?.length) {
      const set = new Set(filters.clientIds);
      result = result.filter((s) => set.has(s.clientId));
    }
    if (filters.vendorIds?.length) {
      const set = new Set(filters.vendorIds);
      result = result.filter((s) => set.has(s.vendorId));
    }
    if (filters.wasteTypeIds?.length) {
      const set = new Set(filters.wasteTypeIds);
      result = result.filter((s) => set.has(s.wasteTypeId));
    }
    if (filters.status) {
      result = result.filter((s) => s.status === filters.status);
    }
  }

  /* Sort */
  const sortField = sort?.field ?? "shipmentDate";
  const sortDir = sort?.direction ?? "desc";
  result.sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const total = result.length;
  const start = (page - 1) * pageSize;
  const data = result.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

export function getShipmentById(id: string): Shipment | undefined {
  return ALL_SHIPMENTS.find((s) => s.id === id);
}

export function getClients(): Client[] {
  return CLIENTS;
}

export function getSites(): Site[] {
  return SITES;
}

export function getVendors(): Vendor[] {
  return VENDORS;
}

export function getWasteTypes(): WasteType[] {
  return WASTE_TYPES;
}

export function getUsers(): User[] {
  return USERS;
}

export function getAuditLog(
  filters?: AuditLogFilters,
  page = 1,
  pageSize = 50
): PaginatedResult<AuditLogEntry> {
  let result = [...ALL_AUDIT_LOG];

  if (filters) {
    if (filters.dateFrom) {
      result = result.filter((e) => e.timestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((e) => e.timestamp <= filters.dateTo!);
    }
    if (filters.actorId) {
      const user = userMap.get(filters.actorId);
      if (user) result = result.filter((e) => e.actor.name === user.displayName);
    }
    if (filters.actionType) {
      result = result.filter((e) => e.actionType === filters.actionType);
    }
    if (filters.entityType) {
      result = result.filter((e) => e.entityType === filters.entityType);
    }
  }

  result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const total = result.length;
  const start = (page - 1) * pageSize;
  const data = result.slice(start, start + pageSize);

  return { data, total, page, pageSize };
}

/* ─── Mutation helpers (mock — mutate the in-memory arrays) ─── */

export function updateShipment(id: string, patch: Partial<Shipment>): Shipment | undefined {
  const idx = ALL_SHIPMENTS.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;

  const updated = {
    ...ALL_SHIPMENTS[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  /* Re-denormalize display names if FK changed */
  if (patch.siteId) updated.siteName = siteMap.get(patch.siteId)?.name ?? updated.siteName;
  if (patch.clientId) updated.clientName = clientMap.get(patch.clientId)?.name ?? updated.clientName;
  if (patch.vendorId) updated.vendorName = vendorMap.get(patch.vendorId)?.name ?? updated.vendorName;
  if (patch.wasteTypeId) updated.wasteTypeName = wasteTypeMap.get(patch.wasteTypeId)?.name ?? updated.wasteTypeName;

  ALL_SHIPMENTS[idx] = updated;
  return updated;
}

export function deleteShipment(id: string): boolean {
  const idx = ALL_SHIPMENTS.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  ALL_SHIPMENTS.splice(idx, 1);
  return true;
}

export interface InsertResult {
  inserted: number;
  failed: number;
  errors: { rowIndex: number; message: string }[];
}

export function insertShipments(
  rows: Array<{
    siteId: string;
    clientId: string;
    vendorId: string;
    wasteTypeId: string;
    shipmentDate: string;
    weightValue: number;
    weightUnit: string;
    volumeValue?: number;
    notes?: string;
  }>
): InsertResult {
  let inserted = 0;
  const errors: { rowIndex: number; message: string }[] = [];

  rows.forEach((row, i) => {
    /* Simple check — in real app this would be server-side */
    if (!row.siteId || !row.vendorId || !row.wasteTypeId || !row.shipmentDate || !row.weightValue) {
      errors.push({ rowIndex: i, message: "Missing required fields" });
      return;
    }

    const site = siteMap.get(row.siteId);
    const client = clientMap.get(row.clientId);
    const vendor = vendorMap.get(row.vendorId);
    const wasteType = wasteTypeMap.get(row.wasteTypeId);
    const creator = USERS[0]; // default creator

    const shipment: Shipment = {
      id: `shp-${String(ALL_SHIPMENTS.length + 1).padStart(4, "0")}`,
      ...row,
      weightUnit: row.weightUnit as Shipment["weightUnit"],
      status: "submitted",
      createdBy: creator.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      siteName: site?.name ?? "",
      clientName: client?.name ?? "",
      vendorName: vendor?.name ?? "",
      wasteTypeName: wasteType?.name ?? "",
      createdByName: creator.displayName,
    };

    ALL_SHIPMENTS.unshift(shipment);
    inserted++;
  });

  return { inserted, failed: errors.length, errors };
}
