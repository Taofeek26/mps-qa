/**
 * Build script: Reads Golden_Mock_Shipments_1500.csv and generates
 * lib/generated-shipment-data.ts with typed ShipmentView[] array.
 *
 * Run: node scripts/generate-shipment-data.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(__dirname, "../docs/reference/Golden_Mock_Shipments_1500.csv");
const OUT_PATH = resolve(__dirname, "../lib/generated-shipment-data.ts");

/* ─── CSV Parser (handles quoted fields) ─── */

function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/* ─── Lookup Maps ─── */

const CREATOR_MAP = {
  jsmith:   { id: "usr-1", name: "Jane Cooper" },
  mchen:    { id: "usr-2", name: "Michael Chen" },
  ajohnson: { id: "usr-3", name: "Sarah Johnson" },
  sroberts: { id: "usr-4", name: "David Williams" },
};

const FACILITY_MAP = {
  "Cheatham County Disposal": { id: "rf-1", company: "Waste Connections", address: "2791 Sams Creek Rd", city: "Pegram", state: "TN", zip: "37143", epaId: undefined },
  "Kingsport Packaging":      { id: "rf-2", company: "Domtar", address: "100 Clinchfield St", city: "Kingsport", state: "TN", zip: "37660", epaId: undefined },
  "Safety Kleen Nashville":   { id: "rf-3", company: "Safety Kleen", address: "215 Whitsett Rd", city: "Nashville", state: "TN", zip: "37210", epaId: "TND981474125" },
  "Republic Services #721":   { id: "rf-4", company: "Republic Services", address: "4001 W 123rd St", city: "Alsip", state: "IL", zip: "60803", epaId: undefined },
  "Clearview Landfill":       { id: "rf-5", company: "Waste Management", address: "4700 National Rd SW", city: "Hebron", state: "OH", zip: "43025", epaId: undefined },
  "Heritage Thermal Services": { id: "rf-6", company: "Heritage Environmental", address: "1250 St George St", city: "East Liverpool", state: "OH", zip: "43920", epaId: undefined },
};

/* ─── Read & Parse CSV ─── */

