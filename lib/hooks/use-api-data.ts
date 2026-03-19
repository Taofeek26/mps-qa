/**
 * React hooks for fetching data from the MPS API
 * These hooks replace the mock data functions with real API calls
 */

import * as React from 'react';
import {
  shipmentsApi,
  vendorsApi,
  customersApi,
  sitesApi,
  wasteTypesApi,
  transportersApi,
  receivingFacilitiesApi,
  containersApi,
  profilesApi,
  serviceItemsApi,
  usersApi,
  auditApi,
  referenceDataApi,
  invoiceRecordsApi,
  collectionEventsApi,
  containerPlacementsApi,
  facilityCapacitiesApi,
  fuelRecordsApi,
  routeSchedulesApi,
  truckLoadsApi,
  safetyIncidentsApi,
  inspectionRecordsApi,
  serviceVerificationsApi,
  containerWeightRecordsApi,
  platformUserActivityApi,
  customerSurveysApi,
  safetyTrainingApi,
  shipmentLineItemsApi,
  shipmentExternalIdentifiersApi,
  containerLocationsBySiteApi,
  kpiAnalyticsApi,
} from '@/lib/api-client';
import type {
  Shipment,
  Vendor,
  Client,
  Site,
  WasteType,
  Transporter,
  ReceivingFacility,
  ContainerEntity,
  Profile,
  ServiceItem,
  User,
  AuditLogEntry,
  ShipmentStatus,
  UnitEntity,
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
  ShipmentLineItem,
  ShipmentExternalIdentifier,
  ContainerLocation,
} from '@/lib/types';

