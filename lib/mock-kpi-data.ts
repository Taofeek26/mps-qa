/* ============================================
   MPS Platform — KPI Mock Data
   Operational, Safety, Platform & CX data
   for the 56 KPIs not derivable from shipments
   ============================================ */

import type {
  InvoiceRecord,
  CollectionEvent,
  ContainerPlacement,
  FacilityCapacity,
  FuelRecord,
  RouteSchedule,
  TruckLoad,
  SafetyIncident,
  InspectionRecord,
  ServiceVerification,
  ContainerWeightRecord,
  PlatformUserActivity,
  CustomerSurvey,
} from "./types";

/* ─── Deterministic seeded-random helper ─── */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randBetween(min: number, max: number): number {
  return Math.round((min + rand() * (max - min)) * 100) / 100;
}

function randInt(min: number, max: number): number {
  return Math.floor(min + rand() * (max - min + 1));
}

function dateOffset(base: string, daysOffset: number): string {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

/* ─── Reference IDs (must match mock-data.ts) ─── */

const SITE_IDS = [
  "site-1", "site-2", "site-3", "site-4", "site-5",
  "site-6", "site-7", "site-8", "site-9", "site-10",
];
const SITE_NAMES = [
  "Ashland City", "Charlotte", "Lebanon", "McBee", "Bowling Green",
  "Dearborn", "Orion Assembly", "Lansing Delta", "Kansas City", "Louisville",
];
const CLIENT_IDS = ["cli-1", "cli-2", "cli-3", "cli-4"];
const CLIENT_NAMES = ["AO Smith", "GM", "Stellantis", "Ford"];
const TRANSPORTER_NAMES = [
  "Waste Connections", "Waste Management", "Republic Services", "Safety Kleen",
  "Clean Harbors", "Heritage Environmental", "US Ecology", "Veolia",
];
const CONTAINER_TYPES = [
  "30CY Roll Off", "42CY Compactor", "55gal Drum", "Trailer",
  "20CY Roll Off", "Tote", "Dump Truck", "Tanker",
];
const FACILITY_NAMES = [
  "Cheatham County Disposal", "Domtar Paper", "Safety Kleen Deer Park",
  "Veolia ES Technical Solutions", "Clean Harbors Deer Park",
  "US Ecology Michigan", "Heritage Thermal Services", "Republic Landfill",
];

/* ════════════════════════════════════════════
   DOMAIN 1: COMMERCIAL — Invoice / AR Data
   ════════════════════════════════════════════ */

const INVOICE_RECORDS: InvoiceRecord[] = [];
(() => {
  let id = 1;
  for (let month = 0; month < 12; month++) {
    for (const clientId of CLIENT_IDS) {
      const invoiceDate = `2024-${String(month + 1).padStart(2, "0")}-15`;
      const dueDate = dateOffset(invoiceDate, 30);
      const amount = randBetween(15000, 85000);
      const paid = rand() < 0.75;
      const daysLate = paid ? randInt(-5, 60) : undefined;
      INVOICE_RECORDS.push({
        id: `inv-${id++}`,
        clientId,
        invoiceDate,
        dueDate,
        amount,
        paidDate: daysLate != null ? dateOffset(dueDate, daysLate) : undefined,
      });
    }
  }
})();

/* ════════════════════════════════════════════
   DOMAIN 2: OPERATIONAL
   ════════════════════════════════════════════ */

/* Collection Events — ~300 events, ~97% on-time */
const COLLECTION_EVENTS: CollectionEvent[] = [];
(() => {
  let id = 1;
  for (let month = 1; month <= 12; month++) {
    for (const siteId of SITE_IDS) {
      const eventsPerSite = randInt(2, 4);
      for (let e = 0; e < eventsPerSite; e++) {
        const day = randInt(1, 28);
        const scheduledDate = `2024-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const roll = rand();
        let status: CollectionEvent["status"];
        let actualDate: string | undefined;
        if (roll < 0.02) {
          status = "missed";
        } else if (roll < 0.05) {
          status = "late";
          actualDate = dateOffset(scheduledDate, randInt(1, 3));
        } else {
          status = "completed";
          actualDate = scheduledDate;
        }
        COLLECTION_EVENTS.push({ id: `col-${id++}`, siteId, scheduledDate, actualDate, status });
      }
    }
  }
})();

/* Container Placements — 80 containers */
const CONTAINER_PLACEMENTS: ContainerPlacement[] = [];
(() => {
  let id = 1;
  for (const siteId of SITE_IDS) {
    const count = randInt(6, 10);
    for (let c = 0; c < count; c++) {
      const month = randInt(1, 12);
      const day = randInt(1, 20);
      const placedDate = `2024-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const daysOnSite = randInt(5, 35);
      const removed = rand() < 0.7;
      CONTAINER_PLACEMENTS.push({
        id: `cp-${id++}`,
        containerId: `cnt-${id}`,
        containerType: pick(CONTAINER_TYPES),
        siteId,
        placedDate,
        removedDate: removed ? dateOffset(placedDate, daysOnSite) : undefined,
        fillPercentage: randBetween(45, 100),
      });
    }
  }
})();

/* Facility Capacities */
const FACILITY_CAPACITIES: FacilityCapacity[] = FACILITY_NAMES.map((name, i) => ({
  facilityId: `fac-${i + 1}`,
  facilityName: name,
  monthlyCapacityTons: randBetween(800, 3000),
  monthlyProcessedTons: randBetween(400, 2200),
}));

/* Fuel Records — per transporter */
const FUEL_RECORDS: FuelRecord[] = TRANSPORTER_NAMES.map((name, i) => ({
  transporterId: `trans-${i + 1}`,
  transporterName: name,
  mpg: randBetween(4.5, 8.5),
  fuelCostPerMile: randBetween(0.45, 0.95),
}));

/* Route Schedules — ~60 routes */
const ROUTE_SCHEDULES: RouteSchedule[] = [];
(() => {
  let id = 1;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  for (const siteId of SITE_IDS) {
    const routeCount = randInt(4, 8);
    for (let r = 0; r < routeCount; r++) {
      const scheduledDay = pick(days);
      const onTime = rand() < 0.92;
      ROUTE_SCHEDULES.push({
        id: `rs-${id++}`,
        routeId: `route-${siteId}-${r + 1}`,
        siteId,
        siteName: SITE_NAMES[SITE_IDS.indexOf(siteId)],
        scheduledDay,
        completedDay: onTime ? scheduledDay : pick(days),
        onTime,
      });
    }
  }
})();

/* Truck Loads — ~30 trucks */
const TRUCK_LOADS: TruckLoad[] = [];
(() => {
  let id = 1;
  for (const transporter of TRANSPORTER_NAMES) {
    const count = randInt(3, 5);
    for (let t = 0; t < count; t++) {
      const max = pick([40000, 48000, 54000, 60000, 80000]);
      TRUCK_LOADS.push({
        id: `truck-${id++}`,
        truckId: `T-${100 + id}`,
        transporterName: transporter,
        maxWeightLbs: max,
        loadedWeightLbs: Math.round(max * randBetween(0.6, 0.98)),
      });
    }
  }
})();

/* Client Industry Codes */
export const CLIENT_INDUSTRY_CODES: Record<string, { naics: string; description: string }> = {
  "cli-1": { naics: "335220", description: "Major Household Appliance Manufacturing" },
  "cli-2": { naics: "336111", description: "Automobile Manufacturing" },
  "cli-3": { naics: "336111", description: "Automobile Manufacturing" },
  "cli-4": { naics: "336111", description: "Automobile Manufacturing" },
};

/* ════════════════════════════════════════════
   DOMAIN 3: REGULATORY & SAFETY
   ════════════════════════════════════════════ */

/* Safety Incidents — ~18 incidents over 12 months */
const SAFETY_INCIDENTS: SafetyIncident[] = [];
(() => {
  const types: SafetyIncident["type"][] = ["vehicle", "chemical", "slip-fall", "equipment", "ergonomic"];
  const sevs: SafetyIncident["severity"][] = ["minor", "moderate", "serious"];
  let id = 1;
  for (let month = 1; month <= 12; month++) {
    const count = rand() < 0.3 ? 0 : randInt(1, 3);
    for (let i = 0; i < count; i++) {
      const day = randInt(1, 28);
      SAFETY_INCIDENTS.push({
        id: `si-${id++}`,
        date: `2024-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        type: pick(types),
        severity: rand() < 0.6 ? "minor" : rand() < 0.8 ? "moderate" : pick(sevs),
        resolved: rand() < 0.85,
        siteId: pick(SITE_IDS),
        description: pick([
          "Forklift near-miss in loading dock",
          "Chemical splash during drum transfer",
          "Slip on wet surface near wash bay",
          "Equipment malfunction during compactor operation",
          "Repetitive strain reported by operator",
          "Container fell during stacking",
          "Driver incident during backing maneuver",
          "Improper PPE use observed",
        ]),
      });
    }
  }
})();

/* Inspection Records — ~40 inspections */
const INSPECTION_RECORDS: InspectionRecord[] = [];
(() => {
  let id = 1;
  for (let month = 1; month <= 12; month++) {
    const sitesToInspect = Math.min(SITE_IDS.length, randInt(3, 5));
    const shuffled = [...SITE_IDS].sort(() => rand() - 0.5);
    for (let s = 0; s < sitesToInspect; s++) {
      const siteId = shuffled[s];
      const passed = rand() < 0.92;
      INSPECTION_RECORDS.push({
        id: `insp-${id++}`,
        siteId,
        siteName: SITE_NAMES[SITE_IDS.indexOf(siteId)],
        date: `2024-${String(month).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
        passed,
        findings: passed ? 0 : randInt(1, 4),
        inspectorName: pick(["C. King", "K. Hollins", "M. Torres", "J. Park"]),
      });
    }
  }
})();

/* Service Verifications — one per ~200 shipments */
const SERVICE_VERIFICATIONS: ServiceVerification[] = [];
(() => {
  for (let i = 1; i <= 200; i++) {
    const shipmentId = String(410057 + i);
    const verified = rand() < 0.88;
    const goBack = !verified && rand() < 0.7;
    SERVICE_VERIFICATIONS.push({
      shipmentId,
      verified,
      verifiedDate: verified ? `2024-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}` : undefined,
      goBack,
      goBackReason: goBack ? pick(["Wrong container", "Partial pickup", "Access issue", "Equipment failure"]) : undefined,
    });
  }
})();

/* Safety Training */
export const SAFETY_TRAINING_DATA = {
  totalEmployees: 85,
  modulesCompleted: {
    "Hazardous Materials Handling": 82,
    "Forklift Certification": 78,
    "Confined Space Entry": 71,
    "Fire Safety & Prevention": 84,
    "PPE Usage & Inspection": 85,
    "Emergency Response": 76,
    "Lockout/Tagout (LOTO)": 73,
    "Spill Response": 80,
  },
};

/* ════════════════════════════════════════════
   DOMAIN 4: ESG — Material & Assets
   ════════════════════════════════════════════ */

/* Container Weight Records — tare/gross pairs */
const CONTAINER_WEIGHT_RECORDS: ContainerWeightRecord[] = [];
(() => {
  for (let i = 1; i <= 120; i++) {
    const containerType = pick(CONTAINER_TYPES);
    const baseTare = containerType.includes("Drum") ? randBetween(40, 60) :
      containerType.includes("Roll Off") ? randBetween(8000, 12000) :
      containerType.includes("Compactor") ? randBetween(10000, 14000) :
      randBetween(200, 2000);
    CONTAINER_WEIGHT_RECORDS.push({
      shipmentId: String(410057 + i),
      containerType,
      tareWeightLbs: baseTare,
      grossWeightLbs: baseTare + randBetween(500, 20000),
    });
  }
})();

/* Route Progress */
export const ROUTE_PROGRESS_DATA = (() => {
  const routes: Array<{ routeId: string; siteName: string; totalStops: number; completedStops: number }> = [];
  for (let i = 0; i < 12; i++) {
    const total = randInt(5, 15);
    routes.push({
      routeId: `route-${i + 1}`,
      siteName: SITE_NAMES[i % SITE_NAMES.length],
      totalStops: total,
      completedStops: Math.min(total, Math.round(total * randBetween(0.6, 1.0))),
    });
  }
  return routes;
})();

/* Yard Turnaround */
export const YARD_TURNAROUND_DATA = (() => {
  const entries: Array<{ truckId: string; transporterName: string; turnaroundMinutes: number }> = [];
  for (let i = 0; i < 30; i++) {
    entries.push({
      truckId: `T-${200 + i}`,
      transporterName: pick(TRANSPORTER_NAMES),
      turnaroundMinutes: randBetween(20, 120),
    });
  }
  return entries;
})();

/* Service Agreement Rates */
export const SERVICE_AGREEMENT_RATES = (() => {
  const agreements: Array<{ clientName: string; transporterName: string; contractedHaulRate: number; actualAvgRate: number }> = [];
  for (const client of CLIENT_NAMES) {
    for (let i = 0; i < 3; i++) {
      const rate = randBetween(250, 600);
      agreements.push({
        clientName: client,
        transporterName: pick(TRANSPORTER_NAMES),
        contractedHaulRate: rate,
        actualAvgRate: rate * randBetween(0.85, 1.15),
      });
    }
  }
  return agreements;
})();

/* ════════════════════════════════════════════
   DOMAIN 5: PLATFORM ANALYTICS
   ════════════════════════════════════════════ */

const PLATFORM_USER_ACTIVITY: PlatformUserActivity[] = [
  { userId: "usr-1", userName: "Jane Cooper", role: "admin", lastActiveDate: "2024-12-14", shipmentsCreated: 342, features: ["shipments", "reports", "admin", "builder"], loginCount: 245, avgSessionMinutes: 38 },
  { userId: "usr-2", userName: "Michael Chen", role: "manager", lastActiveDate: "2024-12-14", shipmentsCreated: 287, features: ["shipments", "reports", "vendors"], loginCount: 198, avgSessionMinutes: 32 },
  { userId: "usr-3", userName: "Sarah Johnson", role: "operator", lastActiveDate: "2024-12-13", shipmentsCreated: 156, features: ["shipments", "reports"], loginCount: 142, avgSessionMinutes: 22 },
  { userId: "usr-4", userName: "David Kim", role: "operator", lastActiveDate: "2024-12-12", shipmentsCreated: 198, features: ["shipments", "reports", "builder"], loginCount: 165, avgSessionMinutes: 28 },
  { userId: "usr-5", userName: "Emily Rodriguez", role: "manager", lastActiveDate: "2024-12-14", shipmentsCreated: 245, features: ["shipments", "reports", "admin"], loginCount: 210, avgSessionMinutes: 35 },
  { userId: "usr-6", userName: "Robert Taylor", role: "viewer", lastActiveDate: "2024-12-10", shipmentsCreated: 89, features: ["shipments"], loginCount: 78, avgSessionMinutes: 15 },
  { userId: "usr-7", userName: "Lisa Wang", role: "operator", lastActiveDate: "2024-12-14", shipmentsCreated: 167, features: ["shipments", "reports"], loginCount: 155, avgSessionMinutes: 25 },
  { userId: "usr-8", userName: "James Brown", role: "viewer", lastActiveDate: "2024-12-09", shipmentsCreated: 72, features: ["shipments"], loginCount: 65, avgSessionMinutes: 12 },
  { userId: "usr-9", userName: "Amanda Martinez", role: "manager", lastActiveDate: "2024-12-14", shipmentsCreated: 310, features: ["shipments", "reports", "admin", "vendors", "builder"], loginCount: 230, avgSessionMinutes: 42 },
  { userId: "usr-10", userName: "Chris Lee", role: "operator", lastActiveDate: "2024-12-11", shipmentsCreated: 134, features: ["shipments", "reports"], loginCount: 120, avgSessionMinutes: 20 },
];

/* Monthly platform events (aggregated) */
export const PLATFORM_MONTHLY_EVENTS = (() => {
  const months: Array<{ month: string; dau: number; mau: number; shipmentsCreated: number; reportsViewed: number; exportsRun: number; totalEvents: number }> = [];
  for (let m = 1; m <= 12; m++) {
    const mau = randInt(6, 10);
    months.push({
      month: `2024-${String(m).padStart(2, "0")}`,
      dau: randInt(3, mau),
      mau,
      shipmentsCreated: randInt(90, 180),
      reportsViewed: randInt(40, 120),
      exportsRun: randInt(10, 40),
      totalEvents: randInt(500, 1500),
    });
  }
  return months;
})();

export const FEATURE_USAGE_MAP: Record<string, number> = {
  "Shipment Entry": 38,
  "Reports": 24,
  "Dashboard": 15,
  "Admin": 8,
  "Report Builder": 6,
  "Vendor Management": 5,
  "Export/Download": 4,
};

/* ════════════════════════════════════════════
   DOMAIN 6: CUSTOMER EXPERIENCE
   ════════════════════════════════════════════ */

const CUSTOMER_SURVEYS: CustomerSurvey[] = [];
(() => {
  let id = 1;
  const categories = ["Billing", "Pickup Scheduling", "Documentation", "Communication", "Service Quality"];
  for (let month = 1; month <= 12; month++) {
    for (const clientId of CLIENT_IDS) {
      const surveysPerClient = randInt(3, 6);
      for (let s = 0; s < surveysPerClient; s++) {
        const csat = randBetween(3.0, 5.0);
        const hasComplaint = rand() < 0.08;
        CUSTOMER_SURVEYS.push({
          id: `survey-${id++}`,
          clientId,
          clientName: CLIENT_NAMES[CLIENT_IDS.indexOf(clientId)],
          date: `2024-${String(month).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
          csat: Math.round(csat * 10) / 10,
          nps: randInt(csat > 4 ? 7 : 3, 10),
          fcrResolved: rand() < 0.82,
          responseTimeHrs: randBetween(0.5, 24),
          hasComplaint,
          complaintCategory: hasComplaint ? pick(categories) : undefined,
        });
      }
    }
  }
})();

/* ════════════════════════════════════════════
   ACCESSOR FUNCTIONS
   ════════════════════════════════════════════ */

export function getInvoiceRecords(): InvoiceRecord[] { return INVOICE_RECORDS; }
export function getCollectionEvents(): CollectionEvent[] { return COLLECTION_EVENTS; }
export function getContainerPlacements(): ContainerPlacement[] { return CONTAINER_PLACEMENTS; }
export function getFacilityCapacities(): FacilityCapacity[] { return FACILITY_CAPACITIES; }
export function getFuelRecords(): FuelRecord[] { return FUEL_RECORDS; }
export function getRouteSchedules(): RouteSchedule[] { return ROUTE_SCHEDULES; }
export function getTruckLoads(): TruckLoad[] { return TRUCK_LOADS; }
export function getSafetyIncidents(): SafetyIncident[] { return SAFETY_INCIDENTS; }
export function getInspectionRecords(): InspectionRecord[] { return INSPECTION_RECORDS; }
export function getServiceVerifications(): ServiceVerification[] { return SERVICE_VERIFICATIONS; }
export function getContainerWeightRecords(): ContainerWeightRecord[] { return CONTAINER_WEIGHT_RECORDS; }
export function getPlatformUserActivity(): PlatformUserActivity[] { return PLATFORM_USER_ACTIVITY; }
export function getCustomerSurveys(): CustomerSurvey[] { return CUSTOMER_SURVEYS; }
