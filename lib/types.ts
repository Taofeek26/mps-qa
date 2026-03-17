/* ============================================
   MPS Platform — Shared Type Definitions
   ============================================ */

/* ─── Enums ─── */

export type WeightUnit = "lbs" | "tons" | "kg";
export type VolumeUnit = "gal" | "L" | "m3";
export type UserRole = "admin" | "manager" | "operator" | "viewer";
export type ShipmentStatus = "submitted" | "pending" | "void";

export type WasteCategory =
  | "Non Haz"
  | "Hazardous Waste"
  | "Recycling"
  | "C&D"
  | "E-Waste"
  | "Universal Waste"
  | "Special Waste"
  | "Medical"
  | "Liquid"
  | "Fuel"
  | "Alternative Reuse"
  | "Gas";

export type TreatmentMethod =
  | "Landfill"
  | "Recycling"
  | "Incineration"
  | "Fuel Blending"
  | "Reuse"
  | "WWTP"
  | "MSW Landfill"
  | "HAZ Landfill"
  | "WTE";

export type VendorRiskLevel = "Level 1 - High" | "Level 2 - Medium" | "Level 3 - Low";
export type VendorQualStatus = "Active" | "Temporary" | "Inactive";
export type VendorCompletionStatus = "Complete" | "Incomplete";

export type ServiceFrequency =
  | "On Call"
  | "1x Week"
  | "2x Week"
  | "3x Week"
  | "4x Week"
  | "5x Week"
  | "Once a Month"
  | "Every 4 Weeks"
  | "Other";

/* ─── GM Management Method codes (File 1) ─── */
export type ManagementMethod =
  | "RE" // Recycle
  | "ER" // Energy Recovery
  | "OT" // Other
  | "IN" // Incineration
  | "LF" // Landfill
  | "RU" // Reuse
  | "FU" // Fuel Blending
  | "TR"; // Treatment

/* ─── Core Entities ─── */

export interface Client {
  id: string;
  name: string;
  industry?: string;
  active: boolean;
  contactPerson?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface Site {
  id: string;
  clientId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
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
  /* Extended vendor qualification fields */
  vendorCode?: string;
  completionStatus?: VendorCompletionStatus;
  dbeFlag?: boolean;
  commodities?: string[];
  riskLevel?: VendorRiskLevel;
  supplierForm?: string;
  dateEntered?: string;
  dateReviewed?: string;
  expirationDate?: string;
  reviewedBy?: string;
  vendorStatus?: VendorQualStatus;
}

export interface WasteType {
  id: string;
  name: string;
  hazardousFlag: boolean;
  description?: string;
  active: boolean;
  /* Extended classification */
  wasteCategory?: WasteCategory;
  defaultTreatmentMethod?: TreatmentMethod;
  defaultWasteCodes?: string;
  defaultSourceCode?: string;
  defaultFormCode?: string;
  defaultTreatmentCode?: string;
  defaultEwcNumber?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  assignedSiteIds?: string[];
}

/* ─── Cost Breakdown ─── */

export interface CostBreakdown {
  haulCharge: number;
  disposalFeeEach: number;
  disposalFeeTotal: number;
  fuelFee: number;
  environmentalFee: number;
  rebate: number;
  otherFees: number;
}

/* ─── Receiving Facility ─── */

export interface ReceivingFacility {
  id: string;
  company: string;
  facilityName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  epaId?: string;
}

/* ─── Shipment (denormalized view for UI consumption) ─── */

export interface ShipmentView {
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
  /* Denormalized display names */
  siteName: string;
  clientName: string;
  vendorName: string;
  wasteTypeName: string;
  createdByName: string;

  /* ── Extended Waste Stream Fields ── */
  wasteStreamName?: string;
  containerLocation?: string;
  manifestNumber?: string;
  returnManifestDate?: string;
  unit?: string;
  qty?: number;
  weightPerUnit?: number;
  standardizedVolumeLbs?: number;
  standardizedVolumeKg?: number;
  targetLoadWeight?: number;

  /* ── Classification ── */
  wasteCategory?: WasteCategory;
  wasteCodes?: string;
  treatmentMethod?: TreatmentMethod;
  sourceCode?: string;
  formCode?: string;
  treatmentCode?: string;
  ewcNumber?: string;
  containerType?: string;
  serviceFrequency?: ServiceFrequency;
  profileNumber?: string;

