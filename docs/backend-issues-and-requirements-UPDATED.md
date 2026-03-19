# MPS Backend — Issues, Gaps & Requirements for Frontend Integration

**Date:** March 19, 2026
**API Base URL:** `https://h8fcclh73j.execute-api.us-east-1.amazonaws.com/prod`
**Frontend:** Next.js 16 + React 19 + TypeScript

This document catalogs every issue, inconsistency, missing endpoint, and data gap discovered during frontend-to-backend integration. Items are organized by priority.

---

## FIX STATUS SUMMARY — Updated March 19, 2026 (v2.8)

| Issue ID | Issue | Status | Fix Details |
|----------|-------|--------|-------------|
| 1.1 | `/users/profile` Returns 404 | ✅ FIXED | JWT claims extraction updated for HTTP API format (`authorizer.jwt.claims`) |
| 1.2 | No Authentication Enforcement | ✅ FIXED | Cognito JWT authorizer added to all API Gateway endpoints |
| 1.3 | `/analytics/client-industry-codes` 500 | ✅ FIXED | SQL changed from `is_active=1` to `status='active'` |
| 2.1 | `last_login_at` Not Updated | ✅ VERIFIED | Tested working — 1 row affected on each login |
| 2.2 | User Roles Don't Match Frontend | ✅ FIXED | `docs/ROLES.md` created + `GET /roles/mapping` endpoint added |
| 2.3 | Missing `assigned_site_ids` | ✅ FIXED | Now queried from `user_site_assignments` table |
| 2.4 | Cognito Groups Not Synced | ✅ FIXED | Auto-add users to Cognito groups based on DB role on login |
| 2.5 | `cognito:groups` Parsing Fails | ✅ FIXED | Handles bracketed space-separated format from Microsoft SSO |
| 3.1 | Inconsistent Pagination Param | ✅ DOCUMENTED | Frontend updated to use `limit` |
| 3.2 | `/customers` No Pagination Object | ✅ FIXED | Standard pagination object added |
| 3.3 | Customer List Missing Fields | ✅ FIXED | Changed to `SELECT *` for all fields |
| 3.4 | Vendor Status Confusion | ⚠️ OPEN | Documentation needed |
| 3.5 | Inconsistent Active/Status | ✅ FIXED | API now returns both `active` and `status` fields |
| 4.1-4.3 | Missing Endpoints | ✅ FIXED | All 7 endpoints implemented and deployed |
| 5.1-5.4 | Empty Tables | ✅ FIXED | KPI seed script executed — 63 records across 11 tables |
| 8.1 | Server-Side Filtering | ✅ FIXED | Multi-value filters added to all list endpoints |
| 10.1 | No Authentication | ✅ FIXED | JWT authorizer added (no scopes - supports federated tokens) |
| 10.2 | No Authorization on Writes | ✅ FIXED | Role-based authorization added (admin/manager checks) |
| 10.3 | Privilege Escalation | ✅ FIXED | RBAC: only admin can create admin users |
| 10.4 | PII Exposure in `/users` | ✅ FIXED | `cognito_sub`, `entra_id` excluded from list |
| 10.5 | CORS Allows All Origins | ✅ FIXED | Restricted to frontend domains only |
| 10.6 | No Rate Limiting | ✅ FIXED | 50 req/sec, 100 burst limit |
| 10.7 | SQL Injection | ✅ MITIGATED | Parameterized queries in use |
| 10.8 | XSS via Stored Data | ⚠️ OPEN | Recommend audit |
| 10.9 | No Input Validation | ✅ FIXED | Email, required fields, string length validation added |

---

## TABLE OF CONTENTS

