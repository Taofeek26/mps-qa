# MPS UI Alignment Sprint Plan — Enterprise Schema

> **Goal:** Align all UI pages with the enterprise data model extracted from the real MPS workbooks.
> All normalized entity types and mock data already exist in `lib/types.ts` and `lib/mock-data.ts`.
> This sprint focuses purely on UI: enriching existing pages and building missing admin pages.

---

## Sprint 1: Enrich Existing Admin Pages

**Goal:** Add all missing enterprise fields to the 4 existing admin CRUD pages so they match the schema.

### 1.1 Vendors Page — Full Qualification Fields

- [ ] Add columns: Risk Level (badge), Completion Status, Expiration Date, DBE flag
- [ ] Add form fields: Vendor Code, DBE (switch), Commodities 1 & 2 (text), Risk Level (select: Level 1-3), Supplier Form (text), Date Entered (date picker), Date Reviewed (date picker), Expiration Date (date picker), Reviewed By (text), Vendor Qualification Status (select: Active/Temporary/Inactive), Completion Status (select: Complete/Incomplete)
- [ ] Add expiration warning badge (red if expired, yellow if <90 days)
- [ ] Add filter by Risk Level and Completion Status

### 1.2 Waste Types Page — Classification & Codes

- [ ] Add columns: Waste Category (badge), Default Treatment Method
- [ ] Add form fields: Waste Category (select from WasteCategory enum), Default Treatment Method (select from TreatmentMethod enum), Waste Codes (text), Source Code (select from reference data), Form Code (select from reference data), Treatment Code (select from reference data), EWC Number (text)
- [ ] Add filter by Waste Category

### 1.3 Sites Page — Full Address & Zip

- [ ] Add columns: Address, Zip Code
- [ ] Add Zip Code to create/edit form (currently missing)
- [ ] Add County field (text, optional)

### 1.4 Clients Page — Industry & Contact

- [ ] Add columns: Contact Person, Phone
- [ ] Add form fields: Contact Person (text), Phone (text), Address (text), City (text), State (select), Zip Code (text)

---

## Sprint 2: New Admin Pages — Reference Entities

**Goal:** Build admin CRUD pages for normalized entities that currently have no UI management.

### 2.1 Receiving Facilities Page (`/admin/receiving-facilities`)

- [ ] New route: `app/(app)/admin/receiving-facilities/page.tsx`
- [ ] CrudTable columns: Facility Name, Company Name, City, State, EPA ID, Miles, Active
- [ ] Create/Edit form: Facility Name, Receiving Company (select), Address, City, State, Zip, EPA ID #, Active
- [ ] Filter by Company, State
- [ ] Add nav item to Admin group in `lib/navigation.ts`

### 2.2 Transporters Page (`/admin/transporters`)

- [ ] New route: `app/(app)/admin/transporters/page.tsx`
- [ ] CrudTable columns: Name, Linked Vendor, Active
- [ ] Create/Edit form: Transporter Name, Linked Vendor (select, optional), Active
- [ ] Add nav item

### 2.3 Service Items Page (`/admin/service-items`)

- [ ] New route: `app/(app)/admin/service-items/page.tsx`
- [ ] CrudTable columns: Service Name, Default Waste Type, Active
- [ ] Create/Edit form: Service Name, Description, Default Waste Type (select), Active
- [ ] Add nav item

### 2.4 Containers Page (`/admin/containers`)

- [ ] New route: `app/(app)/admin/containers/page.tsx`
- [ ] CrudTable columns: Container Name, Family, Nominal Capacity, Active
- [ ] Create/Edit form: Container Name, Container Family (text), Nominal Capacity (number), Capacity Unit (select), Active
- [ ] Add nav item

### 2.5 Profiles Page (`/admin/profiles`)

- [ ] New route: `app/(app)/admin/profiles/page.tsx`
- [ ] CrudTable columns: Profile Number, Customer, Waste Type, Active
- [ ] Create/Edit form: Profile Number, Customer (select), Waste Type (select), Active
- [ ] Add nav item

### 2.6 Navigation Update

- [ ] Add all new admin pages to `lib/navigation.ts` under Admin group
- [ ] Add breadcrumb labels to `ROUTE_LABELS`

---

## Sprint 3: Shipment Detail Expansion

**Goal:** Expand the shipment details drawer to show the full enterprise data — line items, costs, facility, manifest, transporter.

### 3.1 Shipment Details Drawer — View Mode Expansion

