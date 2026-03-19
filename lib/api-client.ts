/**
 * MPS API Client
 * Handles all API calls to the backend with authentication
 */

import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
  } catch (error) {
    console.error('Error getting auth session:', error);
  }
  return {
    'Content-Type': 'application/json',
  };
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = response.ok ? await response.json() : null;

    return {
      data,
      error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
    };
  }
}

// Generic CRUD operations
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  put: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// ============================================
// Domain-specific API functions
// ============================================

// --- Shipments ---
export const shipmentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ shipments: unknown[] }>(`/shipments${query}`);
  },
  getById: (id: string) => api.get<{ shipment: unknown }>(`/shipments/${id}`),
  create: (data: unknown) => api.post<{ shipment: unknown }>('/shipments', data),
  update: (id: string, data: unknown) => api.put<{ shipment: unknown }>(`/shipments/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/shipments/${id}`),
};

// --- Vendors ---
export const vendorsApi = {
  getAll: () => api.get<{ vendors: unknown[] }>('/vendors'),
  getById: (id: string) => api.get<{ vendor: unknown }>(`/vendors/${id}`),
  create: (data: unknown) => api.post<{ vendor: unknown }>('/vendors', data),
  update: (id: string, data: unknown) => api.put<{ vendor: unknown }>(`/vendors/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/vendors/${id}`),
};

// --- Customers ---
export const customersApi = {
  getAll: () => api.get<{ customers: unknown[] }>('/customers'),
  getById: (id: string) => api.get<{ customer: unknown }>(`/customers/${id}`),
  create: (data: unknown) => api.post<{ customer: unknown }>('/customers', data),
  update: (id: string, data: unknown) => api.put<{ customer: unknown }>(`/customers/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/customers/${id}`),
};

// --- Sites ---
export const sitesApi = {
  getAll: () => api.get<{ sites: unknown[] }>('/sites'),
  getById: (id: string) => api.get<{ site: unknown }>(`/sites/${id}`),
  create: (data: unknown) => api.post<{ site: unknown }>('/sites', data),
  update: (id: string, data: unknown) => api.put<{ site: unknown }>(`/sites/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/sites/${id}`),
};

// --- Waste Types ---
export const wasteTypesApi = {
  getAll: () => api.get<{ waste_types: unknown[] }>('/waste-types'),
  getById: (id: string) => api.get<{ waste_type: unknown }>(`/waste-types/${id}`),
  create: (data: unknown) => api.post<{ waste_type: unknown }>('/waste-types', data),
  update: (id: string, data: unknown) => api.put<{ waste_type: unknown }>(`/waste-types/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/waste-types/${id}`),
};

// --- Transporters ---
export const transportersApi = {
  getAll: () => api.get<{ transporters: unknown[] }>('/transporters'),
  getById: (id: string) => api.get<{ transporter: unknown }>(`/transporters/${id}`),
  create: (data: unknown) => api.post<{ transporter: unknown }>('/transporters', data),
  update: (id: string, data: unknown) => api.put<{ transporter: unknown }>(`/transporters/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/transporters/${id}`),
};

// --- Receiving Facilities ---
export const receivingFacilitiesApi = {
  getAll: () => api.get<{ facilities: unknown[] }>('/receiving-facilities'),
  getById: (id: string) => api.get<{ facility: unknown }>(`/receiving-facilities/${id}`),
  create: (data: unknown) => api.post<{ facility: unknown }>('/receiving-facilities', data),
  update: (id: string, data: unknown) => api.put<{ facility: unknown }>(`/receiving-facilities/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/receiving-facilities/${id}`),
};

// --- Containers ---
export const containersApi = {
  getAll: () => api.get<{ containers: unknown[] }>('/containers'),
  getById: (id: string) => api.get<{ container: unknown }>(`/containers/${id}`),
  create: (data: unknown) => api.post<{ container: unknown }>('/containers', data),
  update: (id: string, data: unknown) => api.put<{ container: unknown }>(`/containers/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/containers/${id}`),
};

// --- Profiles ---
export const profilesApi = {
  getAll: () => api.get<{ profiles: unknown[] }>('/profiles'),
  getById: (id: string) => api.get<{ profile: unknown }>(`/profiles/${id}`),
  create: (data: unknown) => api.post<{ profile: unknown }>('/profiles', data),
  update: (id: string, data: unknown) => api.put<{ profile: unknown }>(`/profiles/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/profiles/${id}`),
};

