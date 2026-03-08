/* ============================================
   MPS Platform — Mock Data Layer
   All data is static / in-memory. No API calls.
   Seeded from real MPS waste management data.
   ============================================ */

import type {
  Client,
  Site,
  Vendor,
  WasteType,
  User,
  Shipment,
  ShipmentView,
  AuditLogEntry,
  ShipmentFilters,
  AuditLogFilters,
  SortParams,
  PaginatedResult,
  WeightUnit,
  ShipmentStatus,
  CostBreakdown,
  WasteCategory,
  TreatmentMethod,
  ServiceFrequency,
  ManagementMethod,
  ReceivingFacility,
  /* Enterprise schema normalized types */
  ServiceItem,
  ContainerLocation,
  TreatmentMethodEntity,
  UnitEntity,
  ContainerEntity,
  ServiceFrequencyEntity,
  Profile,
  ReceivingCompany,
  ReceivingFacilityEntity,
  Transporter,
  ReportDefinition,
  ShipmentRecord,
  ShipmentLineItem,
  ShipmentCostInternal,
  ShipmentCostCustomer,
  ShipmentExternalIdentifier,
} from "./types";

/* ─── Clients ─── */

export const CLIENTS: Client[] = [
  { id: "cli-1", name: "AO Smith", industry: "Manufacturing", active: true },
  { id: "cli-2", name: "General Motors", industry: "Automotive", active: true },
  { id: "cli-3", name: "Stellantis", industry: "Automotive", active: true },
  { id: "cli-4", name: "Ford Motor Company", industry: "Automotive", active: true },
];

/* ─── Sites ─── */

export const SITES: Site[] = [
  // AO Smith sites (from Customer List sheet)
  { id: "site-1", clientId: "cli-1", name: "Ashland City", address: "500 Tennessee Waltz Parkway", city: "Ashland City", state: "TN", zipCode: "37015", region: "Southeast", active: true },
  { id: "site-2", clientId: "cli-1", name: "Charlotte", address: "4302 Raleigh Street", city: "Charlotte", state: "NC", zipCode: "28213", region: "Southeast", active: true },
  { id: "site-3", clientId: "cli-1", name: "El Paso", address: "1270 Don Haskins Dr. Suite A", city: "El Paso", state: "TX", zipCode: "79936", region: "Southwest", active: true },
  { id: "site-4", clientId: "cli-1", name: "Johnson City", address: "1100 E Fairview Ave", city: "Johnson City", state: "TN", zipCode: "37601", region: "Southeast", active: true },
  { id: "site-5", clientId: "cli-1", name: "McBee", address: "25589 Highway 1", city: "McBee", state: "SC", zipCode: "29101", region: "Southeast", active: true },
  // GM sites
  { id: "site-6", clientId: "cli-2", name: "MPS Plant 550781", address: "1000 Industrial Blvd", city: "Flint", state: "MI", zipCode: "48503", region: "Midwest", active: true },
  { id: "site-7", clientId: "cli-2", name: "Lansing Assembly", address: "401 N Verlinden Ave", city: "Lansing", state: "MI", zipCode: "48915", region: "Midwest", active: true },
  // Stellantis sites
  { id: "site-8", clientId: "cli-3", name: "Sterling Heights", address: "38111 Van Dyke Ave", city: "Sterling Heights", state: "MI", zipCode: "48312", region: "Midwest", active: true },
  { id: "site-9", clientId: "cli-3", name: "Toledo Assembly", address: "4400 Chrysler Dr", city: "Toledo", state: "OH", zipCode: "43608", region: "Midwest", active: true },
  // Ford sites
  { id: "site-10", clientId: "cli-4", name: "Dearborn Plant", address: "3001 Miller Rd", city: "Dearborn", state: "MI", zipCode: "48120", region: "Midwest", active: true },
];

/* ─── Receiving Facilities ─── */

export const RECEIVING_FACILITIES: ReceivingFacility[] = [
  { id: "rf-1", company: "Waste Connections", facilityName: "Cheatham County Disposal", address: "2791 Sams Creek Rd", city: "Pegram", state: "TN", zip: "37143" },
  { id: "rf-2", company: "Domtar", facilityName: "Kingsport Packaging", address: "100 Clinchfield St", city: "Kingsport", state: "TN", zip: "37660" },
  { id: "rf-3", company: "Safety Kleen", facilityName: "Safety Kleen Nashville", address: "215 Whitsett Rd", city: "Nashville", state: "TN", zip: "37210", epaId: "TND981474125" },
  { id: "rf-4", company: "Republic Services", facilityName: "Republic Services #721", address: "4001 W 123rd St", city: "Alsip", state: "IL", zip: "60803" },
  { id: "rf-5", company: "Waste Management", facilityName: "Clearview Landfill", address: "4700 National Rd SW", city: "Hebron", state: "OH", zip: "43025" },
  { id: "rf-6", company: "Heritage Environmental", facilityName: "Heritage Thermal Services", address: "1250 St George St", city: "East Liverpool", state: "OH", zip: "43920" },
  { id: "rf-7", company: "Reworld Solutions", facilityName: "Reworld Waste LLC", address: "200 Rte 73", city: "Voorhees", state: "NJ", zip: "08043" },
  { id: "rf-8", company: "Veolia", facilityName: "Veolia ES Technical Solutions", address: "1040 Crown Pointe Pkwy", city: "Atlanta", state: "GA", zip: "30338" },
];

/* ─── Vendors (from Approved Vendors sheet) ─── */