- [ ] Add sections with dividers:
  - **Shipment Info**: Date, Manifest #, Return Manifest Date, Status
  - **Service & Classification**: Service Item, Container Location, Waste Category, Waste Codes, Treatment Method, Source/Form/Treatment Codes, EWC #, Container Type, Service Frequency, Profile #
  - **Logistics**: Receiving Company, Receiving Facility (name, city, state, EPA ID), Transporter, Miles to Facility
  - **Line Items**: Table showing per-line Qty, Unit, Weight/lb, Weight/kg, Target Load Weight, Waste Type, Waste Code, Treatment Method
  - **MPS Cost Breakdown**: Haul Charge, Disposal Fee Each, Disposal Fee Total, Fuel Fee, Environmental Fee, Rebate, Other Fees, **Total**
  - **Customer Cost Breakdown**: Same structure as MPS cost
  - **Margin**: Customer Total - MPS Total (with % badge)
  - **External Identifiers**: Key-value list (manifest_no, document_no, approval_id, etc.)
  - **Custom Fields**: Key-value list if any exist
- [ ] Pull data from `getShipmentLineItems()`, `getShipmentCostsInternal()`, `getShipmentCostsCustomer()`, `getShipmentExternalIdentifiers()`

### 3.2 Shipment Details Drawer — Edit Mode Expansion

- [ ] Add editable fields for: Manifest #, Return Manifest Date, Transporter (select), Receiving Facility (select), Container Location (select filtered by site), Waste Category (select), Treatment Method (select), Service Frequency (select), Profile (select)
- [ ] Cost section: editable number inputs for MPS and Customer cost fields
- [ ] Auto-calculate Disposal Fee Total = Fee Each x Qty

### 3.3 Shipment List — Additional Columns

- [ ] Add optional columns (via ColumnPicker): Waste Category, Treatment Method, Manifest #, Receiving Facility, Transporter, MPS Cost Total, Customer Cost Total, Margin
- [ ] Default visible: Date, Site, Client, Waste Type, Weight, Status
- [ ] Additional columns togglable via ColumnPicker

### 3.4 Shipment Filters — Expansion

- [ ] Add filters: Status (multi-select), Waste Category (multi-select), Treatment Method (multi-select), Manifest # (text search)

---

## Sprint 4: New Shipment Entry Enhancement

**Goal:** Expand the AG Grid new shipment entry to include enterprise fields.

### 4.1 Grid Column Expansion

- [ ] Add columns: Container Location (select, filtered by selected site), Manifest # (text), Receiving Facility (select), Transporter (select), Waste Category (select), Treatment Method (select), Service Frequency (select), Profile # (text), Container Type (select)
- [ ] Column groups in AG Grid: "Basic" (existing), "Classification" (waste category, treatment, codes), "Logistics" (facility, transporter, manifest)
- [ ] Default show "Basic" columns, others togglable via column picker button

### 4.2 Cost Quick-Entry (Optional Section)

- [ ] Add collapsible "Cost Entry" section below grid
- [ ] Per-row cost fields: MPS Haul, MPS Disposal Each, MPS Fuel, MPS Env, MPS Other, Customer Haul, Customer Disposal Each, Customer Fuel, Customer Env, Customer Other
- [ ] Or: toggle to show cost columns inline in the grid

### 4.3 Validation Enhancement

- [ ] Validate manifest number uniqueness
- [ ] Validate receiving facility is required when waste category is Hazardous
- [ ] Validate transporter is required when receiving facility is set

---

## Sprint 5: Reference Data Admin Pages

**Goal:** Build read-only/manageable admin pages for regulatory code tables.

### 5.1 Reference Codes Page (`/admin/reference-codes`)

- [ ] New route with tabbed interface (Tabs component)
- [ ] Tabs: Source Codes, Form Codes, Treatment Codes, EWC Codes
- [ ] Each tab: searchable DataTable with Code + Description columns
- [ ] Add/Edit/Delete CRUD for each code table
- [ ] Add nav item

### 5.2 Units Page (`/admin/units`)

- [ ] CrudTable: Unit Code, Unit Name, Family, Conversion to LB, Conversion to KG, Active
- [ ] Create/Edit form
- [ ] Add nav item

### 5.3 Service Frequencies Page (`/admin/service-frequencies`)

- [ ] CrudTable: Frequency Name, Sort Order, Active
- [ ] Create/Edit form
- [ ] Add nav item

### 5.4 Container Locations Page (sub-route of Sites)

- [ ] Accessible from Sites detail or as `/admin/container-locations`
- [ ] CrudTable: Location Name, Site, Code, Active
- [ ] Create/Edit form with Site (select)
- [ ] Filter by Site

---

## Execution Order & Priority

| Sprint | Focus | Pages Affected | Priority |
|--------|-------|---------------|----------|
| **Sprint 1** | Enrich existing admin pages | 4 pages (Vendors, Waste Types, Sites, Clients) | Critical |
| **Sprint 2** | New reference entity admin pages | 5 new pages + nav update | Critical |
| **Sprint 3** | Shipment detail + list expansion | Shipment drawer, list, filters | Critical |
| **Sprint 4** | New shipment entry enhancement | AG Grid entry page | High |
| **Sprint 5** | Reference code admin pages | 4 new pages (codes, units, frequencies, locations) | Medium |

**Total new pages:** 9
**Total enriched pages:** 5
**Total tasks:** ~60 checklist items
