# MPS Centralized Waste Shipment Platform
## Enterprise-Ready v1 Build Document (Microsoft-Only)

> **Purpose:** This document is the single source of truth for what we will build for MPS in the Enterprise-ready v1 (3–4 week build). It combines product scope + technical architecture + security + delivery plan.

---

# 1) Executive Summary

MPS currently operates waste shipment tracking and reporting through fragmented Excel workflows, causing duplicated effort, inconsistent data, and limited visibility. We will build a centralized, secure, Microsoft-native web platform that enables:

- **Fast, controlled multi-row shipment entry** (better than Excel)
- **Centralized storage** (Azure SQL) with strong data integrity
- **Role-based access** (site-level vs admin/global)
- **Filtering + export** of raw data
- **Power BI-ready reporting layer** (curated SQL views)
- **Operational support model** (hosting + monitoring + maintenance)

This v1 is designed as a foundation that can expand to other MPS divisions (Facilities / Wastewater) without rewriting.

---

# 2) Goals and Non-Goals

## 2.1 Goals (v1)

1. Centralize waste shipment data into a secure, governed system.
2. Replace single-row entry workflows with **bulk, multi-row entry** in one session.
3. Provide **site-level views** for project managers and **global views** for leadership.
4. Enable **filtered exports** (CSV; XLSX optional) for operational requests.
5. Provide a **Power BI integration surface** through curated reporting views.
6. Maintain Microsoft ecosystem alignment (Entra ID / Azure / Power BI).

## 2.2 Non-Goals (Deferred to v2)

- Automated file ingestion from arbitrary Excel formats (full “upload spreadsheet and parse”)
- AI-based validation or any external AI processing of MPS data
- Complex approval workflows (submit → approve → post)
- Multi-tenant architecture for multiple external companies (this is internal MPS)
- Advanced BI dashboarding (MPS team builds dashboards in Power BI)

---

# 3) Users, Roles, and Permissions

## 3.1 Primary User Types

- **Site User (Project Manager):** Enters shipments and reviews exports for their site.
- **Division Admin / Leadership:** Views across multiple sites and clients; audits activity.
- **System Admin (Ops):** Manages configuration, lookup tables, and user access.

## 3.2 Role Model (v1)

- **ROLE_SITE_USER**
  - Create/submit shipments for assigned site(s)
  - View shipments for assigned site(s)
  - Export shipments for assigned site(s)

- **ROLE_ADMIN**
  - View shipments across all sites
  - Export across all sites
  - View audit logs

- **ROLE_SYSTEM_ADMIN**
  - Manage lookup tables (vendors, waste types, sites)
  - Manage user roles and site assignments
  - Configure export limits / system settings

## 3.3 Enforcement Strategy

- **Backend-enforced RBAC** is mandatory for v1.
- SQL Row-Level Security is optional for v2; v1 will rely on backend authorization + validated queries.

---

# 4) Product Features (What We Will Build)

## 4.1 Authentication (Microsoft Entra ID)

- Sign-in via Microsoft Entra ID (Azure AD)
- Restrict access to MPS organization / allowed domains
- Backend validates access token (JWT) for every request
- User profile created/updated on first login

**Deliverable:** working SSO login + role mapping.

---

## 4.2 Shipment Intake (Multi-Row Entry)

### UX Requirements

- Spreadsheet-like **grid entry**
- Add/remove rows
- Paste-from-Excel support (clipboard paste into grid) — strongly recommended
- Field types:
  - Dropdowns (waste type, vendor, site)
  - Dates
  - Numbers (weight/volume)
  - Text fields
- Inline validation at the cell/row level
- Batch submit with partial success:
  - Valid rows saved
  - Invalid rows returned with row+column errors

### Data Integrity Requirements

- Frontend validates format and required fields
- Backend validates all business rules
- Database enforces constraints (NOT NULL, FK, numeric checks)

**Deliverable:** Bulk entry that can submit 10–500 rows reliably.

---

## 4.3 Shipment Viewing (Operational Table)

- Paginated table view of shipments
- Filters:
  - Date range
  - Site
  - Client
  - Vendor
  - Waste type
- Sort (date, site, vendor)
- Saved views (optional for v1; recommended if time allows)

**Deliverable:** Fast operational view with indexed filtering.

---

## 4.4 Export (Raw Data Delivery)

- Export based on current filters
- Column picker (select which columns to include)
- Export format:
  - **CSV required**
  - XLSX optional
- Export limits:
  - Soft cap configurable (e.g., 50k rows) to protect performance

**Deliverable:** One-click export that matches filters and selected columns.

---

## 4.5 Lookup Table Management (System Admin)

- Vendors
- Sites
- Clients
- Waste types
- Optional: Materials / container types

**Deliverable:** Admin UI + endpoints to manage reference data (or seeded + read-only if requested).

---

## 4.6 Audit & Activity Log

Track key actions:

- User login
- Shipment bulk submissions
- Export events
- Admin changes to lookup data

Audit fields on shipments:

- created_by
- created_at
- updated_at

**Deliverable:** Basic audit log view for admins + stored audit records.

---