export const VENDORS: Vendor[] = [
  {
    id: "vnd-1", name: "Waste Connections", vendorType: "Disposal", city: "Pegram", state: "TN", active: true,
    vendorCode: "WAST00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Transport"], supplierForm: "Certificate of Insurance",
    dateEntered: "2024-07-01", dateReviewed: "2024-07-01", expirationDate: "2025-06-30",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
  {
    id: "vnd-2", name: "Safety Kleen", vendorType: "Disposal", city: "Nashville", state: "TN", active: true,
    vendorCode: "SAFE00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Processing"], supplierForm: "Supplier Pre-Qualification",
    dateEntered: "2020-01-15", dateReviewed: "2020-01-15", expirationDate: "2025-01-15",
    reviewedBy: "C. King", vendorStatus: "Active",
  },
  {
    id: "vnd-3", name: "Republic Services", vendorType: "Disposal", city: "Phoenix", state: "AZ", active: true,
    vendorCode: "GROE00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal"], supplierForm: "Certificate of Insurance",
    dateEntered: "2024-07-01", dateReviewed: "2024-07-01", expirationDate: "2025-06-30",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
  {
    id: "vnd-4", name: "Waste Management", vendorType: "Disposal", city: "Houston", state: "TX", active: true,
    vendorCode: "WAST103", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal"], supplierForm: "Certificate of Insurance",
    dateEntered: "2023-12-19", dateReviewed: "2023-12-19", expirationDate: "2025-01-01",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
  {
    id: "vnd-5", name: "Domtar / New Indy", vendorType: "Recycler", city: "Kingsport", state: "TN", active: true,
    vendorCode: "DOMT00", completionStatus: "Complete", riskLevel: "Level 2 - Medium",
    commodities: ["Disposal", "Processing"], supplierForm: "Supplier Pre-Qualification",
    dateEntered: "2020-06-01", dateReviewed: "2020-06-01", expirationDate: "2025-06-01",
    reviewedBy: "C. King", vendorStatus: "Active",
  },
  {
    id: "vnd-6", name: "Heritage Environmental", vendorType: "Disposal", city: "East Liverpool", state: "OH", active: true,
    vendorCode: "HERI05", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Transport"], supplierForm: "Certificate of Insurance",
    dateEntered: "2024-11-26", dateReviewed: "2024-11-26", expirationDate: "2025-01-31",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
  {
    id: "vnd-7", name: "Veolia", vendorType: "Disposal", city: "Atlanta", state: "GA", active: true,
    vendorCode: "VEOL00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Processing"], supplierForm: "Supplier Pre-Qualification",
    dateEntered: "2019-12-06", dateReviewed: "2019-12-06", expirationDate: "2024-12-06",
    reviewedBy: "C. King", vendorStatus: "Active",
  },
  {
    id: "vnd-8", name: "Reworld Solutions", vendorType: "Disposal", city: "Voorhees", state: "NJ", active: true,
    vendorCode: "COVA00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Consultants/Professional"], supplierForm: "Supplier Pre-Qualification",
    dateEntered: "2019-12-06", dateReviewed: "2019-12-06", expirationDate: "2024-12-06",
    reviewedBy: "C. King", vendorStatus: "Active",
  },
  {
    id: "vnd-9", name: "Pratt Industries", vendorType: "Recycler", city: "Conyers", state: "GA", active: true,
    vendorCode: "PRAT00", completionStatus: "Complete", riskLevel: "Level 2 - Medium",
    commodities: ["Disposal"], supplierForm: "Supplier Commitment Policy",
    dateEntered: "2023-08-14", dateReviewed: "2023-08-14", expirationDate: "2028-08-14",
    reviewedBy: "J. Plancon", vendorStatus: "Active",
  },
  {
    id: "vnd-10", name: "Bavarian Waste Services", vendorType: "Processor", city: "Munich", state: "MI", active: true,
    vendorCode: "BAVA00", completionStatus: "Complete", riskLevel: "Level 2 - Medium",
    commodities: ["Disposal"], supplierForm: "Supplier Pre-Qualification",
    dateEntered: "2019-12-06", dateReviewed: "2019-12-06", expirationDate: "2024-12-06",
    reviewedBy: "C. King", vendorStatus: "Active",
  },
  {
    id: "vnd-11", name: "Boyas Excavating", vendorType: "Disposal", city: "Cleveland", state: "OH", active: true,
    vendorCode: "BOYA00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Processing"], supplierForm: "Certificate of Insurance",
    dateEntered: "2024-07-12", dateReviewed: "2024-07-12", expirationDate: "2025-07-08",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
  {
    id: "vnd-12", name: "Direct Shred LLC", vendorType: "Processor", city: "Nashville", state: "TN", active: true,
    vendorCode: "DIRE00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Transport"], supplierForm: "Certificate of Insurance",
    dateEntered: "2024-11-05", dateReviewed: "2024-11-05", expirationDate: "2025-07-01",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
  {
    id: "vnd-13", name: "Metalworking Lubricants Co.", vendorType: "Processor", city: "Toledo", state: "OH", active: true,
    vendorCode: "META00", completionStatus: "Incomplete", riskLevel: "Level 1 - High",
    commodities: ["Disposal"], supplierForm: "Supplier Pre-Qualification",
    dateEntered: "2020-03-12", dateReviewed: "2020-03-12", expirationDate: "2025-03-12",
    reviewedBy: "C. King", vendorStatus: "Temporary",
  },
  {
    id: "vnd-14", name: "Millennium Recycling", vendorType: "Recycler", city: "Sioux Falls", state: "SD", active: true,
    vendorCode: "MILL08", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Transport"], supplierForm: "Supplier Commitment Policy",
    dateEntered: "2023-10-11", dateReviewed: "2023-10-11", expirationDate: "2028-10-11",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
  {
    id: "vnd-15", name: "GIP Paving Inc.", vendorType: "Disposal", city: "Troy", state: "MI", active: true,
    vendorCode: "GIPP00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Transport"], supplierForm: "Supplier Commitment Policy",
    dateEntered: "2024-06-05", dateReviewed: "2024-06-05", expirationDate: "2029-06-05",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
  {
    id: "vnd-16", name: "Lonewolf Petroleum Co.", vendorType: "Processor", city: "Oklahoma City", state: "OK", active: true,
    vendorCode: "LONE00", completionStatus: "Complete", riskLevel: "Level 1 - High",
    commodities: ["Disposal", "Transport"], supplierForm: "Certificate of Insurance",
    dateEntered: "2024-10-11", dateReviewed: "2024-10-11", expirationDate: "2025-02-08",
    reviewedBy: "K. Hollins", vendorStatus: "Active",
  },
];

/* ─── Waste Types (from Selection Lists + actual shipment data) ─── */