const raw = readFileSync(CSV_PATH, "utf-8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
const lines = raw.split("\n").filter((l) => l.trim().length > 0);
const headers = parseCSVLine(lines[0]);

console.log(`Parsed ${headers.length} columns, ${lines.length - 1} data rows`);

/* ─── Column indices ─── */

const col = {};
headers.forEach((h, i) => { col[h] = i; });

/* ─── Transform rows ─── */

const shipments = [];
let parseErrors = 0;

for (let r = 1; r < lines.length; r++) {
  const fields = parseCSVLine(lines[r]);

  if (fields.length !== 54) {
    console.warn(`Row ${r}: expected 54 fields, got ${fields.length} — skipping`);
    parseErrors++;
    continue;
  }

  const get = (name) => fields[col[name]] ?? "";
  const num = (name) => { const v = parseFloat(get(name)); return isNaN(v) ? 0 : v; };
  const opt = (name) => { const v = get(name); return v === "" ? undefined : v; };

  const shipmentId = get("ShipmentID");
  const serviceDate = get("ServiceDate");
  const status = get("Status");
  const createdByKey = get("CreatedBy");
  const creator = CREATOR_MAP[createdByKey] || { id: "usr-1", name: "Jane Cooper" };

  const clientId = get("ClientID");
  const clientName = get("ClientName");
  const siteId = get("SiteID");
  const siteName = get("SiteName");
  const vendorId = get("VendorID");
  const vendorName = get("VendorName");
  const wasteTypeId = get("WasteTypeID");
  const wasteTypeName = get("WasteTypeName");
  const wasteCategory = get("WasteCategory");
  const treatmentMethod = get("TreatmentMethod");

  const qty = num("Quantity");
  const unit = get("UnitOfMeasure");
  const weightPerUnit = num("WeightPerUnitLbs");
  const standardizedLbs = num("StandardizedLbs");
  const standardizedKg = num("StandardizedKg");
  const containerType = get("ContainerType");
  const targetLoadWeight = num("TargetLoadWeightLbs");
  const containerLocation = get("ContainerLocation");
  const serviceFrequency = opt("ServiceFrequency");
  const transporterName = get("TransporterName");
  const receivingFacilityName = get("ReceivingFacility");
  const milesFromFacility = num("MilesToFacility");

  // Regulatory
  const profileNumber = opt("ProfileNumber");
  const wasteCodes = opt("WasteCodes");
  const sourceCode = opt("SourceCode");
  const formCode = opt("FormCode");
  const treatmentCode = opt("TreatmentCode");
  const ewcNumber = opt("EwcNumber");
  const managementMethod = opt("ManagementMethod");
  const triWasteCode = opt("TriWasteCode");
  const notes = opt("Notes");

  // Cost breakdowns
  const mpsCost = {
    haulCharge: num("PlatformHaulCost"),
    disposalFeeEach: num("PlatformDisposalCost"),
    disposalFeeTotal: Math.round(num("PlatformDisposalCost") * qty * 100) / 100,
    fuelFee: num("PlatformFuelFee"),
    environmentalFee: num("PlatformEnvFee"),
    rebate: 0,
    otherFees: num("PlatformOtherFee"),
  };

  const customerCost = {
    haulCharge: num("CustomerHaulBilled"),
    disposalFeeEach: num("CustomerDisposalBilled"),
    disposalFeeTotal: Math.round(num("CustomerDisposalBilled") * qty * 100) / 100,
    fuelFee: num("CustomerFuelBilled"),
    environmentalFee: num("CustomerEnvBilled"),
    rebate: num("RebateCredit"),
    otherFees: num("CustomerOtherBilled"),
  };

  // Receiving facility lookup
  const rf = FACILITY_MAP[receivingFacilityName];

  // Manifest number — hazardous gets the ShipmentID as-is (already has FLE suffix), others get plain ID
  const isHaz = wasteCategory === "Hazardous Waste";
  const manifestNumber = isHaz ? shipmentId : String(shipmentId);

  // Return manifest date — submitted shipments get 5-20 days later
  const shipDate = new Date(serviceDate + "T08:00:00.000Z");
  const returnManifestDate = status === "submitted"
    ? new Date(shipDate.getTime() + ((r % 16) + 5) * 86400000).toISOString().split("T")[0]
    : undefined;

  const shipment = {
    id: `shp-${shipmentId}`,
    clientId,
    siteId,
    vendorId,
    wasteTypeId,
    shipmentDate: serviceDate,
    weightValue: standardizedLbs,
    weightUnit: "lbs",
    notes,
    status,
    createdBy: creator.id,
    createdAt: shipDate.toISOString(),
    updatedAt: shipDate.toISOString(),
    siteName,
    clientName,
    vendorName,
    wasteTypeName,
    createdByName: creator.name,
    wasteStreamName: wasteTypeName,
    containerLocation,
    manifestNumber,
    unit,
    qty,
    weightPerUnit,
    standardizedVolumeLbs: standardizedLbs,
    standardizedVolumeKg: standardizedKg,
    targetLoadWeight,
    wasteCategory,
    treatmentMethod,
    containerType,
    serviceFrequency,
    profileNumber,
    wasteCodes,
    sourceCode,
    formCode,
    treatmentCode,
    ewcNumber,
    receivingFacilityId: rf?.id,
    receivingCompany: rf?.company,
    receivingFacility: receivingFacilityName,
    milesFromFacility,
    receivingAddress: rf?.address,
    receivingCity: rf?.city,
    receivingState: rf?.state,
    receivingZip: rf?.zip,
    receivingEpaId: rf?.epaId,
    transporterName,
    mpsCost,
    customerCost,
    returnManifestDate,
    plantId: managementMethod ? "550781" : undefined,
    managementMethod,
    triWasteCode,
    numberOfContainers: Math.max(1, Math.ceil(qty)),
  };

  shipments.push(shipment);
}

console.log(`Transformed ${shipments.length} shipments (${parseErrors} parse errors)`);

/* ─── Generate TypeScript ─── */

function stringify(val) {
  if (val === undefined) return "undefined";
  if (val === null) return "null";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return JSON.stringify(val);
  if (typeof val === "object") {
    const entries = Object.entries(val)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${stringify(v)}`)
      .join(", ");
    return `{ ${entries} }`;
  }
  return JSON.stringify(val);
}

function shipmentToTS(s) {
  const entries = Object.entries(s)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `    ${k}: ${stringify(v)}`)
    .join(",\n");
  return `  {\n${entries},\n  }`;
}

const tsContent = `// AUTO-GENERATED — do not edit manually
// Source: docs/reference/Golden_Mock_Shipments_1500.csv
// Generated: ${new Date().toISOString()}
// Run: node scripts/generate-shipment-data.mjs

import type { ShipmentView } from "./types";

export const GENERATED_SHIPMENTS: ShipmentView[] = [
${shipments.map(shipmentToTS).join(",\n")}
];
`;

writeFileSync(OUT_PATH, tsContent, "utf-8");
const sizeKB = Math.round(tsContent.length / 1024);
console.log(`Written ${OUT_PATH} (${sizeKB} KB, ${shipments.length} shipments)`);