## 4.7 Power BI Integration (Reporting Surface)

We will NOT expose raw operational tables as the primary BI surface.

### Reporting Layer

- Create curated SQL views, e.g.:
  - `vw_shipments_reporting`
  - `vw_site_summary_daily`
  - `vw_vendor_summary`

### Power BI Connection

- Power BI connects directly to Azure SQL (Import or DirectQuery depending on MPS preference)
- Provide connection guide and recommended refresh settings

**Deliverable:** Power BI can read reporting views; documented setup steps.

---

# 5) Technical Architecture (How We Will Build It)

## 5.1 Tech Stack (Microsoft-Native)

### Frontend
- Next.js (App Router)
- TypeScript
- Component library (shadcn/ui recommended)
- Data grid:
  - AG Grid (preferred for spreadsheet-like UX)
  - or TanStack Table + custom grid behaviors

### Backend
- Node.js + TypeScript
- Fastify (preferred) or Express
- Zod for schema validation

### Database
- Azure SQL Database (General Purpose)
- Migrations (Prisma Migrate / Drizzle / Liquibase — select one standard)

### Auth
- Microsoft Entra ID (Azure AD)
- MSAL on frontend
- JWT validation on backend

### Infra
- Azure App Service (frontend + backend)
- Azure Key Vault (secrets)
- Azure Monitor / App Insights (logs/metrics)

---

## 5.2 Conceptual Data Flow

1. User signs in via Entra ID
2. Frontend calls backend with JWT
3. Backend authorizes user + resolves role + site assignments
4. User submits multi-row shipments
5. Backend validates → writes to Azure SQL
6. Power BI reads curated views from Azure SQL

---

# 6) Data Model (v1)

> Final field list will be aligned to MPS dataset post-NDA, but the model will follow this structure.

## 6.1 Core Entities

### shipments
- id (UUID)
- client_id (FK)
- site_id (FK)
- vendor_id (FK)
- waste_type_id (FK)
- shipment_date (DATE/DATETIME)
- weight_value (DECIMAL)
- weight_unit (ENUM: lbs, tons, kg) — optional based on MPS standard
- volume_value (DECIMAL) — optional
- volume_unit (ENUM) — optional
- distance_value (DECIMAL) — optional
- distance_unit (ENUM) — optional
- notes (TEXT) — optional
- created_by (FK users)
- created_at
- updated_at

Indexes:
- (site_id, shipment_date)
- (client_id, shipment_date)
- waste_type_id
- vendor_id

### sites
- id
- client_id
- name
- address fields (optional)
- region
- active

### clients
- id
- name
- industry (optional)
- active

### vendors
- id
- name
- vendor_type
- location fields (optional)
- active

### waste_types
- id
- name
- hazardous_flag (optional)
- active

### users
- id
- email
- display_name
- role (site_user/admin/system_admin)
- active

### user_sites (assignment join)
- user_id
- site_id

### audit_logs
- id
- actor_user_id
- action_type
- entity_type
- entity_id
- payload_json
- created_at

---

# 7) API Design (v1)

## 7.1 Authentication / Session

- `GET /me`
  - returns user profile, role, assigned sites

## 7.2 Shipments

- `POST /shipments/bulk`
  - input: array of shipment rows
  - output: inserted count + row-level errors

- `GET /shipments`
  - filters: date range, site_id, client_id, vendor_id, waste_type_id
  - pagination: page/limit
  - sort: shipment_date desc default

- `GET /shipments/export`
  - same filters as list
  - selected columns
  - returns CSV stream

## 7.3 Lookups (read)

- `GET /clients`
- `GET /sites`
- `GET /vendors`
- `GET /waste-types`

## 7.4 Admin (write)

- `POST/PUT /vendors`
- `POST/PUT /sites`
- `POST/PUT /waste-types`
- `POST/PUT /users/roles`
- `POST/PUT /users/sites`

---

# 8) Validation & Data Quality

## 8.1 Frontend Validation (UX)

- Required fields present
- Correct data types
- Basic numeric constraints (e.g., non-negative)

## 8.2 Backend Validation (Business Rules)

- FK integrity (site/client/vendor/waste type exist)
- Date rules (if MPS requires: no future dates)
- Unit consistency (if units are included)
- Duplicate handling policy:
  - v1 default: allow duplicates, log warnings if exact duplicate row appears

## 8.3 Database Constraints

- NOT NULL for critical columns
- Foreign keys
- DECIMAL for numeric values
- Indexed filter columns

---

# 9) Security, Compliance, and Privacy

## 9.1 Encryption

- TLS/HTTPS in transit
- Azure SQL encryption at rest (default)

## 9.2 Access Control

- Entra ID authentication
- RBAC enforced in backend
- Site-level restrictions enforced by query constraints

## 9.3 Secrets Management

- All secrets stored in Azure Key Vault
- No secrets in code or CI logs

## 9.4 Logging

- Centralized logs in Azure Monitor/App Insights
- PII minimal logging policy (no sensitive payload dumping)

## 9.5 AI Policy (v1)

- No AI processing on MPS data
- No external model calls
- Microsoft Copilot usage is internal MPS only and out of scope