// ============================================
// API Response Transformers (snake_case → camelCase)
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformShipment(raw: any): Shipment {
  return {
    id: raw.id,
    clientId: raw.customer_id ?? '',
    clientName: raw.customer_name ?? '',
    siteId: raw.site_id ?? '',
    siteName: raw.site_name ?? '',
    vendorId: raw.vendor_id ?? '',
    vendorName: raw.vendor_name ?? '',
    wasteTypeId: raw.waste_type_id ?? '',
    wasteTypeName: raw.waste_type ?? raw.waste_description ?? '',
    shipmentDate: raw.shipment_date ?? raw.collection_date ?? '',
    weightValue: raw.quantity ?? raw.weight_kg ?? raw.standardized_weight_lb ?? 0,
    weightUnit: raw.quantity_unit ?? 'lbs',
    volumeValue: raw.quantity ?? undefined,
    volumeUnit: raw.quantity_unit ?? undefined,
    notes: raw.notes ?? '',
    status: (raw.status === 'draft' ? 'pending' : raw.status ?? 'pending') as ShipmentStatus,
    createdBy: raw.created_by ?? '',
    createdByName: raw.created_by_name ?? 'System',
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
    // Extended fields
    wasteStreamName: raw.waste_stream_name ?? undefined,
    containerLocation: raw.container_location_id ?? undefined,
    manifestNumber: raw.manifest_number ?? undefined,
    returnManifestDate: raw.return_manifest_date ?? undefined,
    unit: raw.quantity_unit ?? undefined,
    qty: raw.quantity ?? undefined,
    weightPerUnit: raw.weight_per_unit ?? undefined,
    standardizedVolumeLbs: raw.standardized_weight_lb ?? undefined,
    standardizedVolumeKg: raw.standardized_weight_kg ?? undefined,
    targetLoadWeight: raw.target_load_weight ?? undefined,
    wasteCategory: raw.waste_category ?? undefined,
    wasteCodes: raw.waste_codes ?? undefined,
    treatmentMethod: raw.treatment_method ?? undefined,
    sourceCode: raw.source_code ?? undefined,
    formCode: raw.form_code ?? undefined,
    treatmentCode: raw.treatment_code ?? undefined,
    ewcNumber: raw.ewc_code ?? undefined,
    containerType: raw.container_type ?? undefined,
    serviceFrequency: raw.service_frequency_id ?? undefined,
    profileNumber: raw.profile_id ?? undefined,
    // Receiving facility
    receivingFacilityId: raw.receiving_facility_id ?? undefined,
    receivingCompany: raw.receiving_company ?? undefined,
    receivingFacility: raw.facility_name ?? undefined,
    milesFromFacility: raw.distance_miles ?? undefined,
    receivingAddress: raw.receiving_address ?? undefined,
    receivingCity: raw.receiving_city ?? undefined,
    receivingState: raw.receiving_state ?? undefined,
    receivingZip: raw.receiving_zip ?? undefined,
    receivingEpaId: raw.receiving_epa_id ?? undefined,
    // Transporter
    transporterName: raw.carrier_name ?? undefined,
    // Costs (MPS)
    mpsCost: raw.mps_total_cost ? {
      haulCharge: raw.mps_haul_charge ?? 0,
      disposalFeeEach: raw.mps_disposal_fee_each ?? 0,
      disposalFeeTotal: raw.mps_disposal_fee_total ?? 0,
      fuelFee: raw.mps_fuel_fee ?? 0,
      environmentalFee: raw.mps_environmental_fee ?? 0,
      rebate: raw.mps_rebate ?? 0,
      otherFees: raw.mps_other_fees ?? 0,
    } : undefined,
    // Costs (Customer)
    customerCost: raw.customer_total_cost ? {
      haulCharge: raw.customer_haul_charge ?? 0,
      disposalFeeEach: raw.customer_disposal_fee_each ?? 0,
      disposalFeeTotal: raw.customer_disposal_fee_total ?? 0,
      fuelFee: raw.customer_fuel_fee ?? 0,
      environmentalFee: raw.customer_environmental_fee ?? 0,
      rebate: raw.customer_rebate ?? 0,
      otherFees: raw.customer_other_fees ?? 0,
    } : undefined,
    completedDate: raw.completed_date ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformVendor(raw: any): Vendor {
  return {
    id: raw.id,
    name: raw.name ?? raw.vendor_name ?? '',
    vendorType: raw.vendor_type ?? 'Disposal',
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    phone: raw.phone ?? undefined,
    active: raw.is_active ?? raw.active ?? true,
    vendorCode: raw.vendor_code ?? undefined,
    completionStatus: raw.completion_status ?? undefined,
    dbeFlag: raw.dbe_flag ?? undefined,
    commodities: raw.commodities ?? undefined,
    riskLevel: raw.risk_level ?? undefined,
    supplierForm: raw.supplier_form ?? undefined,
    dateEntered: raw.date_entered ?? undefined,
    dateReviewed: raw.date_reviewed ?? undefined,
    expirationDate: raw.expiration_date ?? undefined,
    reviewedBy: raw.reviewed_by ?? undefined,
    vendorStatus: raw.vendor_status ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformClient(raw: any): Client {
  return {
    id: raw.id,
    name: raw.name ?? raw.customer_name ?? '',
    industry: raw.industry ?? undefined,
    active: raw.is_active ?? raw.active ?? true,
    contactPerson: raw.contact_person ?? raw.contact_name ?? undefined,
    phone: raw.phone ?? undefined,
    address: raw.address ?? raw.address_line1 ?? undefined,
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    zipCode: raw.zip_code ?? raw.postal_code ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSite(raw: any): Site {
  return {
    id: raw.id,
    clientId: raw.customer_id ?? raw.client_id ?? '',
    name: raw.name ?? raw.site_name ?? '',
    address: raw.address ?? raw.address_line1 ?? undefined,
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    zipCode: raw.zip_code ?? raw.postal_code ?? undefined,
    region: raw.region ?? undefined,
    active: raw.is_active ?? raw.active ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformWasteType(raw: any): WasteType {
  return {
    id: raw.id,
    name: raw.name ?? raw.waste_type_name ?? '',
    hazardousFlag: raw.hazardous_flag ?? raw.is_hazardous ?? false,
    description: raw.description ?? undefined,
    active: raw.is_active ?? raw.active ?? true,
    wasteCategory: raw.waste_category ?? undefined,
    defaultTreatmentMethod: raw.default_treatment_method ?? undefined,
    defaultWasteCodes: raw.default_waste_codes ?? undefined,
    defaultSourceCode: raw.default_source_code ?? undefined,
    defaultFormCode: raw.default_form_code ?? undefined,
    defaultTreatmentCode: raw.default_treatment_code ?? undefined,
    defaultEwcNumber: raw.default_ewc_number ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformContainer(raw: any): ContainerEntity {
  return {
    id: raw.id,
    containerName: raw.container_name ?? raw.containerName ?? '',
    containerFamily: raw.container_family ?? raw.containerFamily ?? undefined,
    nominalCapacityValue: raw.nominal_capacity_value ?? raw.nominalCapacityValue ?? undefined,
    nominalCapacityUnitId: raw.nominal_capacity_unit_id ?? raw.nominalCapacityUnitId ?? undefined,
    activeFlag: raw.is_active ?? raw.active_flag ?? raw.activeFlag ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformProfile(raw: any): Profile {
  return {
    id: raw.id,
    profileNumber: raw.profile_number ?? raw.profileNumber ?? '',
    customerId: raw.customer_id ?? raw.customerId ?? undefined,
    wasteTypeId: raw.waste_type_id ?? raw.wasteTypeId ?? undefined,
    activeFlag: raw.is_active ?? raw.active_flag ?? raw.activeFlag ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformServiceItem(raw: any): ServiceItem {
  return {
    id: raw.id,
    serviceName: raw.service_name ?? raw.serviceName ?? '',
    description: raw.description ?? undefined,
    defaultWasteTypeId: raw.default_waste_type_id ?? raw.defaultWasteTypeId ?? undefined,
    activeFlag: raw.is_active ?? raw.active_flag ?? raw.activeFlag ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformUnit(raw: any): UnitEntity {
  return {
    id: raw.id,
    unitCode: raw.unit_code ?? raw.unitCode ?? '',
    unitName: raw.unit_name ?? raw.unitName ?? '',
    unitFamily: raw.unit_family ?? raw.unitFamily ?? 'weight',
    conversionToLbFactor: raw.conversion_to_lb_factor ?? raw.conversionToLbFactor ?? undefined,
    conversionToKgFactor: raw.conversion_to_kg_factor ?? raw.conversionToKgFactor ?? undefined,
    activeFlag: raw.is_active ?? raw.active_flag ?? raw.activeFlag ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformReceivingFacility(raw: any): {
  id: string;
  receivingCompanyId: string;
  facilityName: string;
  addressLine1?: string;
  city?: string;
  stateCode?: string;
  postalCode?: string;
  epaIdNumber?: string;
  activeFlag: boolean;
} {
  return {
    id: raw.id,
    receivingCompanyId: raw.receiving_company_id ?? raw.company ?? '',
    facilityName: raw.facility_name ?? raw.facilityName ?? '',
    addressLine1: raw.address_line1 ?? raw.address ?? undefined,
    city: raw.city ?? undefined,
    stateCode: raw.state_code ?? raw.state ?? undefined,
    postalCode: raw.postal_code ?? raw.zip ?? undefined,
    epaIdNumber: raw.epa_id_number ?? raw.epaId ?? undefined,
    activeFlag: raw.is_active ?? raw.activeFlag ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformUser(raw: any): User {
  // Handle status field - API returns "active"/"inactive" string, not boolean
  let isActive = true;
  if (raw.is_active !== undefined) {
    isActive = raw.is_active;
  } else if (raw.active !== undefined) {
    isActive = raw.active;
  } else if (raw.status !== undefined) {
    isActive = raw.status === 'active';
  }
  return {
    id: raw.id,
    email: raw.email ?? '',
    displayName: raw.display_name ?? raw.name ?? raw.email ?? '',
    role: raw.role ?? 'site_user',
    active: typeof isActive === 'boolean' ? isActive : isActive === 'active',
    assignedSiteIds: raw.assigned_site_ids ?? [],
  };
}

// Generic hook state
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Generic fetching hook
function useApiData<T>(
  fetchFn: () => Promise<{ data: T | null; error: string | null }>,
  deps: unknown[] = []
): UseApiState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, deps);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ============================================
// Shipments
// ============================================

interface RawShipmentsResponse {
  shipments: unknown[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export function useShipments(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<RawShipmentsResponse>(
    () => shipmentsApi.getAll(params) as Promise<{ data: RawShipmentsResponse | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const shipments = React.useMemo(
    () => (data?.shipments || []).map(transformShipment),
    [data?.shipments]
  );

  return {
    shipments,
    total: data?.total || 0,
    loading,
    error,
    refetch,
  };
}

export function useShipment(id: string | null) {
  const { data, loading, error, refetch } = useApiData<{ shipment: unknown }>(
    async () => {
      if (!id) return { data: null, error: null };
      return shipmentsApi.getById(id) as Promise<{ data: { shipment: unknown } | null; error: string | null }>;
    },
    [id]
  );

  const shipment = React.useMemo(
    () => data?.shipment ? transformShipment(data.shipment) : null,
    [data?.shipment]
  );

  return {
    shipment,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Vendors
// ============================================

export function useVendors() {
  const { data, loading, error, refetch } = useApiData<{ vendors: unknown[] }>(
    () => vendorsApi.getAll() as Promise<{ data: { vendors: unknown[] } | null; error: string | null }>,
    []
  );

  const vendors = React.useMemo(
    () => (data?.vendors || []).map(transformVendor),
    [data?.vendors]
  );

  return {
    vendors,
    loading,
    error,
    refetch,
  };
}

export function useVendor(id: string | null) {
  const { data, loading, error, refetch } = useApiData<{ vendor: unknown }>(
    async () => {
      if (!id) return { data: null, error: null };
      return vendorsApi.getById(id) as Promise<{ data: { vendor: unknown } | null; error: string | null }>;
    },
    [id]
  );

  const vendor = React.useMemo(
    () => data?.vendor ? transformVendor(data.vendor) : null,
    [data?.vendor]
  );

  return {
    vendor,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Customers (Clients)
// ============================================

export function useClients() {
  const { data, loading, error, refetch } = useApiData<{ customers: unknown[] }>(
    () => customersApi.getAll() as Promise<{ data: { customers: unknown[] } | null; error: string | null }>,
    []
  );

  const clients = React.useMemo(
    () => (data?.customers || []).map(transformClient),
    [data?.customers]
  );

  return {
    clients,
    loading,
    error,
    refetch,
  };
}

export function useClient(id: string | null) {
  const { data, loading, error, refetch } = useApiData<{ customer: unknown }>(
    async () => {
      if (!id) return { data: null, error: null };
      return customersApi.getById(id) as Promise<{ data: { customer: unknown } | null; error: string | null }>;
    },
    [id]
  );

  const client = React.useMemo(
    () => data?.customer ? transformClient(data.customer) : null,
    [data?.customer]
  );

  return {
    client,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Sites
// ============================================

export function useSites() {
  const { data, loading, error, refetch } = useApiData<{ sites: unknown[] }>(
    () => sitesApi.getAll() as Promise<{ data: { sites: unknown[] } | null; error: string | null }>,
    []
  );

  const sites = React.useMemo(
    () => (data?.sites || []).map(transformSite),
    [data?.sites]
  );

  return {
    sites,
    loading,
    error,
    refetch,
  };
}

export function useSite(id: string | null) {
  const { data, loading, error, refetch } = useApiData<{ site: unknown }>(
    async () => {
      if (!id) return { data: null, error: null };
      return sitesApi.getById(id) as Promise<{ data: { site: unknown } | null; error: string | null }>;
    },
    [id]
  );

  const site = React.useMemo(
    () => data?.site ? transformSite(data.site) : null,
    [data?.site]
  );

  return {
    site,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Waste Types
// ============================================

export function useWasteTypes() {
  const { data, loading, error, refetch } = useApiData<{ waste_types: unknown[] }>(
    () => wasteTypesApi.getAll() as Promise<{ data: { waste_types: unknown[] } | null; error: string | null }>,
    []
  );

  const wasteTypes = React.useMemo(
    () => (data?.waste_types || []).map(transformWasteType),
    [data?.waste_types]
  );

  return {
    wasteTypes,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Transporters
// ============================================

export function useTransporters() {
  const { data, loading, error, refetch } = useApiData<{ transporters: Transporter[] }>(
    () => transportersApi.getAll() as Promise<{ data: { transporters: Transporter[] } | null; error: string | null }>,
    []
  );

  return {
    transporters: data?.transporters || [],
    loading,
    error,
    refetch,
  };
}

// ============================================
// Receiving Facilities
// ============================================

export function useReceivingFacilities() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, loading, error, refetch } = useApiData<{ receiving_facilities: any[] }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => receivingFacilitiesApi.getAll() as Promise<{ data: { receiving_facilities: any[] } | null; error: string | null }>,
    []
  );

  const facilities = React.useMemo(() => {
    return (data?.receiving_facilities || []).map(transformReceivingFacility);
  }, [data]);

  return {
    facilities,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Containers
// ============================================

export function useContainers() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, loading, error, refetch } = useApiData<{ containers: any[] }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => containersApi.getAll() as Promise<{ data: { containers: any[] } | null; error: string | null }>,
    []
  );

  const containers = React.useMemo(
    () => (data?.containers || []).map(transformContainer),
    [data?.containers]
  );

  return {
    containers,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Profiles
// ============================================

export function useProfiles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, loading, error, refetch } = useApiData<{ profiles: any[] }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => profilesApi.getAll() as Promise<{ data: { profiles: any[] } | null; error: string | null }>,
    []
  );

  const profiles = React.useMemo(
    () => (data?.profiles || []).map(transformProfile),
    [data?.profiles]
  );

  return {
    profiles,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Service Items
// ============================================

export function useServiceItems() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, loading, error, refetch } = useApiData<{ service_items: any[] }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => serviceItemsApi.getAll() as Promise<{ data: { service_items: any[] } | null; error: string | null }>,
    []
  );

  const serviceItems = React.useMemo(
    () => (data?.service_items || []).map(transformServiceItem),
    [data?.service_items]
  );

  return {
    serviceItems,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Units
// ============================================

export function useUnits() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, loading, error, refetch } = useApiData<{ units: any[] }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => referenceDataApi.getUnits() as Promise<{ data: { units: any[] } | null; error: string | null }>,
    []
  );

  const units = React.useMemo(
    () => (data?.units || []).map(transformUnit),
    [data?.units]
  );

  return {
    units,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Users
// ============================================

export function useUsers() {
  const { data, loading, error, refetch } = useApiData<{ users: unknown[] }>(
    () => usersApi.getAll() as Promise<{ data: { users: unknown[] } | null; error: string | null }>,
    []
  );

  const users = React.useMemo(
    () => (data?.users || []).map(transformUser),
    [data?.users]
  );

  return {
    users,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Audit Log
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAuditLogEntry(raw: any): AuditLogEntry {
  // Parse changes to get entity details for summary
  let entityDetails = '';
  try {
    const changes = raw.changes || {};
    // Try to get a meaningful identifier from changes
    const nameChange = changes.name || changes.vendor_name || changes.customer_name || changes.site_name || changes.facility_name;
    if (nameChange) {
      entityDetails = nameChange.old || nameChange.new || '';
    }
  } catch {
    // Ignore parse errors
  }

  const action = (raw.action || 'update').toLowerCase();
  const entityType = raw.entity_type || 'record';
  const summary = entityDetails
    ? `${action.charAt(0).toUpperCase() + action.slice(1)}d ${entityType}: ${entityDetails}`
    : `${action.charAt(0).toUpperCase() + action.slice(1)}d ${entityType}`;

  return {
    id: raw.id,
    timestamp: raw.timestamp || new Date().toISOString(),
    actor: {
      name: raw.user_name || raw.user_email || 'System',
      avatarUrl: undefined,
    },
    actionType: action,
    entityType: entityType,
    entityId: raw.entity_id || '',
    summary,
    payload: {
      old_values: raw.changes,
      new_values: raw.changes,
    },
  };
}

export function useAuditLog(params?: Record<string, string>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, loading, error, refetch } = useApiData<{ audit_logs: any[] }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => auditApi.getLogs(params) as Promise<{ data: { audit_logs: any[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const logs = React.useMemo(() => {
    return (data?.audit_logs || []).map(transformAuditLogEntry);
  }, [data]);

  return {
    logs,
    loading,
    error,
    refetch,
  };
}

// ============================================
// Dashboard Data (Combined fetch)
// ============================================

interface DashboardData {
  shipments: Shipment[];
  sites: Site[];
  clients: Client[];
  vendors: Vendor[];
}

export function useDashboardData() {
  const [data, setData] = React.useState<DashboardData>({
    shipments: [],
    sites: [],
    clients: [],
    vendors: [],
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shipmentsRes, sitesRes, clientsRes, vendorsRes] = await Promise.all([
        shipmentsApi.getAll(),
        sitesApi.getAll(),
        customersApi.getAll(),
        vendorsApi.getAll(),
      ]);

      setData({
        shipments: (shipmentsRes.data as { shipments: Shipment[] })?.shipments || [],
        sites: (sitesRes.data as { sites: Site[] })?.sites || [],
        clients: (clientsRes.data as { customers: Client[] })?.customers || [],
        vendors: (vendorsRes.data as { vendors: Vendor[] })?.vendors || [],
      });

      const errors = [shipmentsRes, sitesRes, clientsRes, vendorsRes]
        .filter(r => r.error)
        .map(r => r.error);

      if (errors.length > 0) {
        setError(errors.join('; '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...data, loading, error, refetch: fetch };
}

// ============================================
// KPI & Analytics Transformers
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformInvoiceRecord(raw: any): InvoiceRecord {
  return {
    id: raw.id,
    clientId: raw.client_id ?? raw.clientId ?? '',
    invoiceDate: raw.invoice_date ?? raw.invoiceDate ?? '',
    dueDate: raw.due_date ?? raw.dueDate ?? '',
    amount: raw.amount ?? 0,
    paidDate: raw.paid_date ?? raw.paidDate ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformCollectionEvent(raw: any): CollectionEvent {
  return {
    id: raw.id,
    siteId: raw.site_id ?? raw.siteId ?? '',
    scheduledDate: raw.scheduled_date ?? raw.scheduledDate ?? '',
    actualDate: raw.actual_date ?? raw.actualDate ?? undefined,
    status: raw.status ?? 'completed',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformContainerPlacement(raw: any): ContainerPlacement {
  return {
    id: raw.id,
    containerId: raw.container_id ?? raw.containerId ?? '',
    containerType: raw.container_type ?? raw.containerType ?? '',
    siteId: raw.site_id ?? raw.siteId ?? '',
    placedDate: raw.placed_date ?? raw.placedDate ?? '',
    removedDate: raw.removed_date ?? raw.removedDate ?? undefined,
    fillPercentage: raw.fill_percentage ?? raw.fillPercentage ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformFacilityCapacity(raw: any): FacilityCapacity {
  return {
    facilityId: raw.facility_id ?? raw.facilityId ?? '',
    facilityName: raw.facility_name ?? raw.facilityName ?? '',
    monthlyCapacityTons: raw.monthly_capacity_tons ?? raw.monthlyCapacityTons ?? 0,
    monthlyProcessedTons: raw.monthly_processed_tons ?? raw.monthlyProcessedTons ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformFuelRecord(raw: any): FuelRecord {
  return {
    transporterId: raw.transporter_id ?? raw.transporterId ?? '',
    transporterName: raw.transporter_name ?? raw.transporterName ?? '',
    mpg: raw.mpg ?? 0,
    fuelCostPerMile: raw.fuel_cost_per_mile ?? raw.fuelCostPerMile ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRouteSchedule(raw: any): RouteSchedule {
  return {
    id: raw.id,
    routeId: raw.route_id ?? raw.routeId ?? '',
    siteId: raw.site_id ?? raw.siteId ?? '',
    siteName: raw.site_name ?? raw.siteName ?? '',
    scheduledDay: raw.scheduled_day ?? raw.scheduledDay ?? '',
    completedDay: raw.completed_day ?? raw.completedDay ?? undefined,
    onTime: raw.on_time ?? raw.onTime ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformTruckLoad(raw: any): TruckLoad {
  return {
    id: raw.id,
    truckId: raw.truck_id ?? raw.truckId ?? '',
    transporterName: raw.transporter_name ?? raw.transporterName ?? '',
    maxWeightLbs: raw.max_weight_lbs ?? raw.maxWeightLbs ?? 0,
    loadedWeightLbs: raw.loaded_weight_lbs ?? raw.loadedWeightLbs ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSafetyIncident(raw: any): SafetyIncident {
  return {
    id: raw.id,
    date: raw.date ?? '',
    type: raw.type ?? 'vehicle',
    severity: raw.severity ?? 'minor',
    resolved: raw.resolved ?? false,
    siteId: raw.site_id ?? raw.siteId ?? '',
    description: raw.description ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformInspectionRecord(raw: any): InspectionRecord {
  return {
    id: raw.id,
    siteId: raw.site_id ?? raw.siteId ?? '',
    siteName: raw.site_name ?? raw.siteName ?? '',
    date: raw.date ?? '',
    passed: raw.passed ?? true,
    findings: raw.findings ?? 0,
    inspectorName: raw.inspector_name ?? raw.inspectorName ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformServiceVerification(raw: any): ServiceVerification {
  return {
    shipmentId: raw.shipment_id ?? raw.shipmentId ?? '',
    verified: raw.verified ?? false,
    verifiedDate: raw.verified_date ?? raw.verifiedDate ?? undefined,
    goBack: raw.go_back ?? raw.goBack ?? false,
    goBackReason: raw.go_back_reason ?? raw.goBackReason ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformContainerWeightRecord(raw: any): ContainerWeightRecord {
  return {
    shipmentId: raw.shipment_id ?? raw.shipmentId ?? '',
    containerType: raw.container_type ?? raw.containerType ?? '',
    tareWeightLbs: raw.tare_weight_lbs ?? raw.tareWeightLbs ?? 0,
    grossWeightLbs: raw.gross_weight_lbs ?? raw.grossWeightLbs ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPlatformUserActivity(raw: any): PlatformUserActivity {
  return {
    userId: raw.user_id ?? raw.userId ?? '',
    userName: raw.user_name ?? raw.userName ?? '',
    role: raw.role ?? 'site_user',
    lastActiveDate: raw.last_active_date ?? raw.lastActiveDate ?? '',
    shipmentsCreated: raw.shipments_created ?? raw.shipmentsCreated ?? 0,
    features: raw.features ?? [],
    loginCount: raw.login_count ?? raw.loginCount ?? 0,
    avgSessionMinutes: raw.avg_session_minutes ?? raw.avgSessionMinutes ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformCustomerSurvey(raw: any): CustomerSurvey {
  return {
    id: raw.id,
    clientId: raw.client_id ?? raw.clientId ?? '',
    clientName: raw.client_name ?? raw.clientName ?? '',
    date: raw.date ?? '',
    csat: raw.csat ?? 0,
    nps: raw.nps ?? 0,
    fcrResolved: raw.fcr_resolved ?? raw.fcrResolved ?? false,
    responseTimeHrs: raw.response_time_hrs ?? raw.responseTimeHrs ?? 0,
    hasComplaint: raw.has_complaint ?? raw.hasComplaint ?? false,
    complaintCategory: raw.complaint_category ?? raw.complaintCategory ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformShipmentLineItem(raw: any): ShipmentLineItem {
  return {
    id: raw.id,
    shipmentId: raw.shipment_id ?? raw.shipmentId ?? '',
    lineNumber: raw.line_number ?? raw.lineNumber ?? 0,
    unitId: raw.unit_id ?? raw.unitId ?? '',
    quantityValue: raw.quantity_value ?? raw.quantityValue ?? 0,
    weightLbPerUnit: raw.weight_lb_per_unit ?? raw.weightLbPerUnit ?? undefined,
    standardizedWeightLb: raw.standardized_weight_lb ?? raw.standardizedWeightLb ?? undefined,
    standardizedWeightKg: raw.standardized_weight_kg ?? raw.standardizedWeightKg ?? undefined,
    targetLoadWeightLb: raw.target_load_weight_lb ?? raw.targetLoadWeightLb ?? undefined,
    wasteTypeId: raw.waste_type_id ?? raw.wasteTypeId ?? undefined,
    wasteCodeId: raw.waste_code_id ?? raw.wasteCodeId ?? undefined,
    treatmentMethodId: raw.treatment_method_id ?? raw.treatmentMethodId ?? undefined,
    sourceCodeId: raw.source_code_id ?? raw.sourceCodeId ?? undefined,
    formCodeId: raw.form_code_id ?? raw.formCodeId ?? undefined,
    treatmentCodeId: raw.treatment_code_id ?? raw.treatmentCodeId ?? undefined,
    ewcCodeId: raw.ewc_code_id ?? raw.ewcCodeId ?? undefined,
    containerId: raw.container_id ?? raw.containerId ?? undefined,
    serviceFrequencyId: raw.service_frequency_id ?? raw.serviceFrequencyId ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformShipmentExternalIdentifier(raw: any): ShipmentExternalIdentifier {
  return {
    id: raw.id,
    shipmentId: raw.shipment_id ?? raw.shipmentId ?? '',
    identifierType: raw.identifier_type ?? raw.identifierType ?? '',
    identifierValue: raw.identifier_value ?? raw.identifierValue ?? '',
    sourceSystem: raw.source_system ?? raw.sourceSystem ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformContainerLocation(raw: any): ContainerLocation {
  return {
    id: raw.id,
    siteId: raw.site_id ?? raw.siteId ?? '',
    locationName: raw.location_name ?? raw.locationName ?? '',
    locationCode: raw.location_code ?? raw.locationCode ?? undefined,
    activeFlag: raw.is_active ?? raw.active_flag ?? raw.activeFlag ?? true,
  };
}

// ============================================
// KPI & Analytics Hooks
// ============================================

// --- Invoice Records ---
export function useInvoiceRecords(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ invoice_records: unknown[] }>(
    () => invoiceRecordsApi.getAll(params) as Promise<{ data: { invoice_records: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const invoiceRecords = React.useMemo(
    () => (data?.invoice_records || []).map(transformInvoiceRecord),
    [data?.invoice_records]
  );

  return { invoiceRecords, loading, error, refetch };
}

// --- Collection Events ---
export function useCollectionEvents(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ collection_events: unknown[] }>(
    () => collectionEventsApi.getAll(params) as Promise<{ data: { collection_events: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const collectionEvents = React.useMemo(
    () => (data?.collection_events || []).map(transformCollectionEvent),
    [data?.collection_events]
  );

  return { collectionEvents, loading, error, refetch };
}

// --- Container Placements ---
export function useContainerPlacements(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ container_placements: unknown[] }>(
    () => containerPlacementsApi.getAll(params) as Promise<{ data: { container_placements: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const containerPlacements = React.useMemo(
    () => (data?.container_placements || []).map(transformContainerPlacement),
    [data?.container_placements]
  );

  return { containerPlacements, loading, error, refetch };
}

// --- Facility Capacities ---
export function useFacilityCapacities(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ facility_capacities: unknown[] }>(
    () => facilityCapacitiesApi.getAll(params) as Promise<{ data: { facility_capacities: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const facilityCapacities = React.useMemo(
    () => (data?.facility_capacities || []).map(transformFacilityCapacity),
    [data?.facility_capacities]
  );

  return { facilityCapacities, loading, error, refetch };
}

// --- Fuel Records ---
export function useFuelRecords(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ fuel_records: unknown[] }>(
    () => fuelRecordsApi.getAll(params) as Promise<{ data: { fuel_records: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const fuelRecords = React.useMemo(
    () => (data?.fuel_records || []).map(transformFuelRecord),
    [data?.fuel_records]
  );

  return { fuelRecords, loading, error, refetch };
}

// --- Route Schedules ---
export function useRouteSchedules(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ route_schedules: unknown[] }>(
    () => routeSchedulesApi.getAll(params) as Promise<{ data: { route_schedules: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const routeSchedules = React.useMemo(
    () => (data?.route_schedules || []).map(transformRouteSchedule),
    [data?.route_schedules]
  );

  return { routeSchedules, loading, error, refetch };
}

// --- Truck Loads ---
export function useTruckLoads(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ truck_loads: unknown[] }>(
    () => truckLoadsApi.getAll(params) as Promise<{ data: { truck_loads: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const truckLoads = React.useMemo(
    () => (data?.truck_loads || []).map(transformTruckLoad),
    [data?.truck_loads]
  );

  return { truckLoads, loading, error, refetch };
}

// --- Safety Incidents ---
export function useSafetyIncidents(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ safety_incidents: unknown[] }>(
    () => safetyIncidentsApi.getAll(params) as Promise<{ data: { safety_incidents: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const safetyIncidents = React.useMemo(
    () => (data?.safety_incidents || []).map(transformSafetyIncident),
    [data?.safety_incidents]
  );

  return { safetyIncidents, loading, error, refetch };
}

// --- Inspection Records ---
export function useInspectionRecords(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ inspection_records: unknown[] }>(
    () => inspectionRecordsApi.getAll(params) as Promise<{ data: { inspection_records: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const inspectionRecords = React.useMemo(
    () => (data?.inspection_records || []).map(transformInspectionRecord),
    [data?.inspection_records]
  );

  return { inspectionRecords, loading, error, refetch };
}

// --- Service Verifications ---
export function useServiceVerifications(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ service_verifications: unknown[] }>(
    () => serviceVerificationsApi.getAll(params) as Promise<{ data: { service_verifications: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const serviceVerifications = React.useMemo(
    () => (data?.service_verifications || []).map(transformServiceVerification),
    [data?.service_verifications]
  );

  return { serviceVerifications, loading, error, refetch };
}

// --- Container Weight Records ---
export function useContainerWeightRecords(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ container_weight_records: unknown[] }>(
    () => containerWeightRecordsApi.getAll(params) as Promise<{ data: { container_weight_records: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const containerWeightRecords = React.useMemo(
    () => (data?.container_weight_records || []).map(transformContainerWeightRecord),
    [data?.container_weight_records]
  );

  return { containerWeightRecords, loading, error, refetch };
}

// --- Platform User Activity ---
export function usePlatformUserActivity(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ platform_user_activities: unknown[] }>(
    () => platformUserActivityApi.getAll(params) as Promise<{ data: { platform_user_activities: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const platformUserActivities = React.useMemo(
    () => (data?.platform_user_activities || []).map(transformPlatformUserActivity),
    [data?.platform_user_activities]
  );

  return { platformUserActivities, loading, error, refetch };
}

// --- Customer Surveys ---
export function useCustomerSurveys(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ customer_surveys: unknown[] }>(
    () => customerSurveysApi.getAll(params) as Promise<{ data: { customer_surveys: unknown[] } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const customerSurveys = React.useMemo(
    () => (data?.customer_surveys || []).map(transformCustomerSurvey),
    [data?.customer_surveys]
  );

  return { customerSurveys, loading, error, refetch };
}

// --- Shipment Line Items ---
export function useShipmentLineItems(shipmentId: string | null) {
  const { data, loading, error, refetch } = useApiData<{ line_items: unknown[] }>(
    async () => {
      if (!shipmentId) return { data: null, error: null };
      return shipmentLineItemsApi.getByShipmentId(shipmentId) as Promise<{ data: { line_items: unknown[] } | null; error: string | null }>;
    },
    [shipmentId]
  );

  const lineItems = React.useMemo(
    () => (data?.line_items || []).map(transformShipmentLineItem),
    [data?.line_items]
  );

  return { lineItems, loading, error, refetch };
}

// --- Shipment External Identifiers ---
export function useShipmentExternalIdentifiers(shipmentId: string | null) {
  const { data, loading, error, refetch } = useApiData<{ external_identifiers: unknown[] }>(
    async () => {
      if (!shipmentId) return { data: null, error: null };
      return shipmentExternalIdentifiersApi.getByShipmentId(shipmentId) as Promise<{ data: { external_identifiers: unknown[] } | null; error: string | null }>;
    },
    [shipmentId]
  );

  const externalIdentifiers = React.useMemo(
    () => (data?.external_identifiers || []).map(transformShipmentExternalIdentifier),
    [data?.external_identifiers]
  );

  return { externalIdentifiers, loading, error, refetch };
}

// --- Container Locations by Site ---
export function useContainerLocationsBySite(siteId: string | null) {
  const { data, loading, error, refetch } = useApiData<{ container_locations: unknown[] }>(
    async () => {
      if (!siteId) return { data: null, error: null };
      return containerLocationsBySiteApi.getBySiteId(siteId) as Promise<{ data: { container_locations: unknown[] } | null; error: string | null }>;
    },
    [siteId]
  );

  const containerLocations = React.useMemo(
    () => (data?.container_locations || []).map(transformContainerLocation),
    [data?.container_locations]
  );

  return { containerLocations, loading, error, refetch };
}

// ============================================
// Analytics Aggregation Hooks
// ============================================

// Type definitions for analytics data
export interface SafetyTrainingRecord {
  training_type: string;
  total_employees: number;
  completed: number;
  pending: number;
}

export interface RouteProgressRecord {
  date: string;
  total_routes: number;
  on_time: number;
  delayed: number;
}

export interface YardTurnaroundRecord {
  facility_name: string;
  avg_turnaround: number;
  min_turnaround: number;
  max_turnaround: number;
}

export interface ServiceAgreementRate {
  service_type: string;
  avg_rate: number;
  min_rate: number;
  max_rate: number;
  agreement_count: number;
}

export interface PlatformMonthlyEvent {
  month: string;
  event_count: number;
  unique_users: number;
}

export interface ClientIndustryCode {
  industry: string;
  count: number;
}

// --- Safety Training Analytics ---
export function useSafetyTrainingData() {
  const { data, loading, error, refetch } = useApiData<{ safety_training_data: SafetyTrainingRecord[] }>(
    () => kpiAnalyticsApi.getSafetyTrainingData() as Promise<{ data: { safety_training_data: SafetyTrainingRecord[] } | null; error: string | null }>,
    []
  );

  const safetyTrainingData = React.useMemo(
    () => data?.safety_training_data || [],
    [data?.safety_training_data]
  );

  return { safetyTrainingData, loading, error, refetch };
}

// --- Route Progress Analytics ---
export function useRouteProgressData() {
  const { data, loading, error, refetch } = useApiData<{ route_progress_data: RouteProgressRecord[] }>(
    () => kpiAnalyticsApi.getRouteProgressData() as Promise<{ data: { route_progress_data: RouteProgressRecord[] } | null; error: string | null }>,
    []
  );

  const routeProgressData = React.useMemo(
    () => data?.route_progress_data || [],
    [data?.route_progress_data]
  );

  return { routeProgressData, loading, error, refetch };
}

// --- Yard Turnaround Analytics ---
export function useYardTurnaroundData() {
  const { data, loading, error, refetch } = useApiData<{ yard_turnaround_data: YardTurnaroundRecord[] }>(
    () => kpiAnalyticsApi.getYardTurnaroundData() as Promise<{ data: { yard_turnaround_data: YardTurnaroundRecord[] } | null; error: string | null }>,
    []
  );

  const yardTurnaroundData = React.useMemo(
    () => data?.yard_turnaround_data || [],
    [data?.yard_turnaround_data]
  );

  return { yardTurnaroundData, loading, error, refetch };
}

// --- Service Agreement Rates Analytics ---
export function useServiceAgreementRates() {
  const { data, loading, error, refetch } = useApiData<{ service_agreement_rates: ServiceAgreementRate[] }>(
    () => kpiAnalyticsApi.getServiceAgreementRates() as Promise<{ data: { service_agreement_rates: ServiceAgreementRate[] } | null; error: string | null }>,
    []
  );

  const serviceAgreementRates = React.useMemo(
    () => data?.service_agreement_rates || [],
    [data?.service_agreement_rates]
  );

  return { serviceAgreementRates, loading, error, refetch };
}

// --- Platform Monthly Events Analytics ---
export function usePlatformMonthlyEvents() {
  const { data, loading, error, refetch } = useApiData<{ platform_monthly_events: PlatformMonthlyEvent[] }>(
    () => kpiAnalyticsApi.getPlatformMonthlyEvents() as Promise<{ data: { platform_monthly_events: PlatformMonthlyEvent[] } | null; error: string | null }>,
    []
  );

  const platformMonthlyEvents = React.useMemo(
    () => data?.platform_monthly_events || [],
    [data?.platform_monthly_events]
  );

  return { platformMonthlyEvents, loading, error, refetch };
}

// --- Client Industry Codes Analytics ---
export function useClientIndustryCodes() {
  const { data, loading, error, refetch } = useApiData<{ client_industry_codes: ClientIndustryCode[] }>(
    () => kpiAnalyticsApi.getClientIndustryCodes() as Promise<{ data: { client_industry_codes: ClientIndustryCode[] } | null; error: string | null }>,
    []
  );

  const clientIndustryCodes = React.useMemo(
    () => data?.client_industry_codes || [],
    [data?.client_industry_codes]
  );

  return { clientIndustryCodes, loading, error, refetch };
}

// ============================================
// Safety Training Records (Full CRUD - New Entity)
// ============================================

export interface SafetyTrainingRecordEntity {
  id: string;
  employeeName: string;
  department: string;
  courseName: string;
  completionDate: string;
  certified: boolean;
  expirationDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSafetyTrainingRecord(raw: any): SafetyTrainingRecordEntity {
  return {
    id: raw.id,
    employeeName: raw.employee_name ?? raw.employeeName ?? '',
    department: raw.department ?? '',
    courseName: raw.course_name ?? raw.courseName ?? '',
    completionDate: raw.completion_date ?? raw.completionDate ?? '',
    certified: raw.certified ?? false,
    expirationDate: raw.expiration_date ?? raw.expirationDate ?? undefined,
    createdAt: raw.created_at ?? raw.createdAt ?? undefined,
    updatedAt: raw.updated_at ?? raw.updatedAt ?? undefined,
  };
}

export function useSafetyTrainingRecords(params?: Record<string, string>) {
  const { data, loading, error, refetch } = useApiData<{ safety_training: unknown[]; pagination?: unknown }>(
    () => safetyTrainingApi.getAll(params) as Promise<{ data: { safety_training: unknown[]; pagination?: unknown } | null; error: string | null }>,
    [JSON.stringify(params)]
  );

  const safetyTrainingRecords = React.useMemo(
    () => (data?.safety_training || []).map(transformSafetyTrainingRecord),
    [data?.safety_training]
  );

  return { safetyTrainingRecords, pagination: data?.pagination, loading, error, refetch };
}