// --- Service Items ---
export const serviceItemsApi = {
  getAll: () => api.get<{ service_items: unknown[] }>('/service-items'),
  getById: (id: string) => api.get<{ service_item: unknown }>(`/service-items/${id}`),
  create: (data: unknown) => api.post<{ service_item: unknown }>('/service-items', data),
  update: (id: string, data: unknown) => api.put<{ service_item: unknown }>(`/service-items/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/service-items/${id}`),
};

// --- Reference Data (Read-only) ---
export const referenceDataApi = {
  getAll: () => api.get<unknown>('/reference-data'),
  getUnits: () => api.get<{ units: unknown[] }>('/units'),
  getContainerTypes: () => api.get<{ container_types: unknown[] }>('/container-types'),
  getTreatmentMethods: () => api.get<{ treatment_methods: unknown[] }>('/treatment-methods'),
  getServiceFrequencies: () => api.get<{ service_frequencies: unknown[] }>('/service-frequencies'),
  getContainerLocations: () => api.get<{ container_locations: unknown[] }>('/container-locations'),
  getEwcCodes: () => api.get<{ ewc_codes: unknown[] }>('/ewc-codes'),
  getSourceCodes: () => api.get<{ source_codes: unknown[] }>('/source-codes'),
  getFormCodes: () => api.get<{ form_codes: unknown[] }>('/form-codes'),
  getTreatmentCodes: () => api.get<{ treatment_codes: unknown[] }>('/treatment-codes'),
  getTriWasteCodes: () => api.get<{ tri_waste_codes: unknown[] }>('/tri-waste-codes'),
  getReceivingCompanies: () => api.get<{ receiving_companies: unknown[] }>('/receiving-companies'),
};

// --- Users ---
export const usersApi = {
  getAll: () => api.get<{ users: unknown[] }>('/users'),
  getById: (id: string) => api.get<{ user: unknown }>(`/users/${id}`),
  create: (data: unknown) => api.post<{ user: unknown }>('/users', data),
  update: (id: string, data: unknown) => api.put<{ user: unknown }>(`/users/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/users/${id}`),
  getProfile: () => api.get<{ user: unknown }>('/profile'),
  updateProfile: (data: unknown) => api.put<{ user: unknown }>('/profile', data),
  getRoles: () => api.get<{ roles: unknown[] }>('/roles'),
};