---

# 10) Performance, Scaling, and Limits

## 10.1 Expected Load

- ~100 users/month
- ~200k rows/year
- Bulk inserts: 30–500 rows per submission

## 10.2 Strategies

- Pagination for list endpoints
- Indexed filters
- Bulk inserts in transactions (chunked if needed)
- Export caps with admin-configurable thresholds

---

# 11) Environments, CI/CD, and Operations

## 11.1 Environments

- **Dev:** rapid iteration
- **Staging:** client demo + QA
- **Prod:** enterprise-ready deployment

## 11.2 CI/CD

- GitHub Actions deploy pipeline
- Automated checks:
  - lint
  - typecheck
  - unit tests (baseline)

## 11.3 Operations

- Health check endpoint (`GET /health`)
- Basic monitoring dashboards
- Backup policy for Azure SQL

---

# 12) Deliverables (What MPS Receives)

## 12.1 Product Deliverables

- Web app with Entra ID login
- Multi-row shipment intake (grid)
- Shipment table view with filters
- Export (CSV)
- Admin management for lookup tables (or seeded lookup with read-only if requested)
- Audit logs
- Power BI reporting views + connection guide

## 12.2 Technical Deliverables

- Architecture documentation
- Database schema + migrations
- API documentation
- Deployment documentation
- Runbook for maintenance/support

---

# 13) Timeline (3–4 Week Build)

## Week 1 — Foundations

- Azure infra + environments
- Database schema + migrations
- Entra ID auth integration
- RBAC skeleton
- Seed lookup data
- Reporting views skeleton

## Week 2 — Backend Core

- Bulk ingestion endpoint + validation
- Shipments query + filtering
- Export endpoint
- Audit log capture
- Index tuning

## Week 3 — Frontend Core

- Grid intake UX + paste support
- Inline validation + error summary
- Shipments list view + filters
- Export UX
- Admin screens (if included in v1)

## Week 4 — Hardening + BI + Polish

- Performance tuning
- Power BI integration walkthrough
- Monitoring + logging polish
- Security review
- Documentation
- Demo rehearsal

---

# 14) Open Questions (Need Alignment Post-NDA)

1. Confirm the exact shipment fields and required/optional columns.
2. Confirm standardized units (lbs/tons) and whether multiple units are needed.
3. Confirm MPS email domain(s) and Entra tenant configuration.
4. Confirm whether site users should be restricted from viewing other sites.
5. Confirm export size expectations and any compliance constraints.
6. Confirm retention policy and archival requirements.
7. Confirm if any fields are considered sensitive and require masking.

---

# 15) Decisions Locked for v1

## 15.1 Technology Choices (Confirmed)

- **ORM:** Drizzle (TypeScript)
- **Data Grid:** AG Grid (spreadsheet-like multi-row entry)
- **Authentication:** Full Microsoft Entra ID (Azure AD) SSO from Day 1
- **Auth Framework:** Better Auth (Microsoft provider)
- **Exports:** CSV **and** XLSX
- **Admin:** Full CRUD management for lookup tables and user access

## 15.2 Better Auth + Azure SQL (Important Implementation Note)

- Better Auth supports **Microsoft (Entra ID) OAuth** for sign-in. 
- For **Azure SQL / MSSQL** storage:
  - Use Better Auth’s **MSSQL support via the built-in Kysely adapter / CLI schema generation** for auth tables.
  - Continue using **Drizzle** for the application domain tables (shipments, vendors, sites, etc.).
  - Result: both auth tables and app tables can live in the same Azure SQL database, while each uses the right adapter internally.

---

# 16) What We Need Next (Immediate Next Steps)

## 16.1 One-time setup decisions (Day 0)

1. **Pick migration approach for Drizzle** (drizzle-kit) and commit conventions.
2. Confirm **Azure tenant strategy** (deploy in our tenant vs MPS tenant).
3. Confirm **Entra ID app registration ownership** (who creates the app + manages secrets).

## 16.2 Must-have inputs from MPS (ASAP)

1. **NDA executed**
2. Shipment schema sample + lookup tables sample
3. Confirm:
   - MPS email domain(s)
   - Site restrictions policy (can site users view other sites?)
   - Standard units (lbs/tons) and required fields

## 16.3 Engineering kickoff checklist (Week 1)

- Create repo structure (apps/web, apps/api, packages/shared)
- Azure provisioning (RG, App Services, Azure SQL, Key Vault, App Insights)
- Implement Better Auth + Microsoft provider + Entra app registration
- Create Drizzle schema + migrations for core domain tables
- Seed lookup tables
- Create first reporting view: `vw_shipments_reporting`

## 16.4 Definition of Done for Enterprise v1

Enterprise v1 is done when:

- Entra login works for MPS users
- Site user can bulk submit **100+** shipment rows with clear row-level validation
- Admin can view/filter/export across all sites
- CSV and XLSX exports match filters + selected columns
- Power BI can read curated reporting views from Azure SQL
- Audit logs capture submissions + exports + admin changes
- Deployed with dev/staging/prod + monitoring + backups