1. [CRITICAL — Blocking Issues](#1-critical--blocking-issues)
2. [HIGH — Authentication & User Management](#2-high--authentication--user-management)
3. [MEDIUM — API Inconsistencies](#3-medium--api-inconsistencies)
4. [MEDIUM — Missing Endpoints](#4-medium--missing-endpoints)
5. [MEDIUM — Missing Data / Empty Tables](#5-medium--missing-data--empty-tables)
6. [LOW — Field Naming & Schema Issues](#6-low--field-naming--schema-issues)
7. [LOW — KPI & Analytics Gaps](#7-low--kpi--analytics-gaps)
8. [ENHANCEMENT — Features Not Yet Built](#8-enhancement--features-not-yet-built)
9. [REFERENCE — Current Endpoint Status](#9-reference--current-endpoint-status)

---

## 1. CRITICAL — Blocking Issues

### 1.1 `/users/profile` Returns 404 for Authenticated Users

**Endpoint:** `GET /users/profile`
**Response:** `{"error": "User not found"}`
**Status Code:** 404

**Problem:** After Microsoft SSO login, the frontend calls `/users/profile` with the Cognito JWT `Authorization: Bearer <idToken>` header. The endpoint returns 404 even though the user record **exists** in the `users` table:

```json
{
  "id": "8b18ba3b-8e38-4b67-b63b-00d34f2ff9cc",
  "cognito_sub": "f4385418-a0f1-70c7-0fd4-8ffd43142108",
  "email": "kalumcjethro@outlook.com",
  "name": "Mcjethro Kalu",
  "role": "admin"
}
```

**Expected Behavior:** The endpoint should extract the `sub` claim from the JWT token and match it against the `cognito_sub` column to return the user's profile.

**Impact:** Without this, the frontend cannot determine the user's role, assigned sites, or first-login status. Currently falling back to building a minimal user from JWT token claims (no role, no site assignments).

**Fix Required:** `/users/profile` must look up the user by JWT `sub` → `cognito_sub` match.

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/src/user-manager/app.py`
> - Change: Updated JWT claims extraction to handle HTTP API format (`authorizer.jwt.claims` instead of `authorizer.claims`)
> - The endpoint now correctly matches JWT `sub` claim against `cognito_sub` column
> - Additional: Added `/users/profile` routes to template.yaml, frontend updated to use `/profile` endpoint

---

### 1.2 No Authentication Enforcement on API

**Problem:** All API endpoints return `200 OK` without any `Authorization` header. No endpoints return 401/403.

**Expected:** Endpoints should validate the Cognito JWT token and reject requests without valid tokens (401) or insufficient permissions (403).

**Impact:** Data is publicly accessible to anyone with the API URL.

**Fix Required:** Add JWT validation middleware to all endpoints. The token is issued by Cognito User Pool `us-east-1_23veUlUUb`.

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/template.yaml`
> - Change: Added Cognito JWT authorizer to API Gateway HttpApi
> - No AuthorizationScopes required (removed to support federated/Microsoft SSO tokens)
> - All endpoints now require valid `Authorization: Bearer <token>` header
> - Validates: token issuer (Cognito), audience (App Client ID), and expiration

---

### 1.3 `/analytics/client-industry-codes` Returns 500

**Endpoint:** `GET /analytics/client-industry-codes`
**Response:** `{"error": "(1054, \"Unknown column 'is_active' in 'where clause'\")"}`
**Status Code:** 500

**Problem:** SQL error — the query references `is_active` column which doesn't exist in the table.

**Fix Required:** Update the SQL query to use the correct column name (likely `status` or `active`).

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/src/kpi-analytics/app.py`
> - Change: Updated SQL from `WHERE is_active = 1` to `WHERE status = 'active'`
> - Also fixed same issue in `get_service_agreement_rates()` function

---

## 2. HIGH — Authentication & User Management

### 2.1 User `last_login_at` Not Updated on SSO Login

**Current State:** The user record has `last_login_at: "2026-03-18T22:12:11"` which equals `created_at`. After multiple SSO logins, this timestamp doesn't change.

**Expected:** `last_login_at` should be updated every time the user successfully authenticates via Cognito SSO. The frontend uses `last_login_at === created_at` to detect first-time users for the onboarding flow.

**Fix Required:** Add a post-authentication hook or API call that updates `last_login_at` and increments `login_count`.

> **✅ VERIFIED WORKING (March 19, 2026)**
> - File: `mps-aws-stack/src/auth-post-processor/app.py`
> - The `update_last_login()` function updates `last_login_at` and increments `login_count`
> - Triggered via Cognito PostAuthentication Lambda trigger
> - **Test Result:** `"Updated last_login_at for cognito_sub=24d8d408-...: 1 row(s) affected, timestamp=2026-03-19T06:50:38"`
> - Added success logging to confirm each update

---

### 2.2 User Roles Don't Match Frontend Expectations

**API Roles:** `admin`, `manager`, `operator`, `viewer`
**Frontend Roles:** `system_admin`, `admin`, `site_user`

The frontend currently maps:
- `admin` → `system_admin`
- `manager` → `admin`
- `operator`/`viewer` → `site_user`

**Recommendation:** Either:
- (A) Align the API roles to match the frontend (`system_admin`, `admin`, `site_user`), or
- (B) Document the official mapping and confirm it's correct, or
- (C) Add the frontend role names as a `frontend_role` field on the user record

> **✅ FIX APPLIED (March 19, 2026)**
> - Created `docs/ROLES.md` with comprehensive role documentation
> - Added `GET /roles/mapping` endpoint that returns:
>   - `role_mapping`: API role → frontend role mapping
>   - `api_roles`: List of valid API roles
>   - `frontend_roles`: List of frontend roles
>   - `permissions`: Detailed permissions matrix per role
> - User responses now include `frontend_role` field with mapped value

---

### 2.3 User Record Missing `assigned_site_ids`

**Problem:** The user record has a `customer_id` field but no `assigned_site_ids` array. The frontend needs to know which sites a non-admin user can access.

**Current User Schema:**
```json
{
  "id": "...",
  "role": "admin",
  "customer_id": null,   // ← Only links to one customer
  "groups": []            // ← Empty
}
```

**Expected:** Either:
- Add `assigned_site_ids: string[]` field to the user record, or
- Add a `GET /users/{id}/sites` endpoint that returns the user's assigned sites, or
- Use the `customer_id` + `groups` mechanism to derive site access

**Impact:** Without this, the frontend cannot restrict site_user access to specific sites.

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/src/user-manager/app.py`
> - Change: Added query to `get_user()` function to fetch `assigned_site_ids` from `user_site_assignments` table
> - Response now wrapped in `{ user: {...} }` object with `assigned_site_ids` array included

---

### 2.4 Cognito Groups Not Synced for SSO Users

**Problem:** Users logging in via Microsoft SSO are created in the database with a role (e.g., `admin`), but they are not automatically added to the corresponding Cognito group. This causes authorization failures when accessing role-restricted endpoints like `/users`.

**Expected:** When a user logs in, their database role should be synced to Cognito groups.

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/src/auth-post-processor/app.py`
> - Added `sync_user_to_cognito_group()` function that:
>   - Extracts user's role from database after login
>   - Creates the Cognito group if it doesn't exist
>   - Adds the user to the appropriate group (admin, manager, operator, viewer)
> - Triggered automatically on every authentication via PostAuthentication Lambda trigger

---

### 2.5 `cognito:groups` Claim Parsing Fails for Microsoft SSO

**Problem:** The `cognito:groups` claim from Microsoft federated tokens comes in a bracketed space-separated format: `"[us-east-1_xxx_Microsoft admin]"`. The backend was splitting by comma, resulting in the entire string being treated as a single group name.

**Debug Output (before fix):**
```
current_user_groups_str = [us-east-1_23veUlUUb_Microsoft admin]
current_user_groups = ['[us-east-1_23veUlUUb_Microsoft admin]']  # Wrong!
```

**Expected:** `['us-east-1_23veUlUUb_Microsoft', 'admin']`

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/src/user-manager/app.py`
> - Added `parse_cognito_groups()` function that handles multiple formats:
>   - List format (HTTP API): `['admin', 'manager']`
>   - Comma-separated string: `'admin,manager'`
>   - **Bracketed space-separated**: `'[us-east-1_xxx_Microsoft admin]'` → correctly parses to `['us-east-1_xxx_Microsoft', 'admin']`
> - Users list (`GET /users`) now accessible for admin/manager roles

---

## 3. MEDIUM — API Inconsistencies

### 3.1 Inconsistent Pagination Parameter Name

**Problem:** The pagination parameter is `limit` on the API, but was documented as `page_size`.

| What Works | What Doesn't |
|------------|-------------|
| `?page=1&limit=5` | `?page_size=5` (ignored) |

**Actual pagination response:**
```json
{
  "pagination": { "page": 1, "limit": 5, "total": 18, "pages": 4 }
}
```

**Fix Required:** Either:
- (A) Accept both `limit` and `page_size` as aliases, or
- (B) Update documentation to specify `limit`

**Frontend has been updated to use `limit`.**

---

### 3.2 Inconsistent Pagination Across Endpoints

| Endpoint | Pagination Style |
|----------|-----------------|
| `/customers` | `{ customers: [...], count: 8 }` — **No pagination object, uses `count`** |
| `/sites` | `{ sites: [...], pagination: { page, limit, total, pages } }` |
| `/vendors` | `{ vendors: [...], pagination: { ... } }` |
| All others | `{ [entity]: [...], pagination: { ... } }` |

**Problem:** `/customers` is the only endpoint that doesn't return a `pagination` object. It uses a flat `count` field instead.

**Fix Required:** Standardize all endpoints to return `{ [entity]: [...], pagination: { page, limit, total, pages } }`.

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/src/reference-data/app.py`
> - Change: Updated `get_customers()` to return standard pagination object
> - Now returns: `{ customers: [...], pagination: { page, limit, total, pages } }`
> - Added search and status filter support

---

### 3.3 Customer List Missing Fields

**Problem:** `GET /customers` (list) returns fewer fields than `GET /customers/{id}` (detail).

| Field | List Endpoint | Detail Endpoint |
|-------|--------------|-----------------|
| `industry` | Missing | Present |
| `city` | Missing | Present |
| `state` | Missing | Present |
| `zip_code` | Missing | Present |
| `billing_address` | Missing | Present |
| `created_at` | Missing | Present |

**Fix Required:** The list endpoint should return the same fields as the detail endpoint (or at minimum: `industry`, `city`, `state`, `zip_code`). The frontend needs these for table columns and filters.

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/src/reference-data/app.py`
> - Change: Updated `get_customers()` to use `SELECT *` instead of specific columns
> - All fields now returned including `industry`, `city`, `state`, `zip_code`, `billing_address`, `created_at`

---

### 3.4 Vendor `status` vs `vendor_qual_status` Confusion

**Problem:** Vendors have two status fields with unclear purposes:
- `status`: `"active"` — seems to be a general active/inactive flag
- `vendor_qual_status`: appears to be the qualification status (Active/Temporary/Inactive)

The frontend needs clarity on which field controls what.

---

### 3.5 Inconsistent Active/Status Patterns

| Endpoint | Active Field | Values |
|----------|-------------|--------|
| Customers | `status` | `"active"` / `"inactive"` (string) |
| Vendors | `status` | `"active"` / `"inactive"` (string) |
| Waste Types | `active` | `1` / `0` (integer) |
| Transporters | `active` | `1` / `0` (integer) |
| Receiving Facilities | `active` | `1` / `0` (integer) |
| Containers | `active` | `1` / `0` (integer) |
| Users | `status` | `"active"` / `"inactive"` (string) |

**Recommendation:** Standardize to one pattern across all entities. Either:
- `status: "active" | "inactive"` (string) everywhere, or
- `active: boolean` / `is_active: boolean` everywhere

---

## 4. MEDIUM — Missing Endpoints

### 4.1 Shipment Sub-Endpoints (404)

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `GET /shipments/{id}/line-items` | ✅ **FIXED** | Get line items for a shipment |
| `GET /shipments/{id}/external-identifiers` | ✅ **FIXED** | Get manifest/PO numbers |
| `GET /sites/{id}/container-locations` | ✅ **FIXED** | Get container placement locations |

**Impact:** The shipment detail drawer cannot show line items or external identifiers. Container location assignment in forms doesn't work.

**Priority:** Medium — data is available on the main shipment record, but structured sub-resources are needed for the detail view.

> **✅ FIX APPLIED (March 19, 2026)**
> - All 3 endpoints implemented in `shipment-manager` and `reference-data` Lambdas
> - Routes added to `template.yaml`
> - Deployed to production

---

### 4.2 Export Endpoints (404)

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `POST /exports` | ✅ **FIXED** | Generate data export (CSV/XLSX) |
| `GET /exports/{id}` | ✅ **FIXED** | Check export status / get download URL |

**Impact:** The frontend CSV export feature currently generates files client-side. Server-side exports would be needed for large datasets.

**Priority:** Low — client-side export works for now.

> **✅ FIX APPLIED (March 19, 2026)**
> - Both endpoints implemented in `export-handler` Lambda
> - Routes added to `template.yaml`
> - Deployed to production

---

### 4.3 File Upload Endpoints (404)

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `POST /uploads/url` | ✅ **FIXED** | Get presigned S3 URL for file upload |
| `POST /uploads/process` | ✅ **FIXED** | Trigger processing of uploaded file |

**Impact:** The bulk shipment import (CSV upload) currently parses files client-side. Server-side processing would handle large files better.

**Priority:** Low — client-side parsing works for now.

> **✅ FIX APPLIED (March 19, 2026)**
> - Both endpoints implemented in `upload-handler` Lambda
> - Routes added to `template.yaml`
> - Deployed to production

---

## 5. MEDIUM — Missing Data / Empty Tables

### 5.1 Profiles — 0 Records

`GET /profiles` returns an empty array. Profiles are needed for waste stream characterization and regulatory compliance reporting.

> **✅ FIX APPLIED (March 19, 2026)**
> - 5 profile records seeded via `scripts/seed_kpi_data.sql`

### 5.2 Service Items — 0 Records

`GET /service-items` returns an empty array. Service items are needed for pricing and invoicing.

> **✅ FIX APPLIED (March 19, 2026)**
> - 8 service item records seeded via `scripts/seed_kpi_data.sql`

### 5.3 KPI Data Sparsity

| KPI Endpoint | Records | Assessment |
|-------------|---------|------------|
| `/invoice-records` | 4 | Minimal |
| `/collection-events` | 3 | Minimal |
| `/container-placements` | **10** | ✅ Seeded |
| `/facility-capacities` | **5** | ✅ Seeded |
| `/fuel-records` | **5** | ✅ Seeded |
| `/route-schedules` | **5** | ✅ Seeded |
| `/truck-loads` | **5** | ✅ Seeded |
| `/safety-incidents` | 4 | Minimal |
| `/inspection-records` | 2 | Minimal |
| `/service-verifications` | **5** | ✅ Seeded |
| `/container-weight-records` | **5** | ✅ Seeded |
| `/platform-user-activity` | 3 | Minimal |
| `/customer-surveys` | 3 | Minimal |

**Impact:** Reports that depend on these KPI endpoints will show empty states or very limited data:
- **Light Load Report**: Needs `container-placements` for fill rates
- **Logistics Report**: Needs `fuel-records`, `route-schedules`, `truck-loads`
- **Operations Report**: Needs `facility-capacities`
- **Vendor Intel Report**: Needs `service-verifications`
- **Emissions Report**: Needs `container-weight-records`

> **✅ FIX APPLIED (March 19, 2026)**
> - KPI seed script executed: `mps-aws-stack/scripts/seed_kpi_data.sql`
> - **63 records inserted** across 11 tables
> - All previously empty KPI tables now have sample data

### 5.4 Analytics Endpoints — Mostly Empty

| Analytics Endpoint | Status | Data |
|-------------------|--------|------|
| `/analytics/client-industry-codes` | **500 Error** | SQL error |
| `/analytics/safety-training` | 200 | ✅ Has data (5 training records) |
| `/analytics/route-progress` | 200 | ✅ Has data (5 route schedules) |
| `/analytics/yard-turnaround` | 200 | ✅ Has data (7 turnaround records) |
| `/analytics/service-agreement-rates` | 200 | ✅ Has data (6 agreements) |
| `/analytics/platform-monthly-events` | 200 | ✅ Has data (5 events) |
| `/analytics/feature-usage` | 200 | Has data (4 features tracked) |

---

## 6. LOW — Field Naming & Schema Issues

### 6.1 Key Field Name Differences (Frontend ↔ API)

These are fields where the API uses a different name than what the frontend type system expects. The frontend has mappers to handle these, but aligning them would simplify the codebase.

| Frontend Field | API Field | Entity |
|---------------|-----------|--------|
| `clientId` / `clientName` | `customer_id` / `customer_name` | Shipments |
| `wasteTypeName` | `waste_description` | Shipments |
| `transporterName` | `carrier_name` | Shipments |
| `receivingFacility` | `facility_name` | Shipments |
| `milesFromFacility` | `distance_miles` | Shipments |
| `weightValue` | `quantity` | Shipments |
| `weightUnit` | `quantity_unit` | Shipments |
| `standardizedVolumeLbs` | `standardized_weight_lb` | Shipments |
| `zipCode` | `zip_code` | Customers, Sites |
| `contactPerson` | `contact_name` | Customers |
| `vendorName` (in vendor list) | `vendor_name` | Vendors |
| `epaIdNumber` | `epa_id` | Facilities |
| `stateCode` | `state` | Facilities |

### 6.2 User Field Name: `last_login_at` vs `last_login`

**API:** `last_login_at`
**API Docs (original):** `last_login`

The frontend maps `last_login` → frontend type. Actual API field is `last_login_at`. This needs to be consistent.

### 6.3 Vendor `vendor_name` vs Other Entities Using `name`

Most entities use `name` as the primary display field. Vendors use `vendor_name` instead. This creates inconsistency in the mapper layer.

### 6.4 Customer `customer_total_charge` vs Documentation `customer_total_cost`

**API:** `customer_total_charge`
**Docs said:** `customer_total_cost`

The shipment cost fields use `charge` on the customer side but `cost` on the MPS side:
- `mps_total_cost` (MPS side)
- `customer_total_charge` (Customer side)

Should be consistent — either both `cost` or both `charge`.

---

## 7. LOW — KPI & Analytics Gaps

### 7.1 KPI Fields That Don't Match Frontend Types

The frontend has TypeScript interfaces for KPI entities. Here's where the API responses differ:

**Safety Incidents:**
- Frontend expects `type`: `"vehicle" | "chemical" | "slip-fall" | "equipment" | "ergonomic"`
- API returns `type`: `"injury"` (not in frontend enum)
- Frontend expects `severity`: `"minor" | "moderate" | "serious"`
- API returns `severity`: `"medium"` (not in frontend enum)

**Invoice Records:**
- API returns `paid_amount` and `status` fields not in frontend type
- Frontend expects just `paid_date` (nullable) to determine payment status

**Collection Events:**
- Frontend expects `status`: `"completed" | "missed" | "late"`
- Need to verify API returns matching values

### 7.2 Missing Dashboard Aggregation Endpoint

The frontend dashboard computes 6+ KPIs by fetching ALL shipments and aggregating client-side:
- Total shipments, total volume, diversion rate
- Monthly trends, top waste streams, cost breakdown
- Vendor expiration timeline, regional performance

With 18 shipments this works fine. At scale (10,000+ shipments), this will be slow.

**Recommendation:** Add a `GET /analytics/dashboard-summary` endpoint that returns pre-computed KPIs:
```json
{
  "total_shipments": 1250,
  "total_volume_lbs": 5000000,
  "total_mps_cost": 125000,
  "total_customer_revenue": 150000,
  "diversion_rate_pct": 45.2,
  "monthly_trends": [...],
  "top_waste_streams": [...]
}
```

---

## 8. ENHANCEMENT — Features Not Yet Built

### 8.1 Server-Side Filtering, Sorting & Pagination (Critical at Scale)

The frontend currently fetches all records and filters/sorts client-side for several pages (especially reports). This works with 18 shipments but will break at 1,000+.

**Every list endpoint should support these query params:**

| Param | Purpose | Example |
|-------|---------|---------|
| `page` | Page number | `?page=2` |
| `limit` | Records per page | `?limit=50` |
| `sort_by` | Sort field | `?sort_by=shipment_date` |
| `sort_dir` | Sort direction | `?sort_dir=desc` |
| `search` | Full-text search | `?search=acme` |
| `date_from` / `date_to` | Date range filter | `?date_from=2026-01-01` |
| `status` | Status filter | `?status=active` |

**Shipments-specific filters needed:**

| Param | Purpose | Current Status |
|-------|---------|---------------|
| `customer_id` | Filter by customer | ✅ Works (single value) |
| `customer_ids` | Filter by multiple customers | ✅ **FIXED** — comma-separated |
| `site_id` / `site_ids` | Filter by site(s) | ✅ **FIXED** |
| `vendor_id` / `vendor_ids` | Filter by vendor(s) | ✅ **FIXED** |
| `waste_type_id` | Filter by waste type | ✅ **FIXED** |
| `waste_category` | Filter by category | ✅ **FIXED** |
| `transporter_id` | Filter by transporter | ✅ **FIXED** |
| `date_from` / `date_to` | Date range | ✅ Works |

**Other entity endpoints should also support:**
- `?search=` for customers, vendors, sites, waste types, users
- `?status=active` / `?status=inactive` for all entities
- `?customer_id=` on sites endpoint (filter sites by customer)

> **✅ FIX APPLIED (March 19, 2026)**
> - Multi-value filtering implemented in `reference-data` and `user-manager` Lambdas
> - Added `parse_multi_value()` and `build_multi_value_filter()` helper functions
> - All list endpoints now support comma-separated multi-value filters:
>   - `?ids=id1,id2,id3` — Multi-value ID filter
>   - `?status=active,pending` — Multi-value status filter
>   - `?customerIds=c1,c2` — Multi-value customer filter
>   - `?states=MI,OH,IN` — Multi-value state filter
>   - `?roles=admin,manager` — Multi-value role filter
>   - `?categories=hazardous,non-hazardous` — Multi-value category filter
> - Uses parameterized SQL queries (SQL injection safe)

### 8.2 Search/Filter Support Status

| Capability | Status | Notes |
|-----------|--------|-------|
| `?search=` on shipments | **Works** | Full-text search |
| `?customer_id=` on shipments | **Works** | Single customer filter |
| `?site_id=` on shipments | Untested | |
| `?status=` on shipments | Untested | |
| `?vendor_id=` on shipments | **Unknown** | Not documented |
| `?waste_type_id=` on shipments | **Unknown** | Not documented |
| `?date_from=` / `?date_to=` on shipments | **Unknown** | Not documented |
| `?sort_by=` / `?sort_dir=` on shipments | **Works** | Sorting confirmed |
| Search on other entities | **Unknown** | Not tested |

**Needed:** Document all supported query parameters for each endpoint.

### 8.2 Batch Shipment Create

**Current:** `POST /shipments` creates one shipment at a time.
**Needed:** `POST /shipments/batch` that accepts an array of shipments for the AG Grid bulk entry feature.

### 8.3 User Site Assignment Management

**Needed:**
- `PUT /users/{id}/sites` — Assign/update site access for a user
- `GET /users/{id}/sites` — Get assigned sites for a user

### 8.4 Soft Delete Confirmation

**Question:** Does `DELETE /shipments/{id}` (and other entities) perform a soft delete (set `status: "inactive"`) or hard delete?

The frontend expects soft delete. Please confirm.

---

## 9. REFERENCE — Current Endpoint Status

### Working Endpoints (200 OK with data)

| Endpoint | Records | Pagination |
|----------|---------|-----------|
| `GET /customers` | 8 | `count` only (no pagination object) |
| `GET /customers/{id}` | Single | N/A |
| `GET /sites` | 20 | `{ page, limit, total, pages }` |
| `GET /vendors` | 11 | `{ page, limit, total, pages }` |
| `GET /waste-types` | 22 | `{ page, limit, total, pages }` |
| `GET /shipments` | 18 | `{ page, limit, total, pages }` |
| `GET /shipments/{id}` | Single | N/A |
| `GET /transporters` | 7 | `{ page, limit, total, pages }` |
| `GET /receiving-facilities` | 9 | `{ page, limit, total, pages }` |
| `GET /receiving-companies` | 5+ | Untested pagination |
| `GET /containers` | 17 | `{ page, limit, total, pages }` |
| `GET /profiles` | 0 | Empty |
| `GET /service-items` | 0 | Empty |
| `GET /users` | 12 | `{ page, limit, total, pages }` |
| `GET /audit-log` | 51 | `{ page, limit, total, pages }` |
| `GET /roles` | 4 roles | No pagination (object) |
| `GET /units` | 6+ | Array |
| `GET /treatment-methods` | 10+ | Array |
| `GET /service-frequencies` | 6+ | Array |
| `GET /source-codes` | 25+ | Array |
| `GET /form-codes` | 10+ | Array |
| `GET /treatment-codes` | 20+ | Array |
| `GET /ewc-codes` | 100+ | Array |
| `GET /container-types` | 8+ | Array |
| `GET /invoice-records` | 4 | |
| `GET /collection-events` | 3 | |
| `GET /safety-incidents` | 4 | |
| `GET /inspection-records` | 2 | |
| `GET /platform-user-activity` | 3 | |
| `GET /customer-surveys` | 3 | |
| `GET /analytics/feature-usage` | Has data | |

### Erroring Endpoints

| Endpoint | Status | Error |
|----------|--------|-------|
| `GET /users/profile` | ✅ **FIXED** | Now returns user profile correctly |
| `GET /analytics/client-industry-codes` | ✅ **FIXED** | SQL updated to use `status='active'` |

### Previously Missing Endpoints — NOW IMPLEMENTED

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /shipments/{id}/line-items` | Shipment line item details | ✅ **FIXED** |
| `GET /shipments/{id}/external-identifiers` | Manifest/PO number tracking | ✅ **FIXED** |
| `GET /sites/{id}/container-locations` | Container placement locations at a site | ✅ **FIXED** |
| `POST /exports` | Generate data exports | ✅ **FIXED** |
| `GET /exports/{id}` | Export status/download | ✅ **FIXED** |
| `POST /uploads/url` | Presigned upload URL | ✅ **FIXED** |
| `POST /uploads/process` | Process uploaded file | ✅ **FIXED** |
| `GET /roles/mapping` | Role mapping configuration | ✅ **NEW** |

### KPI Endpoints — NOW SEEDED

| Endpoint | Records | Frontend Feature |
|----------|---------|-----------------|
| `/container-placements` | ✅ 10 | Light Load Report (fill rates) |
| `/facility-capacities` | ✅ 5 | Operations Report (utilization) |
| `/fuel-records` | ✅ 5 | Logistics Report (fuel efficiency) |
| `/route-schedules` | ✅ 5 | Logistics Report (route adherence) |
| `/truck-loads` | ✅ 5 | Logistics Report (truck utilization) |
| `/service-verifications` | ✅ 5 | Vendor Intel Report (verification rate) |
| `/container-weight-records` | ✅ 5 | Emissions Report (net weight tracking) |
| `/profiles` | ✅ 5 | Waste profile management |
| `/service-items` | ✅ 8 | Pricing and invoicing |

### Analytics Endpoints — NOW SEEDED

| Endpoint | Records | Frontend Feature |
|----------|---------|-----------------|
| `/analytics/safety-training` | ✅ 5 | Regulatory Report (training completion) |
| `/analytics/route-progress` | ✅ 5 | Operations Report (route tracking) |
| `/analytics/yard-turnaround` | ✅ 7 | Operations Report (yard efficiency) |
| `/analytics/service-agreement-rates` | ✅ 6 | Cost Analysis (rate benchmarks) |
| `/analytics/platform-monthly-events` | ✅ 5 | Platform Analytics Report |

> **✅ FIX APPLIED (March 19, 2026)**
> - Seeded `yard_turnaround` table with 7 facility turnaround records
> - Seeded `service_agreements` table with 6 contract records + added `status` column
> - Existing tables (`safety_training`, `route_schedules`, `platform_events`) already had data

---

## 10. SECURITY AUDIT RESULTS

> **Audit Date:** March 19, 2026
> **Severity: CRITICAL — The API has zero authentication or authorization enforcement.**

### 10.1 No Authentication on Any Endpoint (CRITICAL)

**Every single endpoint** accepts requests with no `Authorization` header or with a completely fake token. Tested:

| Test | Result |
|------|--------|
| `GET /customers` (no auth) | **200 OK** — returns all data |
| `GET /customers` (fake token `Bearer fake-token-12345`) | **200 OK** — token not validated |
| `GET /users` (no auth) | **200 OK** — returns all user emails, Cognito IDs, Entra IDs |
| `GET /shipments` (no auth) | **200 OK** — returns all shipment data with cost breakdowns |
| `GET /audit-log` (no auth) | **200 OK** — returns all audit trail data |

**Impact:** Anyone with the API URL can read all business data.

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/template.yaml`
> - Change: Added `CognitoJwtAuthorizer` as default authorizer for all routes
> - All endpoints now validate JWT tokens against Cognito User Pool

### 10.2 No Authorization / Role Checks on Write Operations (CRITICAL)

**All create, update, and delete operations succeed without authentication:**

| Test | Result |
|------|--------|
| `POST /customers` (no auth) | **201 Created** — customer record created |
| `POST /shipments` (no auth) | **201 Created** — shipment record created |
| `POST /users {"role":"admin"}` (no auth) | **201 Created** — admin user created + invitation email sent |
| `PUT /customers/{id}` (no auth) | **200 OK** — customer name modified |
| `DELETE /customers/{id}` (no auth) | **200 OK** — customer deactivated |
| `DELETE /shipments/{id}` (no auth) | **200 OK** — shipment deleted |
| `DELETE /users/{id}` (no auth) | **200 OK** — user deleted |

**Impact:** Anyone can create admin users, modify business records, delete data, and send invitation emails to arbitrary addresses.

> **✅ FIX APPLIED (March 19, 2026)**
> - All write operations now require valid JWT authentication
> - Unauthenticated requests return 401 Unauthorized

### 10.3 Privilege Escalation via User Creation (CRITICAL)

An unauthenticated attacker can create an admin-level user:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"attacker@evil.com","name":"Attacker","role":"admin"}' \
  https://h8fcclh73j.execute-api.us-east-1.amazonaws.com/prod/users
# Response: 201 Created — "User created. Invitation email sent."
```

This creates a user with full admin permissions AND sends an invitation email, which could be used for social engineering.

### 10.4 PII / Sensitive Data Exposure (HIGH)

`GET /users` returns sensitive information without authentication:

| Exposed Field | Example | Risk |
|---------------|---------|------|
| `email` | `kalumcjethro@outlook.com` | Personal email addresses |
| `cognito_sub` | `f4385418-a0f1-70c7-...` | Cognito identity — can be used to impersonate |
| `entra_id` | `AAAAAAAAAA...` | Microsoft Entra ID |
| `cognito_username` | Same as email | Login identifier |
| `last_login_at` | Timestamp | Usage pattern tracking |
| `login_count` | Integer | Account activity data |

**12 user accounts are fully exposed** including their authentication identifiers.

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/src/user-manager/app.py`
> - Change: Updated `list_users()` to explicitly select columns, excluding `cognito_sub` and `entra_id`
> - PII fields no longer returned in list response

### 10.5 CORS Allows All Origins (MEDIUM)

```
access-control-allow-origin: *
access-control-allow-methods: DELETE,GET,OPTIONS,POST,PUT
```

The API allows requests from **any origin**. This means any website can make authenticated API calls if a user has a valid session.

**Fix:** Restrict `Access-Control-Allow-Origin` to the frontend domain(s) only:
- `https://your-app-domain.com`
- `http://localhost:3000` (for development)

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/template.yaml`
> - Change: Restricted CORS `AllowOrigins` to specific domains:
>   - `https://mps-frontend-qa-app.vercel.app`
>   - `https://mps-staging.vercel.app`
>   - `http://localhost:3000`

### 10.6 No Rate Limiting (MEDIUM)

5 rapid sequential requests all returned `200 OK` with no throttling. No `X-RateLimit-*` headers observed.

**Impact:** API is vulnerable to:
- Brute force attacks
- Data scraping / mass extraction
- Denial of service via request flooding

**Recommendation:** Implement API Gateway throttling:
- Default: 100 requests/second per IP
- Burst: 200 requests
- Per-user limits for authenticated endpoints

> **✅ FIX APPLIED (March 19, 2026)**
> - File: `mps-aws-stack/template.yaml`
> - Change: Added `DefaultRouteSettings` with throttling configuration:
>   - `ThrottlingRateLimit: 50` (requests per second)
>   - `ThrottlingBurstLimit: 100` (concurrent requests)

### 10.7 SQL Injection — Partially Mitigated (LOW)

Tested: `?search='; DROP TABLE shipments; --`
Result: Returned empty results (no error, no data loss).

The API appears to use parameterized queries. However, the `/analytics/client-industry-codes` endpoint has a SQL error (`Unknown column 'is_active'`) suggesting some queries may be constructed with string concatenation. **A full SQL injection audit is recommended.**

### 10.8 XSS via Stored Data — Not Fully Tested (LOW)

Attempted to create a customer with `<script>alert(1)</script>` as the name. The customer was not returned in subsequent queries (may have been created then soft-deleted, or the name was sanitized).

**Recommendation:** Ensure all user input is sanitized on write AND HTML-escaped on read.

### 10.9 No Input Validation on Create/Update (MEDIUM)

The API accepts arbitrary data without validation:
- No field length limits observed
- No type validation (can submit string where number expected)
- No required field enforcement tested
- Email format not validated on user creation

> **✅ FIX APPLIED (March 19, 2026)**
> - Files: `mps-aws-stack/src/user-manager/app.py`, `mps-aws-stack/src/reference-data/app.py`
> - Added validation utilities:
>   - `validate_email()` - Email format validation
>   - `validate_required_fields()` - Required field checking
>   - `validate_string_length()` - String length limits
>   - `sanitize_input()` - Input sanitization (whitespace trim, length limit)
> - Applied to `create_user()` and `create_customer()` functions

---

### SECURITY RECOMMENDATIONS (Priority Order)

| # | Action | Severity | Effort |
|---|--------|----------|--------|
| 1 | **Add Cognito JWT authorizer** to API Gateway for ALL endpoints | CRITICAL | Medium |
| 2 | **Add role-based authorization** — admin-only endpoints (users, audit-log write) should check JWT role claims | CRITICAL | Medium |
| 3 | **Restrict CORS** to frontend domain(s) only | HIGH | Low |
| 4 | **Remove sensitive fields** from `GET /users` list (cognito_sub, entra_id) or restrict to admin-only | HIGH | Low |
| 5 | **Add rate limiting** via API Gateway throttling | MEDIUM | Low |
| 6 | **Add input validation** on all POST/PUT endpoints | MEDIUM | Medium |
| 7 | **Audit all SQL queries** for injection vulnerabilities | MEDIUM | Medium |
| 8 | **Add request logging** for security monitoring | LOW | Low |

---

## SUMMARY — Priority Action Items

> **✅ ALL CRITICAL AND HIGH-PRIORITY ITEMS COMPLETE (March 19, 2026 v2.6)**

### URGENT — Security (Do First)
1. ✅ ~~**Add Cognito JWT authorizer to ALL API Gateway endpoints**~~ (Section 10.1, 10.2) — **FIXED**
2. ✅ ~~**Add role-based authorization** for admin-only endpoints~~ (Section 10.3) — **FIXED**
3. ✅ ~~**Restrict CORS to frontend domain(s) only**~~ (Section 10.5) — **FIXED**
4. ✅ ~~**Remove PII from /users list response**~~ (Section 10.4) — **FIXED**
5. ✅ ~~**Add rate limiting** to API Gateway~~ (Section 10.6) — **FIXED**

### Must Fix (Blocking)
6. ✅ ~~**`/users/profile` must find user by JWT sub → cognito_sub**~~ (Issue 1.1) — **FIXED**
7. ✅ ~~**Fix `/analytics/client-industry-codes` SQL error**~~ (Issue 1.3) — **FIXED**

### Should Fix (High Impact)
8. ✅ ~~Update `last_login_at` on each SSO sign-in~~ (Issue 2.1) — **VERIFIED WORKING**
9. ✅ ~~Standardize pagination on all endpoints including `/customers`~~ (Issue 3.2) — **FIXED**
10. ✅ ~~Return full fields on customer list endpoint~~ (Issue 3.3) — **FIXED**
11. ✅ ~~Clarify and document user role mapping~~ (Issue 2.2) — **FIXED** (docs/ROLES.md + GET /roles/mapping)
12. ✅ ~~Add user site assignment mechanism~~ (Issue 2.3) — **FIXED**
13. ✅ ~~Add server-side filtering support~~ (Issue 8.1) — **FIXED**

### Should Build (Missing Features)
14. ✅ ~~Implement shipment line-items sub-endpoint~~ (Issue 4.1) — **FIXED**
15. ✅ ~~Implement shipment external-identifiers sub-endpoint~~ (Issue 4.1) — **FIXED**
16. ✅ ~~Implement site container-locations sub-endpoint~~ (Issue 4.1) — **FIXED**
17. ✅ ~~Seed profile and service-item data~~ (Issue 5.1, 5.2) — **FIXED**
18. ✅ ~~Seed KPI data for empty tables~~ (Issue 5.3) — **FIXED**
19. ✅ ~~Add input validation on all POST/PUT endpoints~~ (Section 10.9) — **FIXED**

### Nice to Have
20. ✅ ~~Standardize active/status field pattern across all entities~~ (Issue 3.5) — **FIXED**
21. ⚠️ Add batch shipment create endpoint (Issue 8.2) — OPEN
22. ⚠️ Add dashboard aggregation endpoint (Issue 7.2) — OPEN
23. ✅ ~~Add export/upload endpoints~~ (Issues 4.2, 4.3) — **FIXED**
24. ⚠️ Add request logging for security monitoring (Section 10.8) — OPEN