// --- User Site Assignments ---
export const userSiteAssignmentsApi = {
  getAll: () => api.get<{ assignments: unknown[] }>('/user-site-assignments'),
  getUserSites: (userId: string) => api.get<{ sites: unknown[] }>(`/users/${userId}/sites`),
  create: (data: unknown) => api.post<{ assignment: unknown }>('/user-site-assignments', data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/user-site-assignments/${id}`),
};

// --- Audit Log ---
export const auditApi = {
  getLogs: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ audit_logs: unknown[] }>(`/audit${query}`);
  },
};

// --- Exports ---
export const exportsApi = {
  generate: (data: unknown) => api.post<{ export_id: string }>('/exports', data),
  getStatus: (id: string) => api.get<{ export: unknown }>(`/exports/${id}`),
};

// --- File Uploads ---
export const uploadsApi = {
  getUploadUrl: (data: { filename: string; content_type: string }) =>
    api.post<{ upload_url: string; file_key: string }>('/uploads/url', data),
  triggerProcessing: (data: { file_key: string; file_type: string }) =>
    api.post<{ job_id: string }>('/uploads/process', data),
  getJobStatus: (jobId: string) =>
    api.get<{ job: unknown }>(`/uploads/jobs/${jobId}`),
};

// ============================================
// KPI & Analytics API Endpoints
// ============================================

// --- Invoice Records ---
export const invoiceRecordsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ invoice_records: unknown[] }>(`/invoice-records${query}`);
  },
  getById: (id: string) => api.get<{ invoice_record: unknown }>(`/invoice-records/${id}`),
};

// --- Collection Events ---
export const collectionEventsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ collection_events: unknown[] }>(`/collection-events${query}`);
  },
  getById: (id: string) => api.get<{ collection_event: unknown }>(`/collection-events/${id}`),
};

// --- Container Placements ---
export const containerPlacementsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ container_placements: unknown[] }>(`/container-placements${query}`);
  },
  getById: (id: string) => api.get<{ container_placement: unknown }>(`/container-placements/${id}`),
};

// --- Facility Capacities ---
export const facilityCapacitiesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ facility_capacities: unknown[] }>(`/facility-capacities${query}`);
  },
  getById: (id: string) => api.get<{ facility_capacity: unknown }>(`/facility-capacities/${id}`),
};

// --- Fuel Records ---
export const fuelRecordsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ fuel_records: unknown[] }>(`/fuel-records${query}`);
  },
  getById: (id: string) => api.get<{ fuel_record: unknown }>(`/fuel-records/${id}`),
};

// --- Route Schedules ---
export const routeSchedulesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ route_schedules: unknown[] }>(`/route-schedules${query}`);
  },
  getById: (id: string) => api.get<{ route_schedule: unknown }>(`/route-schedules/${id}`),
};

// --- Truck Loads ---
export const truckLoadsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ truck_loads: unknown[] }>(`/truck-loads${query}`);
  },
  getById: (id: string) => api.get<{ truck_load: unknown }>(`/truck-loads/${id}`),
};

// --- Safety Incidents ---
export const safetyIncidentsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ safety_incidents: unknown[] }>(`/safety-incidents${query}`);
  },
  getById: (id: string) => api.get<{ safety_incident: unknown }>(`/safety-incidents/${id}`),
};

// --- Inspection Records ---
export const inspectionRecordsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ inspection_records: unknown[] }>(`/inspection-records${query}`);
  },
  getById: (id: string) => api.get<{ inspection_record: unknown }>(`/inspection-records/${id}`),
};

// --- Service Verifications ---
export const serviceVerificationsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ service_verifications: unknown[] }>(`/service-verifications${query}`);
  },
  getById: (id: string) => api.get<{ service_verification: unknown }>(`/service-verifications/${id}`),
};

// --- Container Weight Records ---
export const containerWeightRecordsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ container_weight_records: unknown[] }>(`/container-weight-records${query}`);
  },
  getById: (id: string) => api.get<{ container_weight_record: unknown }>(`/container-weight-records/${id}`),
};

// --- Platform User Activity ---
export const platformUserActivityApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ platform_user_activities: unknown[] }>(`/platform-user-activity${query}`);
  },
  getById: (id: string) => api.get<{ platform_user_activity: unknown }>(`/platform-user-activity/${id}`),
};

// --- Customer Surveys ---
export const customerSurveysApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ customer_surveys: unknown[] }>(`/customer-surveys${query}`);
  },
  getById: (id: string) => api.get<{ customer_survey: unknown }>(`/customer-surveys/${id}`),
};

// --- Shipment Line Items ---
export const shipmentLineItemsApi = {
  getByShipmentId: (shipmentId: string) =>
    api.get<{ line_items: unknown[] }>(`/shipments/${shipmentId}/line-items`),
};

// --- Shipment External Identifiers ---
export const shipmentExternalIdentifiersApi = {
  getByShipmentId: (shipmentId: string) =>
    api.get<{ external_identifiers: unknown[] }>(`/shipments/${shipmentId}/external-identifiers`),
};

// --- Container Locations by Site ---
export const containerLocationsBySiteApi = {
  getBySiteId: (siteId: string) =>
    api.get<{ container_locations: unknown[] }>(`/sites/${siteId}/container-locations`),
};

// --- KPI Analytics ---
export const kpiAnalyticsApi = {
  getClientIndustryCodes: () => api.get<{ client_industry_codes: unknown[] }>('/analytics/client-industry-codes'),
  getSafetyTrainingData: () => api.get<{ safety_training_data: unknown[] }>('/analytics/safety-training'),
  getRouteProgressData: () => api.get<{ route_progress_data: unknown[] }>('/analytics/route-progress'),
  getYardTurnaroundData: () => api.get<{ yard_turnaround_data: unknown[] }>('/analytics/yard-turnaround'),
  getServiceAgreementRates: () => api.get<{ service_agreement_rates: unknown[] }>('/analytics/service-agreement-rates'),
  getPlatformMonthlyEvents: () => api.get<{ platform_monthly_events: unknown[] }>('/analytics/platform-monthly-events'),
  getFeatureUsageMap: () => api.get<{ feature_usage_map: unknown }>('/analytics/feature-usage'),
};