  /* ── Receiving Facility ── */
  receivingFacilityId?: string;
  receivingCompany?: string;
  receivingFacility?: string;
  milesFromFacility?: number;
  receivingAddress?: string;
  receivingCity?: string;
  receivingState?: string;
  receivingZip?: string;
  receivingEpaId?: string;

  /* ── Transporter ── */
  transporterName?: string;

  /* ── MPS Cost ── */
  mpsCost?: CostBreakdown;

  /* ── Customer Cost ── */
  customerCost?: CostBreakdown;

  /* ── Lifecycle ── */
  completedDate?: string;

  /* ── GM-specific (File 1 format) ── */
  plantId?: string;
  approvalId?: string;
  managementMethod?: ManagementMethod;
  finalDisposition?: string;
  numberOfContainers?: number;
  documentNo?: string;
  disposalLocationCode?: string;
  triWasteCode?: string;
  pcbRemovalDate?: string;
  pcbDestructionDate?: string;
}

/** @deprecated Use ShipmentView — kept as alias for backward compatibility */
export type Shipment = ShipmentView;

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

/* ─── Reference Data Types ─── */

export interface ReferenceCode {
  id?: string;
  code: string;
  description: string;
  category?: string;
}

/* ════════════════════════════════════════════
   Enterprise Schema — Normalized Entity Types
   Maps to docs/sample data/mps_data_extraction_and_enterprise_schema.md
   ════════════════════════════════════════════ */

/* ─── Reference / Master Data ─── */

export interface ServiceItem {
  id: string;
  serviceName: string;
  description?: string;
  defaultWasteTypeId?: string;
  activeFlag: boolean;
}

export interface ContainerLocation {
  id: string;
  siteId: string;
  locationName: string;
  locationCode?: string;
  activeFlag: boolean;
}

export interface WasteCodeEntity {
  id: string;
  codeValue: string;
  codeSystem?: string;
  description?: string;
  activeFlag: boolean;
}

export interface TreatmentMethodEntity {
  id: string;
  treatmentMethodName: TreatmentMethod;
  description?: string;
  activeFlag: boolean;
}

export type UnitFamily = "weight" | "volume" | "count" | "container" | "service";

export interface UnitEntity {
  id: string;
  unitCode: string;
  unitName: string;
  unitFamily: UnitFamily;
  conversionToLbFactor?: number;
  conversionToKgFactor?: number;
  activeFlag: boolean;
}

export interface ContainerEntity {
  id: string;
  containerName: string;
  containerFamily?: string;
  nominalCapacityValue?: number;
  nominalCapacityUnitId?: string;
  activeFlag: boolean;
}

export interface ServiceFrequencyEntity {
  id: string;
  frequencyName: ServiceFrequency;
  sortOrder: number;
  activeFlag: boolean;
}

export interface Profile {
  id: string;
  profileNumber: string;
  customerId?: string;
  wasteTypeId?: string;
  activeFlag: boolean;
}

export interface ReceivingCompany {
  id: string;
  companyName: string;
  activeFlag: boolean;
}

export interface ReceivingFacilityEntity {
  id: string;
  receivingCompanyId: string;
  facilityName: string;
  addressLine1?: string;
  city?: string;
  stateCode?: string;
  postalCode?: string;
  epaIdNumber?: string;
  activeFlag: boolean;
}

export interface Transporter {
  id: string;
  transporterName: string;
  vendorId?: string;
  activeFlag: boolean;
}

export interface ReportDefinition {
  id: string;
  reportName: string;
  reportType: string;
  exportTemplateCode?: string;
  activeFlag: boolean;
}

/* ─── Transaction / Operational ─── */

export interface ShipmentRecord {
  id: string;
  shipmentNumber?: string;
  customerId: string;
  siteId: string;
  serviceItemId: string;
  containerLocationId?: string;
  shipmentDate: string;
  manifestNumber?: string;
  returnManifestDate?: string;
  profileId?: string;
  transporterId?: string;
  receivingFacilityId?: string;
  milesToFacility?: number;
  notes?: string;
  status: ShipmentStatus;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentLineItem {
  id: string;
  shipmentId: string;
  lineNumber: number;
  unitId: string;
  quantityValue: number;
  weightLbPerUnit?: number;
  standardizedWeightLb?: number;
  standardizedWeightKg?: number;
  targetLoadWeightLb?: number;
  wasteTypeId?: string;
  wasteCodeId?: string;
  treatmentMethodId?: string;
  sourceCodeId?: string;
  formCodeId?: string;
  treatmentCodeId?: string;
  ewcCodeId?: string;
  containerId?: string;
  serviceFrequencyId?: string;
}

export interface ShipmentCostInternal {
  id: string;
  shipmentId: string;
  haulCharge?: number;
  disposalRecyclingFeeEach?: number;
  disposalFeeTotal?: number;
  fuelFee?: number;
  environmentalFee?: number;
  rebateAmount?: number;
  otherFees?: number;
  currencyCode: string;
}

export interface ShipmentCostCustomer {
  id: string;
  shipmentId: string;
  haulCharge?: number;
  disposalRecyclingFeeEach?: number;
  disposalFeeTotal?: number;
  fuelFee?: number;
  environmentalFee?: number;
  rebateAmount?: number;
  otherFees?: number;
  currencyCode: string;
}

export interface ShipmentExternalIdentifier {
  id: string;
  shipmentId: string;
  identifierType: string;
  identifierValue: string;
  sourceSystem?: string;
}

export interface ShipmentCustomField {
  id: string;
  shipmentId: string;
  fieldKey: string;
  fieldValueText?: string;
  fieldValueNumeric?: number;
  fieldValueDate?: string;
}

/* ─── KPI Support — Operational & Analytical Mock Entities ─── */

export interface InvoiceRecord {
  id: string;
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidDate?: string;
}

export interface CollectionEvent {
  id: string;
  siteId: string;
  scheduledDate: string;
  actualDate?: string;
  status: "completed" | "missed" | "late";
}

export interface ContainerPlacement {
  id: string;
  containerId: string;
  containerType: string;
  siteId: string;
  placedDate: string;
  removedDate?: string;
  fillPercentage: number;
}

export interface FacilityCapacity {
  facilityId: string;
  facilityName: string;
  monthlyCapacityTons: number;
  monthlyProcessedTons: number;
}

export interface FuelRecord {
  transporterId: string;
  transporterName: string;
  mpg: number;
  fuelCostPerMile: number;
}

export interface RouteSchedule {
  id: string;
  routeId: string;
  siteId: string;
  siteName: string;
  scheduledDay: string;
  completedDay?: string;
  onTime: boolean;
}

export interface TruckLoad {
  id: string;
  truckId: string;
  transporterName: string;
  maxWeightLbs: number;
  loadedWeightLbs: number;
}

export interface SafetyIncident {
  id: string;
  date: string;
  type: "vehicle" | "chemical" | "slip-fall" | "equipment" | "ergonomic";
  severity: "minor" | "moderate" | "serious";
  resolved: boolean;
  siteId: string;
  description: string;
}

export interface InspectionRecord {
  id: string;
  siteId: string;
  siteName: string;
  date: string;
  passed: boolean;
  findings: number;
  inspectorName: string;
}

export interface ServiceVerification {
  shipmentId: string;
  verified: boolean;
  verifiedDate?: string;
  goBack: boolean;
  goBackReason?: string;
}

export interface ContainerWeightRecord {
  shipmentId: string;
  containerType: string;
  tareWeightLbs: number;
  grossWeightLbs: number;
}

export interface PlatformUserActivity {
  userId: string;
  userName: string;
  role: UserRole;
  lastActiveDate: string;
  shipmentsCreated: number;
  features: string[];
  loginCount: number;
  avgSessionMinutes: number;
}

export interface CustomerSurvey {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  csat: number;
  nps: number;
  fcrResolved: boolean;
  responseTimeHrs: number;
  hasComplaint: boolean;
  complaintCategory?: string;
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
  wasteCategory?: WasteCategory;
  treatmentMethod?: TreatmentMethod;
  transporterName?: string;
  containerType?: string;
  receivingState?: string;
  receivingCompany?: string;
  serviceFrequency?: ServiceFrequency;
  wasteStreamName?: string;
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