export const WASTE_TYPES: WasteType[] = [
  { id: "wt-1", name: "Trash", hazardousFlag: false, description: "General plant trash and mixed solid waste", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-2", name: "Filter Cake", hazardousFlag: false, description: "WWTP filter cake from wastewater treatment", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-3", name: "Paint Filter", hazardousFlag: false, description: "Paint filtration residue", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-4", name: "Cardboard/OCC", hazardousFlag: false, description: "Old corrugated cardboard for recycling", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Recycling" },
  { id: "wt-5", name: "MEK", hazardousFlag: true, description: "Methyl ethyl ketone solvent waste", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Incineration", defaultWasteCodes: "D001, F005", defaultSourceCode: "G06", defaultFormCode: "W209", defaultTreatmentCode: "H040", defaultEwcNumber: "08 01 11*" },
  { id: "wt-6", name: "Paint and Solvent", hazardousFlag: true, description: "Waste paint and solvent mixtures", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Incineration", defaultWasteCodes: "D001, F005", defaultSourceCode: "G06", defaultFormCode: "W209", defaultTreatmentCode: "H040", defaultEwcNumber: "08 01 11*" },
  { id: "wt-7", name: "Paint Solids", hazardousFlag: true, description: "Dried paint solids and residues", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Incineration", defaultWasteCodes: "D001, F005", defaultSourceCode: "G06", defaultFormCode: "W209", defaultTreatmentCode: "H040", defaultEwcNumber: "08 01 11*" },
  { id: "wt-8", name: "Ceramic Balls", hazardousFlag: false, description: "Spent ceramic media from painting", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Recycling" },
  { id: "wt-9", name: "Broken Battery", hazardousFlag: true, description: "Damaged batteries for recycling", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Recycling" },
  { id: "wt-10", name: "Washer Fluid", hazardousFlag: true, description: "Spent washer fluid", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Fuel Blending" },
  { id: "wt-11", name: "Paint-Solvent", hazardousFlag: true, description: "Mixed paint and solvent waste", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Fuel Blending" },
  { id: "wt-12", name: "Barium Paint", hazardousFlag: true, description: "Paint waste containing barium", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Incineration" },
  { id: "wt-13", name: "Waterborne Paint", hazardousFlag: true, description: "Waterborne paint waste", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Incineration" },
  { id: "wt-14", name: "WWTP Filter Cake", hazardousFlag: false, description: "Wastewater treatment filter cake", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-15", name: "Computer Equipment", hazardousFlag: false, description: "Recycled computer equipment", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Recycling" },
  { id: "wt-16", name: "Empty Plastic Totes", hazardousFlag: false, description: "Empty plastic totes for recycle", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Reuse" },
  { id: "wt-17", name: "Empty Drums (Plastic)", hazardousFlag: false, description: "Empty plastic drums", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Reuse" },
  { id: "wt-18", name: "Empty Drums (Metal)", hazardousFlag: false, description: "Empty metal drums", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Reuse" },
  { id: "wt-19", name: "Bio Medical", hazardousFlag: false, description: "Bio medical waste", active: true, wasteCategory: "Medical", defaultTreatmentMethod: "Incineration" },
  { id: "wt-20", name: "Paint Booth Mopping", hazardousFlag: false, description: "Paint booth cleaning waste", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-21", name: "Oil/Water/Chemical", hazardousFlag: false, description: "Oil/water separator and chemical waste", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-22", name: "Pallets (Wood)", hazardousFlag: false, description: "Wooden pallets for recycling", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Recycling" },
  { id: "wt-23", name: "Contractor Trash", hazardousFlag: false, description: "Construction contractor waste", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-24", name: "HR Waste", hazardousFlag: false, description: "Human resources / office waste", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-25", name: "Roofing Membrane", hazardousFlag: false, description: "Roofing membrane waste", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-26", name: "Mixed Metal", hazardousFlag: false, description: "Mixed scrap metal", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Recycling" },
  { id: "wt-27", name: "Sludge", hazardousFlag: false, description: "Industrial sludge", active: true, wasteCategory: "Non Haz", defaultTreatmentMethod: "Landfill" },
  { id: "wt-28", name: "Confidential Documents", hazardousFlag: false, description: "Confidential document shredding", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Recycling" },
  { id: "wt-29", name: "Glass", hazardousFlag: false, description: "Waste glass", active: true, wasteCategory: "Recycling", defaultTreatmentMethod: "Recycling" },
  { id: "wt-30", name: "PRM Free", hazardousFlag: true, description: "PRM-free hazardous waste", active: true, wasteCategory: "Hazardous Waste", defaultTreatmentMethod: "Incineration" },
];

/* ─── Users ─── */

export const USERS: User[] = [
  { id: "usr-1", email: "jane.cooper@mpsgrp.com", displayName: "Jane Cooper", role: "system_admin", active: true },
  { id: "usr-2", email: "michael.chen@mpsgrp.com", displayName: "Michael Chen", role: "admin", active: true },
  { id: "usr-3", email: "sarah.johnson@mpsgrp.com", displayName: "Sarah Johnson", role: "admin", active: true },
  { id: "usr-4", email: "david.williams@mpsgrp.com", displayName: "David Williams", role: "site_user", active: true, assignedSiteIds: ["site-1", "site-2"] },
  { id: "usr-5", email: "emily.martinez@mpsgrp.com", displayName: "Emily Martinez", role: "site_user", active: true, assignedSiteIds: ["site-3", "site-4"] },
  { id: "usr-6", email: "james.brown@mpsgrp.com", displayName: "James Brown", role: "site_user", active: true, assignedSiteIds: ["site-5", "site-6"] },
  { id: "usr-7", email: "k.hollins@mpsgrp.com", displayName: "K. Hollins", role: "admin", active: true },
  { id: "usr-8", email: "j.hamill@mpsgrp.com", displayName: "J. Hamill", role: "site_user", active: true, assignedSiteIds: ["site-7", "site-8"] },
  { id: "usr-9", email: "c.king@mpsgrp.com", displayName: "C. King", role: "admin", active: true },
  { id: "usr-10", email: "j.plancon@mpsgrp.com", displayName: "J. Plancon", role: "site_user", active: true, assignedSiteIds: ["site-9", "site-10"] },
];

/* ════════════════════════════════════════════════════════════
   Enterprise Schema — Normalized Reference Data
   Maps to docs/sample data/mps_data_extraction_and_enterprise_schema.md
   ════════════════════════════════════════════════════════════ */

/* ─── Service Items (Byproduct / Service Names) ─── */

export const SERVICE_ITEMS: ServiceItem[] = WASTE_TYPES.map((wt) => ({
  id: `si-${wt.id.split("-")[1]}`,
  serviceName: wt.name,
  description: wt.description,
  defaultWasteTypeId: wt.id,
  activeFlag: wt.active,
}));

/* ─── Container Locations ─── */

export const CONTAINER_LOCATIONS: ContainerLocation[] = [
  { id: "cloc-1", siteId: "site-1", locationName: "Dock 10", activeFlag: true },
  { id: "cloc-2", siteId: "site-1", locationName: "Trash Room", activeFlag: true },
  { id: "cloc-3", siteId: "site-1", locationName: "WWT", activeFlag: true },
  { id: "cloc-4", siteId: "site-1", locationName: "Drum Pad", activeFlag: true },
  { id: "cloc-5", siteId: "site-6", locationName: "Waste Dock", activeFlag: true },
  { id: "cloc-6", siteId: "site-6", locationName: "Chemical Storage", activeFlag: true },
  { id: "cloc-7", siteId: "site-6", locationName: "Trash Compactor", activeFlag: true },
  { id: "cloc-8", siteId: "site-8", locationName: "Loading Dock B", activeFlag: true },
  { id: "cloc-9", siteId: "site-8", locationName: "Recycling Bay", activeFlag: true },
  { id: "cloc-10", siteId: "site-10", locationName: "Paint Shop", activeFlag: true },
  { id: "cloc-11", siteId: "site-10", locationName: "Yard", activeFlag: true },
  { id: "cloc-12", siteId: "site-2", locationName: "Loading Dock", activeFlag: true },
  { id: "cloc-13", siteId: "site-3", locationName: "Warehouse Bay", activeFlag: true },
  { id: "cloc-14", siteId: "site-4", locationName: "Service Area", activeFlag: true },
  { id: "cloc-15", siteId: "site-5", locationName: "Main Dock", activeFlag: true },
];

const containerLocationByName = new Map(CONTAINER_LOCATIONS.map((cl) => [`${cl.siteId}:${cl.locationName}`, cl]));

/* ─── Treatment Methods (normalized entity) ─── */

export const TREATMENT_METHODS_REF: TreatmentMethodEntity[] = [
  { id: "tm-1", treatmentMethodName: "Landfill", description: "Municipal solid waste landfill disposal", activeFlag: true },
  { id: "tm-2", treatmentMethodName: "Recycling", description: "Material recovery and recycling", activeFlag: true },
  { id: "tm-3", treatmentMethodName: "Incineration", description: "Thermal destruction / incineration", activeFlag: true },
  { id: "tm-4", treatmentMethodName: "Fuel Blending", description: "Fuel blending for energy recovery", activeFlag: true },
  { id: "tm-5", treatmentMethodName: "Reuse", description: "Direct reuse of materials", activeFlag: true },
  { id: "tm-6", treatmentMethodName: "WWTP", description: "Wastewater treatment plant processing", activeFlag: true },
  { id: "tm-7", treatmentMethodName: "MSW Landfill", description: "Municipal solid waste landfill", activeFlag: true },
  { id: "tm-8", treatmentMethodName: "HAZ Landfill", description: "Hazardous waste landfill (Subtitle C)", activeFlag: true },
  { id: "tm-9", treatmentMethodName: "WTE", description: "Waste-to-energy conversion", activeFlag: true },
];

const treatmentMethodByName = new Map(TREATMENT_METHODS_REF.map((tm) => [tm.treatmentMethodName, tm]));

/* ─── Units ─── */

export const UNITS_REF: UnitEntity[] = [
  { id: "unit-1", unitCode: "Ton", unitName: "Ton", unitFamily: "weight", conversionToLbFactor: 2000, conversionToKgFactor: 907.185, activeFlag: true },
  { id: "unit-2", unitCode: "DM", unitName: "Drum", unitFamily: "container", activeFlag: true },
  { id: "unit-3", unitCode: "Lb", unitName: "Pound", unitFamily: "weight", conversionToLbFactor: 1, conversionToKgFactor: 0.4536, activeFlag: true },
  { id: "unit-4", unitCode: "Load", unitName: "Load", unitFamily: "container", activeFlag: true },
  { id: "unit-5", unitCode: "Each", unitName: "Each", unitFamily: "count", activeFlag: true },
  { id: "unit-6", unitCode: "Gal", unitName: "Gallon", unitFamily: "volume", activeFlag: true },
  { id: "unit-7", unitCode: "Tote", unitName: "Tote", unitFamily: "container", activeFlag: true },
  { id: "unit-8", unitCode: "CYB", unitName: "Cubic Yard Bin", unitFamily: "volume", activeFlag: true },
  { id: "unit-9", unitCode: "Pail", unitName: "Pail", unitFamily: "container", activeFlag: true },
];

const unitByCode = new Map(UNITS_REF.map((u) => [u.unitCode, u]));

/* ─── Containers ─── */

export const CONTAINERS_REF: ContainerEntity[] = [
  { id: "cnt-1", containerName: "2yd Front Load", containerFamily: "Front Load", activeFlag: true },
  { id: "cnt-2", containerName: "30CY Roll Off", containerFamily: "Roll Off", nominalCapacityValue: 30, activeFlag: true },
  { id: "cnt-3", containerName: "35CY Self Contained Compactor", containerFamily: "Compactor", nominalCapacityValue: 35, activeFlag: true },
  { id: "cnt-4", containerName: "42CY Compactor", containerFamily: "Compactor", nominalCapacityValue: 42, activeFlag: true },
  { id: "cnt-5", containerName: "55gal Drum", containerFamily: "Drum", nominalCapacityValue: 55, activeFlag: true },
  { id: "cnt-6", containerName: "275gal Tote", containerFamily: "Tote", nominalCapacityValue: 275, activeFlag: true },
  { id: "cnt-7", containerName: "330 Gal Tote", containerFamily: "Tote", nominalCapacityValue: 330, activeFlag: true },
  { id: "cnt-8", containerName: "Box Truck", containerFamily: "Vehicle", activeFlag: true },
  { id: "cnt-9", containerName: "Trailer", containerFamily: "Vehicle", activeFlag: true },
  { id: "cnt-10", containerName: "Vac Truck", containerFamily: "Vehicle", activeFlag: true },
  { id: "cnt-11", containerName: "Tanker", containerFamily: "Vehicle", activeFlag: true },
  { id: "cnt-12", containerName: "Portable tanks", containerFamily: "Tank", activeFlag: true },
  { id: "cnt-13", containerName: "Dump truck", containerFamily: "Vehicle", activeFlag: true },
  { id: "cnt-14", containerName: "Metal drums, barrels, kegs", containerFamily: "Drum", activeFlag: true },
  { id: "cnt-15", containerName: "Fiberboard or plastic drums, barrels, kegs", containerFamily: "Drum", activeFlag: true },
  { id: "cnt-16", containerName: "Metal boxes, cartons, cases (including roll-offs)", containerFamily: "Box", activeFlag: true },
  { id: "cnt-17", containerName: "Other", containerFamily: "Other", activeFlag: true },
];

const containerByName = new Map(CONTAINERS_REF.map((c) => [c.containerName, c]));

/* ─── Service Frequencies ─── */

export const SERVICE_FREQUENCIES_REF: ServiceFrequencyEntity[] = [
  { id: "sf-1", frequencyName: "On Call", sortOrder: 1, activeFlag: true },
  { id: "sf-2", frequencyName: "1x Week", sortOrder: 2, activeFlag: true },
  { id: "sf-3", frequencyName: "2x Week", sortOrder: 3, activeFlag: true },
  { id: "sf-4", frequencyName: "3x Week", sortOrder: 4, activeFlag: true },
  { id: "sf-5", frequencyName: "4x Week", sortOrder: 5, activeFlag: true },
  { id: "sf-6", frequencyName: "5x Week", sortOrder: 6, activeFlag: true },
  { id: "sf-7", frequencyName: "Once a Month", sortOrder: 7, activeFlag: true },
  { id: "sf-8", frequencyName: "Every 4 Weeks", sortOrder: 8, activeFlag: true },
  { id: "sf-9", frequencyName: "Other", sortOrder: 9, activeFlag: true },
];

const serviceFreqByName = new Map(SERVICE_FREQUENCIES_REF.map((sf) => [sf.frequencyName, sf]));

/* ─── Profiles ─── */

export const PROFILES: Profile[] = [
  { id: "prof-1", profileNumber: "41587", customerId: "cli-1", wasteTypeId: "wt-5", activeFlag: true },
  { id: "prof-2", profileNumber: "41588", customerId: "cli-1", wasteTypeId: "wt-6", activeFlag: true },
  { id: "prof-3", profileNumber: "41589", customerId: "cli-1", wasteTypeId: "wt-7", activeFlag: true },
  { id: "prof-4", profileNumber: "41590", customerId: "cli-1", wasteTypeId: "wt-8", activeFlag: true },
  { id: "prof-5", profileNumber: "55078-A", customerId: "cli-2", activeFlag: true },
  { id: "prof-6", profileNumber: "FORD-ENV-01", customerId: "cli-4", activeFlag: true },
];

const profileByNumber = new Map(PROFILES.map((p) => [p.profileNumber, p]));

/* ─── Receiving Companies ─── */

export const RECEIVING_COMPANIES: ReceivingCompany[] = [
  { id: "rc-1", companyName: "Waste Connections", activeFlag: true },
  { id: "rc-2", companyName: "Domtar", activeFlag: true },
  { id: "rc-3", companyName: "Safety Kleen", activeFlag: true },
  { id: "rc-4", companyName: "Republic Services", activeFlag: true },
  { id: "rc-5", companyName: "Waste Management", activeFlag: true },
  { id: "rc-6", companyName: "Heritage Environmental", activeFlag: true },
  { id: "rc-7", companyName: "Reworld Solutions", activeFlag: true },
  { id: "rc-8", companyName: "Veolia", activeFlag: true },
];

const receivingCompanyByName = new Map(RECEIVING_COMPANIES.map((rc) => [rc.companyName, rc]));

/* ─── Receiving Facilities (normalized entity) ─── */

export const RECEIVING_FACILITIES_NORMALIZED: ReceivingFacilityEntity[] = RECEIVING_FACILITIES.map((rf) => ({
  id: rf.id,
  receivingCompanyId: receivingCompanyByName.get(rf.company)?.id ?? "rc-1",
  facilityName: rf.facilityName,
  addressLine1: rf.address,
  city: rf.city,
  stateCode: rf.state,
  postalCode: rf.zip,
  epaIdNumber: rf.epaId,
  activeFlag: true,
}));

/* ─── Transporters ─── */

export const TRANSPORTERS: Transporter[] = [
  { id: "trn-1", transporterName: "Waste Connections", vendorId: "vnd-1", activeFlag: true },
  { id: "trn-2", transporterName: "Safety Kleen", vendorId: "vnd-2", activeFlag: true },
  { id: "trn-3", transporterName: "Republic Services", vendorId: "vnd-3", activeFlag: true },
  { id: "trn-4", transporterName: "Waste Management", vendorId: "vnd-4", activeFlag: true },
  { id: "trn-5", transporterName: "New Indy", vendorId: "vnd-5", activeFlag: true },
  { id: "trn-6", transporterName: "Heritage Environmental", vendorId: "vnd-6", activeFlag: true },
  { id: "trn-7", transporterName: "Pratt Industries", vendorId: "vnd-9", activeFlag: true },
  { id: "trn-8", transporterName: "Millennium Recycling", vendorId: "vnd-14", activeFlag: true },
];

const transporterByName = new Map(TRANSPORTERS.map((t) => [t.transporterName, t]));

/* ─── Report Definitions ─── */

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  { id: "rpt-1", reportName: "Waste Trends", reportType: "analytics", activeFlag: true },
  { id: "rpt-2", reportName: "Cost Analysis", reportType: "analytics", activeFlag: true },
  { id: "rpt-3", reportName: "Green House Gas Emission Report", reportType: "analytics", activeFlag: true },
  { id: "rpt-4", reportName: "Light Load Report", reportType: "analytics", activeFlag: true },
  { id: "rpt-5", reportName: "Biennial Hazardous Waste Report", reportType: "regulatory", exportTemplateCode: "BIENNIAL", activeFlag: true },
  { id: "rpt-6", reportName: "GEM Report (Ford)", reportType: "compliance", exportTemplateCode: "GEM", activeFlag: true },
  { id: "rpt-7", reportName: "GMR2 Report (GM)", reportType: "compliance", exportTemplateCode: "GMR2", activeFlag: true },
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

interface ShipmentTemplate {
  wasteTypeId: string;
  siteId: string;
  vendorId: string;
  unit: string;
  qty: number;
  weightPerUnit: number;
  targetLoadWeight: number;
  containerType: string;
  serviceFrequency: ServiceFrequency;
  treatmentMethod: TreatmentMethod;
  wasteCategory: WasteCategory;
  containerLocation: string;
  receivingFacilityIdx: number;
  transporterName: string;
  mpsHaul: number;
  mpsDisposalEach: number;
  mpsFuel: number;
  mpsEnv: number;
  mpsOther: number;
  custHaul: number;
  custDisposalEach: number;
  custFuel: number;
  custEnv: number;
  custRebate: number;
  custOther: number;
  profileNumber?: string;
  wasteCodes?: string;
  sourceCode?: string;
  formCode?: string;
  treatmentCode?: string;
  ewcNumber?: string;
  managementMethod?: ManagementMethod;
  triWasteCode?: string;
}

function generateShipments(): Shipment[] {
  const shipments: Shipment[] = [];
  const statuses: ShipmentStatus[] = ["submitted", "submitted", "submitted", "submitted", "pending"];

  // Templates based on real data from the spreadsheets
  const templates: ShipmentTemplate[] = [
    // AO Smith Ashland City — Trash (various containers)
    { wasteTypeId: "wt-1", siteId: "site-1", vendorId: "vnd-1", unit: "Ton", qty: 3.56, weightPerUnit: 2000, targetLoadWeight: 2500, containerType: "30CY Roll Off", serviceFrequency: "On Call", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "Dock 10", receivingFacilityIdx: 0, transporterName: "Waste Connections", mpsHaul: 450.98, mpsDisposalEach: 108.58, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 275, custDisposalEach: 90, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 0 },
    { wasteTypeId: "wt-1", siteId: "site-1", vendorId: "vnd-1", unit: "Ton", qty: 5.31, weightPerUnit: 2000, targetLoadWeight: 16000, containerType: "42CY Compactor", serviceFrequency: "2x Week", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "Dock 10", receivingFacilityIdx: 0, transporterName: "Waste Connections", mpsHaul: 450.98, mpsDisposalEach: 108.58, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 275, custDisposalEach: 90, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 0 },
    { wasteTypeId: "wt-1", siteId: "site-1", vendorId: "vnd-1", unit: "Ton", qty: 2.25, weightPerUnit: 2000, targetLoadWeight: 2500, containerType: "30CY Roll Off", serviceFrequency: "On Call", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "Trash Room", receivingFacilityIdx: 0, transporterName: "Waste Connections", mpsHaul: 450.98, mpsDisposalEach: 108.58, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 275, custDisposalEach: 90, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 0 },
    // Filter Cake
    { wasteTypeId: "wt-2", siteId: "site-1", vendorId: "vnd-1", unit: "Ton", qty: 8.52, weightPerUnit: 2000, targetLoadWeight: 16000, containerType: "30CY Roll Off", serviceFrequency: "On Call", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "WWT", receivingFacilityIdx: 0, transporterName: "Waste Connections", mpsHaul: 717.46, mpsDisposalEach: 80.71, mpsFuel: 0, mpsEnv: 0, mpsOther: 122.97, custHaul: 400, custDisposalEach: 45, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 75 },
    { wasteTypeId: "wt-2", siteId: "site-1", vendorId: "vnd-1", unit: "Ton", qty: 6.89, weightPerUnit: 2000, targetLoadWeight: 16000, containerType: "30CY Roll Off", serviceFrequency: "On Call", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "WWT", receivingFacilityIdx: 0, transporterName: "Waste Connections", mpsHaul: 717.46, mpsDisposalEach: 80.71, mpsFuel: 0, mpsEnv: 0, mpsOther: 122.97, custHaul: 400, custDisposalEach: 45, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 75 },
    // Paint Filter
    { wasteTypeId: "wt-3", siteId: "site-1", vendorId: "vnd-1", unit: "Ton", qty: 3.28, weightPerUnit: 2000, targetLoadWeight: 2000, containerType: "30CY Roll Off", serviceFrequency: "On Call", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "WWT", receivingFacilityIdx: 0, transporterName: "Waste Connections", mpsHaul: 717.46, mpsDisposalEach: 80.71, mpsFuel: 0, mpsEnv: 0, mpsOther: 122.97, custHaul: 400, custDisposalEach: 45, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 75 },
    // Cardboard/OCC — generates rebate (negative customer cost)
    { wasteTypeId: "wt-4", siteId: "site-1", vendorId: "vnd-5", unit: "Ton", qty: 11.46, weightPerUnit: 2000, targetLoadWeight: 16000, containerType: "Trailer", serviceFrequency: "On Call", treatmentMethod: "Recycling", wasteCategory: "Recycling", containerLocation: "Trash Room", receivingFacilityIdx: 1, transporterName: "New Indy", mpsHaul: 0, mpsDisposalEach: 7.50, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 0, custDisposalEach: 0, custFuel: 0, custEnv: 0, custRebate: 1776.30, custOther: 0 },
    // Hazardous — MEK
    { wasteTypeId: "wt-5", siteId: "site-1", vendorId: "vnd-2", unit: "DM", qty: 6, weightPerUnit: 420, targetLoadWeight: 420, containerType: "55gal Drum", serviceFrequency: "On Call", treatmentMethod: "Incineration", wasteCategory: "Hazardous Waste", containerLocation: "Drum Pad", receivingFacilityIdx: 2, transporterName: "Safety Kleen", mpsHaul: 30, mpsDisposalEach: 125, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 0, custDisposalEach: 0, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 0, profileNumber: "41587", wasteCodes: "D001, F005", sourceCode: "G06", formCode: "W209", treatmentCode: "H040", ewcNumber: "08 01 11*" },
    // Hazardous — Paint and Solvent
    { wasteTypeId: "wt-6", siteId: "site-1", vendorId: "vnd-2", unit: "DM", qty: 8, weightPerUnit: 420, targetLoadWeight: 420, containerType: "55gal Drum", serviceFrequency: "On Call", treatmentMethod: "Incineration", wasteCategory: "Hazardous Waste", containerLocation: "Drum Pad", receivingFacilityIdx: 2, transporterName: "Safety Kleen", mpsHaul: 30, mpsDisposalEach: 125, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 0, custDisposalEach: 0, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 0, profileNumber: "41588", wasteCodes: "D001, F005", sourceCode: "G06", formCode: "W209", treatmentCode: "H040", ewcNumber: "08 01 11*" },
    // Hazardous — Paint Solids
    { wasteTypeId: "wt-7", siteId: "site-1", vendorId: "vnd-2", unit: "DM", qty: 4, weightPerUnit: 300, targetLoadWeight: 2000, containerType: "55gal Drum", serviceFrequency: "On Call", treatmentMethod: "Incineration", wasteCategory: "Hazardous Waste", containerLocation: "Drum Pad", receivingFacilityIdx: 2, transporterName: "Safety Kleen", mpsHaul: 30, mpsDisposalEach: 425, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 0, custDisposalEach: 0, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 0, profileNumber: "41589", wasteCodes: "D001, F005", sourceCode: "G06", formCode: "W209", treatmentCode: "H040", ewcNumber: "08 01 11*" },
    // Ceramic Balls
    { wasteTypeId: "wt-8", siteId: "site-1", vendorId: "vnd-2", unit: "DM", qty: 3, weightPerUnit: 550, targetLoadWeight: 550, containerType: "55gal Drum", serviceFrequency: "On Call", treatmentMethod: "Recycling", wasteCategory: "Non Haz", containerLocation: "Drum Pad", receivingFacilityIdx: 2, transporterName: "Safety Kleen", mpsHaul: 0, mpsDisposalEach: 1334.03, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 0, custDisposalEach: 0, custFuel: 0, custEnv: 0, custRebate: 0, custOther: 0, profileNumber: "41590" },
    // GM Plant — Broken Battery
    { wasteTypeId: "wt-9", siteId: "site-6", vendorId: "vnd-3", unit: "Lb", qty: 1, weightPerUnit: 105, targetLoadWeight: 500, containerType: "Fiberboard or plastic drums, barrels, kegs", serviceFrequency: "On Call", treatmentMethod: "Recycling", wasteCategory: "Hazardous Waste", containerLocation: "Waste Dock", receivingFacilityIdx: 3, transporterName: "Republic Services", mpsHaul: 150, mpsDisposalEach: 85, mpsFuel: 25, mpsEnv: 0, mpsOther: 0, custHaul: 200, custDisposalEach: 100, custFuel: 30, custEnv: 0, custRebate: 0, custOther: 0, managementMethod: "RE", triWasteCode: "M93" },
    // GM Plant — Washer Fluid
    { wasteTypeId: "wt-10", siteId: "site-6", vendorId: "vnd-6", unit: "Lb", qty: 1, weightPerUnit: 459, targetLoadWeight: 1000, containerType: "Metal drums, barrels, kegs", serviceFrequency: "On Call", treatmentMethod: "Fuel Blending", wasteCategory: "Hazardous Waste", containerLocation: "Chemical Storage", receivingFacilityIdx: 5, transporterName: "Heritage Environmental", mpsHaul: 200, mpsDisposalEach: 150, mpsFuel: 30, mpsEnv: 15, mpsOther: 0, custHaul: 250, custDisposalEach: 175, custFuel: 35, custEnv: 20, custRebate: 0, custOther: 0, managementMethod: "ER", triWasteCode: "M56" },
    // GM Plant — General Plant Trash
    { wasteTypeId: "wt-1", siteId: "site-6", vendorId: "vnd-4", unit: "Lb", qty: 1, weightPerUnit: 70780, targetLoadWeight: 80000, containerType: "Metal boxes, cartons, cases (including roll-offs)", serviceFrequency: "2x Week", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "Trash Compactor", receivingFacilityIdx: 4, transporterName: "Waste Management", mpsHaul: 850, mpsDisposalEach: 45, mpsFuel: 75, mpsEnv: 0, mpsOther: 0, custHaul: 950, custDisposalEach: 55, custFuel: 85, custEnv: 0, custRebate: 0, custOther: 0, managementMethod: "LF", triWasteCode: "M64" },
    // Stellantis — Trash
    { wasteTypeId: "wt-1", siteId: "site-8", vendorId: "vnd-3", unit: "Ton", qty: 4.2, weightPerUnit: 2000, targetLoadWeight: 16000, containerType: "42CY Compactor", serviceFrequency: "3x Week", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "Loading Dock B", receivingFacilityIdx: 3, transporterName: "Republic Services", mpsHaul: 525, mpsDisposalEach: 95, mpsFuel: 45, mpsEnv: 0, mpsOther: 0, custHaul: 600, custDisposalEach: 110, custFuel: 50, custEnv: 0, custRebate: 0, custOther: 0 },
    // Stellantis — Cardboard
    { wasteTypeId: "wt-4", siteId: "site-8", vendorId: "vnd-9", unit: "Ton", qty: 8.75, weightPerUnit: 2000, targetLoadWeight: 16000, containerType: "Trailer", serviceFrequency: "On Call", treatmentMethod: "Recycling", wasteCategory: "Recycling", containerLocation: "Recycling Bay", receivingFacilityIdx: 3, transporterName: "Pratt Industries", mpsHaul: 0, mpsDisposalEach: 5.00, mpsFuel: 0, mpsEnv: 0, mpsOther: 0, custHaul: 0, custDisposalEach: 0, custFuel: 0, custEnv: 0, custRebate: 1350, custOther: 0 },
    // Ford — Paint Booth waste
    { wasteTypeId: "wt-20", siteId: "site-10", vendorId: "vnd-6", unit: "DM", qty: 6, weightPerUnit: 459, targetLoadWeight: 3000, containerType: "Metal drums, barrels, kegs", serviceFrequency: "On Call", treatmentMethod: "Landfill", wasteCategory: "Non Haz", containerLocation: "Paint Shop", receivingFacilityIdx: 5, transporterName: "Heritage Environmental", mpsHaul: 350, mpsDisposalEach: 200, mpsFuel: 40, mpsEnv: 20, mpsOther: 0, custHaul: 425, custDisposalEach: 240, custFuel: 50, custEnv: 25, custRebate: 0, custOther: 0 },
    // Ford — Pallets
    { wasteTypeId: "wt-22", siteId: "site-10", vendorId: "vnd-14", unit: "Lb", qty: 1, weightPerUnit: 12000, targetLoadWeight: 15000, containerType: "Dump truck", serviceFrequency: "Once a Month", treatmentMethod: "Recycling", wasteCategory: "Recycling", containerLocation: "Yard", receivingFacilityIdx: 4, transporterName: "Millennium Recycling", mpsHaul: 200, mpsDisposalEach: 0, mpsFuel: 25, mpsEnv: 0, mpsOther: 0, custHaul: 250, custDisposalEach: 0, custFuel: 30, custEnv: 0, custRebate: 450, custOther: 0 },
  ];

  // Generate ~120 shipments across 8 months (Jul 2024 – Feb 2025)
  const startDate = new Date(2024, 6, 1); // Jul 1, 2024
  const endDate = new Date(2025, 1, 28); // Feb 28, 2025
  const dayRange = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < 120; i++) {
    const tmpl = templates[i % templates.length];
    const site = siteMap.get(tmpl.siteId)!;
    const client = clientMap.get(site.clientId)!;
    const vendor = vendorMap.get(tmpl.vendorId)!;
    const wasteType = wasteTypeMap.get(tmpl.wasteTypeId)!;
    const creator = USERS[i % 4];

    // Spread dates across the range with some randomness
    const daysOffset = Math.floor((i / 120) * dayRange) + (i % 7);
    const shipDate = new Date(startDate.getTime() + daysOffset * 86400000);
    const dateStr = shipDate.toISOString().split("T")[0];

    // Vary quantities slightly
    const qtyVariance = 0.7 + ((i * 17) % 60) / 100; // 0.7 to 1.3
    const qty = Math.round(tmpl.qty * qtyVariance * 100) / 100;
    const standardizedLbs = Math.round(qty * tmpl.weightPerUnit * 100) / 100;
    const standardizedKg = Math.round(standardizedLbs / 2.2 * 100) / 100;

    const rf = RECEIVING_FACILITIES[tmpl.receivingFacilityIdx];
    const manifestNum = tmpl.wasteCategory === "Hazardous Waste"
      ? `0${19928103 + i}FLE`
      : `${410058 + i}`;

    const mpsCost: CostBreakdown = {
      haulCharge: tmpl.mpsHaul,
      disposalFeeEach: tmpl.mpsDisposalEach,
      disposalFeeTotal: Math.round(tmpl.mpsDisposalEach * qty * 100) / 100,
      fuelFee: tmpl.mpsFuel,
      environmentalFee: tmpl.mpsEnv,
      rebate: 0,
      otherFees: tmpl.mpsOther,
    };

    const customerCost: CostBreakdown = {
      haulCharge: tmpl.custHaul,
      disposalFeeEach: tmpl.custDisposalEach,
      disposalFeeTotal: Math.round(tmpl.custDisposalEach * qty * 100) / 100,
      fuelFee: tmpl.custFuel,
      environmentalFee: tmpl.custEnv,
      rebate: tmpl.custRebate > 0 ? Math.round(tmpl.custRebate * qtyVariance * 100) / 100 : 0,
      otherFees: tmpl.custOther,
    };

    const totalMpsCost = mpsCost.haulCharge + mpsCost.disposalFeeTotal + mpsCost.fuelFee + mpsCost.environmentalFee + mpsCost.otherFees;

    shipments.push({
      id: `shp-${String(i + 1).padStart(4, "0")}`,
      clientId: client.id,
      siteId: site.id,
      vendorId: vendor.id,
      wasteTypeId: wasteType.id,
      shipmentDate: dateStr,
      weightValue: standardizedLbs,
      weightUnit: "lbs" as WeightUnit,
      notes: i % 8 === 0 ? "Scheduled pickup" : i % 12 === 0 ? "Emergency cleanup" : undefined,
      status: statuses[i % statuses.length],
      createdBy: creator.id,
      createdAt: shipDate.toISOString(),
      updatedAt: shipDate.toISOString(),
      siteName: site.name,
      clientName: client.name,
      vendorName: vendor.name,
      wasteTypeName: wasteType.name,
      createdByName: creator.displayName,

      // Extended fields
      wasteStreamName: wasteType.name,
      containerLocation: tmpl.containerLocation,
      manifestNumber: manifestNum,
      unit: tmpl.unit,
      qty,
      weightPerUnit: tmpl.weightPerUnit,
      standardizedVolumeLbs: standardizedLbs,
      standardizedVolumeKg: standardizedKg,
      targetLoadWeight: tmpl.targetLoadWeight,
      wasteCategory: tmpl.wasteCategory,
      treatmentMethod: tmpl.treatmentMethod,
      containerType: tmpl.containerType,
      serviceFrequency: tmpl.serviceFrequency,
      profileNumber: tmpl.profileNumber,
      wasteCodes: tmpl.wasteCodes,
      sourceCode: tmpl.sourceCode,
      formCode: tmpl.formCode,
      treatmentCode: tmpl.treatmentCode,
      ewcNumber: tmpl.ewcNumber,

      // Receiving facility
      receivingCompany: rf.company,
      receivingFacility: rf.facilityName,
      milesFromFacility: [12.3, 281.5, 26.9, 45.2, 85.7, 120.3, 200.1, 150.6][tmpl.receivingFacilityIdx],
      receivingAddress: rf.address,
      receivingCity: rf.city,
      receivingState: rf.state,
      receivingZip: rf.zip,
      receivingEpaId: rf.epaId,

      transporterName: tmpl.transporterName,
      mpsCost,
      customerCost,

      // Return manifest date — submitted shipments get a return 5-20 days later
      returnManifestDate: statuses[i % statuses.length] === "submitted"
        ? new Date(shipDate.getTime() + ((i % 16) + 5) * 86400000).toISOString().split("T")[0]
        : undefined,

      // GM-specific
      plantId: tmpl.managementMethod ? "550781" : undefined,
      managementMethod: tmpl.managementMethod,
      triWasteCode: tmpl.triWasteCode,
      numberOfContainers: Math.max(1, Math.ceil(qty)),
    });
  }

  return shipments;
}

const ALL_SHIPMENTS = generateShipments();

/* ════════════════════════════════════════════════════════════
   Enterprise Schema — Normalized Transaction Data
   Generated from the denormalized ALL_SHIPMENTS for structural alignment.
   In production these would be the source of truth; here the
   denormalized ShipmentView[] is generated first for convenience.
   ════════════════════════════════════════════════════════════ */

const SHIPMENT_RECORDS: ShipmentRecord[] = [];
const SHIPMENT_LINE_ITEMS: ShipmentLineItem[] = [];
const SHIPMENT_COSTS_INTERNAL: ShipmentCostInternal[] = [];
const SHIPMENT_COSTS_CUSTOMER: ShipmentCostCustomer[] = [];
const SHIPMENT_EXTERNAL_IDS: ShipmentExternalIdentifier[] = [];

(function buildNormalizedTransactionData() {
  ALL_SHIPMENTS.forEach((s, idx) => {
    const serviceItem = SERVICE_ITEMS.find((si) => si.defaultWasteTypeId === s.wasteTypeId);
    const containerLoc = containerLocationByName.get(`${s.siteId}:${s.containerLocation}`);
    const transporter = transporterByName.get(s.transporterName ?? "");
    const profile = profileByNumber.get(s.profileNumber ?? "");
    const unitEntity = unitByCode.get(s.unit ?? "Lb");
    const wasteType = wasteTypeMap.get(s.wasteTypeId);
    const tmEntity = s.treatmentMethod ? treatmentMethodByName.get(s.treatmentMethod) : undefined;
    const container = containerByName.get(s.containerType ?? "");
    const serviceFreq = s.serviceFrequency ? serviceFreqByName.get(s.serviceFrequency) : undefined;

    // ShipmentRecord (header)
    SHIPMENT_RECORDS.push({
      id: s.id,
      customerId: s.clientId,
      siteId: s.siteId,
      serviceItemId: serviceItem?.id ?? `si-${s.wasteTypeId.split("-")[1]}`,
      containerLocationId: containerLoc?.id,
      shipmentDate: s.shipmentDate,
      manifestNumber: s.manifestNumber,
      profileId: profile?.id,
      transporterId: transporter?.id,
      receivingFacilityId: s.receivingFacilityId ?? RECEIVING_FACILITIES.find((rf) => rf.facilityName === s.receivingFacility)?.id,
      milesToFacility: s.milesFromFacility,
      notes: s.notes,
      status: s.status,
      createdByUserId: s.createdBy,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });

    // ShipmentLineItem (1:1 for now)
    SHIPMENT_LINE_ITEMS.push({
      id: `sli-${String(idx + 1).padStart(4, "0")}`,
      shipmentId: s.id,
      lineNumber: 1,
      unitId: unitEntity?.id ?? "unit-3",
      quantityValue: s.qty ?? 1,
      weightLbPerUnit: s.weightPerUnit,
      standardizedWeightLb: s.standardizedVolumeLbs,
      standardizedWeightKg: s.standardizedVolumeKg,
      targetLoadWeightLb: s.targetLoadWeight,
      wasteTypeId: s.wasteTypeId,
      treatmentMethodId: tmEntity?.id,
      containerId: container?.id,
      serviceFrequencyId: serviceFreq?.id,
    });

    // ShipmentCostInternal
    if (s.mpsCost) {
      SHIPMENT_COSTS_INTERNAL.push({
        id: `sci-${String(idx + 1).padStart(4, "0")}`,
        shipmentId: s.id,
        haulCharge: s.mpsCost.haulCharge,
        disposalRecyclingFeeEach: s.mpsCost.disposalFeeEach,
        disposalFeeTotal: s.mpsCost.disposalFeeTotal,
        fuelFee: s.mpsCost.fuelFee,
        environmentalFee: s.mpsCost.environmentalFee,
        rebateAmount: s.mpsCost.rebate,
        otherFees: s.mpsCost.otherFees,
        currencyCode: "USD",
      });
    }

    // ShipmentCostCustomer
    if (s.customerCost) {
      SHIPMENT_COSTS_CUSTOMER.push({
        id: `scc-${String(idx + 1).padStart(4, "0")}`,
        shipmentId: s.id,
        haulCharge: s.customerCost.haulCharge,
        disposalRecyclingFeeEach: s.customerCost.disposalFeeEach,
        disposalFeeTotal: s.customerCost.disposalFeeTotal,
        fuelFee: s.customerCost.fuelFee,
        environmentalFee: s.customerCost.environmentalFee,
        rebateAmount: s.customerCost.rebate,
        otherFees: s.customerCost.otherFees,
        currencyCode: "USD",
      });
    }

    // ShipmentExternalIdentifiers (GM/Ford-specific fields)
    if (s.plantId) {
      SHIPMENT_EXTERNAL_IDS.push({
        id: `sei-${String(SHIPMENT_EXTERNAL_IDS.length + 1).padStart(4, "0")}`,
        shipmentId: s.id,
        identifierType: "plant_id",
        identifierValue: s.plantId,
        sourceSystem: "GM",
      });
    }
    if (s.managementMethod) {
      SHIPMENT_EXTERNAL_IDS.push({
        id: `sei-${String(SHIPMENT_EXTERNAL_IDS.length + 1).padStart(4, "0")}`,
        shipmentId: s.id,
        identifierType: "management_method",
        identifierValue: s.managementMethod,
        sourceSystem: "GM",
      });
    }
    if (s.triWasteCode) {
      SHIPMENT_EXTERNAL_IDS.push({
        id: `sei-${String(SHIPMENT_EXTERNAL_IDS.length + 1).padStart(4, "0")}`,
        shipmentId: s.id,
        identifierType: "tri_waste_code",
        identifierValue: s.triWasteCode,
        sourceSystem: "GM",
      });
    }
  });
})();

/* ─── Audit Log data generation ─── */

function generateAuditLog(): AuditLogEntry[] {
  const entries: AuditLogEntry[] = [];
  const actions = ["create", "update", "delete", "export", "login"];
  const entities = ["shipment", "vendor", "site", "waste_type", "client", "user"];

  const summaries: Record<string, string[]> = {
    create: ["Created new {entity}", "Added {entity} record"],
    update: ["Updated {entity} details", "Modified {entity} fields"],
    delete: ["Deleted {entity}", "Removed {entity} record"],
    export: ["Exported shipment data as CSV", "Generated waste trends report"],
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
          (s.notes?.toLowerCase().includes(q) ?? false) ||
          (s.manifestNumber?.toLowerCase().includes(q) ?? false) ||
          (s.wasteStreamName?.toLowerCase().includes(q) ?? false)
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
    if (filters.wasteCategory) {
      result = result.filter((s) => s.wasteCategory === filters.wasteCategory);
    }
    if (filters.treatmentMethod) {
      result = result.filter((s) => s.treatmentMethod === filters.treatmentMethod);
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

export function getAllShipments(filters?: ShipmentFilters): Shipment[] {
  return getShipments(filters, 1, 99999).data;
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

export function getReceivingFacilities(): ReceivingFacility[] {
  return RECEIVING_FACILITIES;
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
    if (!row.siteId || !row.vendorId || !row.wasteTypeId || !row.shipmentDate || !row.weightValue) {
      errors.push({ rowIndex: i, message: "Missing required fields" });
      return;
    }

    const site = siteMap.get(row.siteId);
    const client = clientMap.get(row.clientId);
    const vendor = vendorMap.get(row.vendorId);
    const wasteType = wasteTypeMap.get(row.wasteTypeId);
    const creator = USERS[0];

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

/* ════════════════════════════════════════════════════════════
   Enterprise Schema — Normalized Data Accessor Functions
   ════════════════════════════════════════════════════════════ */

/* ─── Reference / Master Data accessors ─── */

export function getServiceItems(): ServiceItem[] {
  return SERVICE_ITEMS;
}

export function getContainerLocations(siteId?: string): ContainerLocation[] {
  if (siteId) return CONTAINER_LOCATIONS.filter((cl) => cl.siteId === siteId);
  return CONTAINER_LOCATIONS;
}

export function getTreatmentMethodEntities(): TreatmentMethodEntity[] {
  return TREATMENT_METHODS_REF;
}

export function getUnits(): UnitEntity[] {
  return UNITS_REF;
}

export function getContainerEntities(): ContainerEntity[] {
  return CONTAINERS_REF;
}

export function getServiceFrequencyEntities(): ServiceFrequencyEntity[] {
  return SERVICE_FREQUENCIES_REF;
}

export function getProfiles(): Profile[] {
  return PROFILES;
}

export function getReceivingCompanies(): ReceivingCompany[] {
  return RECEIVING_COMPANIES;
}

export function getReceivingFacilityEntities(): ReceivingFacilityEntity[] {
  return RECEIVING_FACILITIES_NORMALIZED;
}

export function createReceivingFacility(data: Omit<ReceivingFacilityEntity, "id">): ReceivingFacilityEntity {
  const item: ReceivingFacilityEntity = { ...data, id: `rf-${Date.now()}` };
  RECEIVING_FACILITIES_NORMALIZED.push(item);
  return item;
}

export function updateReceivingFacility(id: string, patch: Partial<ReceivingFacilityEntity>): ReceivingFacilityEntity | undefined {
  const idx = RECEIVING_FACILITIES_NORMALIZED.findIndex((f) => f.id === id);
  if (idx === -1) return undefined;
  RECEIVING_FACILITIES_NORMALIZED[idx] = { ...RECEIVING_FACILITIES_NORMALIZED[idx], ...patch };
  return RECEIVING_FACILITIES_NORMALIZED[idx];
}

export function deleteReceivingFacility(id: string): boolean {
  const idx = RECEIVING_FACILITIES_NORMALIZED.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  RECEIVING_FACILITIES_NORMALIZED.splice(idx, 1);
  return true;
}

export function getTransporters(): Transporter[] {
  return TRANSPORTERS;
}

export function createTransporter(data: Omit<Transporter, "id">): Transporter {
  const item: Transporter = { ...data, id: `trans-${Date.now()}` };
  TRANSPORTERS.push(item);
  return item;
}

export function updateTransporter(id: string, patch: Partial<Transporter>): Transporter | undefined {
  const idx = TRANSPORTERS.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  TRANSPORTERS[idx] = { ...TRANSPORTERS[idx], ...patch };
  return TRANSPORTERS[idx];
}

export function deleteTransporter(id: string): boolean {
  const idx = TRANSPORTERS.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  TRANSPORTERS.splice(idx, 1);
  return true;
}

export function getReportDefinitions(): ReportDefinition[] {
  return REPORT_DEFINITIONS;
}

/* ─── Normalized Transaction Data accessors ─── */

export function getShipmentRecords(): ShipmentRecord[] {
  return SHIPMENT_RECORDS;
}

export function getShipmentLineItems(shipmentId?: string): ShipmentLineItem[] {
  if (shipmentId) return SHIPMENT_LINE_ITEMS.filter((li) => li.shipmentId === shipmentId);
  return SHIPMENT_LINE_ITEMS;
}

export function getShipmentCostsInternal(shipmentId: string): ShipmentCostInternal | undefined {
  return SHIPMENT_COSTS_INTERNAL.find((c) => c.shipmentId === shipmentId);
}

export function getShipmentCostsCustomer(shipmentId: string): ShipmentCostCustomer | undefined {
  return SHIPMENT_COSTS_CUSTOMER.find((c) => c.shipmentId === shipmentId);
}

export function getShipmentExternalIdentifiers(shipmentId: string): ShipmentExternalIdentifier[] {
  return SHIPMENT_EXTERNAL_IDS.filter((ei) => ei.shipmentId === shipmentId);
}

/* ════════════════════════════════════════════════════════════
   CRUD — Service Items
   ════════════════════════════════════════════════════════════ */

export function createServiceItem(data: Omit<ServiceItem, "id">): ServiceItem {
  const item: ServiceItem = { ...data, id: `si-${Date.now()}` };
  SERVICE_ITEMS.push(item);
  return item;
}

export function updateServiceItem(id: string, patch: Partial<ServiceItem>): ServiceItem | undefined {
  const idx = SERVICE_ITEMS.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  SERVICE_ITEMS[idx] = { ...SERVICE_ITEMS[idx], ...patch };
  return SERVICE_ITEMS[idx];
}

export function deleteServiceItem(id: string): boolean {
  const idx = SERVICE_ITEMS.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  SERVICE_ITEMS.splice(idx, 1);
  return true;
}

/* ════════════════════════════════════════════════════════════
   CRUD — Containers
   ════════════════════════════════════════════════════════════ */

export function createContainer(data: Omit<ContainerEntity, "id">): ContainerEntity {
  const item: ContainerEntity = { ...data, id: `cont-${Date.now()}` };
  CONTAINERS_REF.push(item);
  return item;
}

export function updateContainer(id: string, patch: Partial<ContainerEntity>): ContainerEntity | undefined {
  const idx = CONTAINERS_REF.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  CONTAINERS_REF[idx] = { ...CONTAINERS_REF[idx], ...patch };
  return CONTAINERS_REF[idx];
}

export function deleteContainer(id: string): boolean {
  const idx = CONTAINERS_REF.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  CONTAINERS_REF.splice(idx, 1);
  return true;
}

/* ════════════════════════════════════════════════════════════
   CRUD — Profiles
   ════════════════════════════════════════════════════════════ */

export function createProfile(data: Omit<Profile, "id">): Profile {
  const item: Profile = { ...data, id: `prof-${Date.now()}` };
  PROFILES.push(item);
  return item;
}

export function updateProfile(id: string, patch: Partial<Profile>): Profile | undefined {
  const idx = PROFILES.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  PROFILES[idx] = { ...PROFILES[idx], ...patch };
  return PROFILES[idx];
}

export function deleteProfile(id: string): boolean {
  const idx = PROFILES.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  PROFILES.splice(idx, 1);
  return true;
}
