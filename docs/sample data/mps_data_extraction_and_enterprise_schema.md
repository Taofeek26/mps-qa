# MPS Data Extraction and Enterprise Schema Design

> This document is based on the actual NDA-protected workbooks received from MPS. It inventories all sheets, extracts the operational structure, identifies data-model issues, and proposes a full production schema for the complete product (not a demo).

---

# 1) Files Received

## 1.1 GM specification workbook
**File:** `550781_MPS_Nov2025_Waste_Shipments.xlsx`

This workbook is a **client/export specification**, not the internal operating workbook. It defines the required structure for the GM waste transaction report and confirms that the product must support **customer-specific compliance/report exports**.

### GM-required fields observed
- PLANT ID
- SOURCE
- SHIPMENT DATE
- Waste Stream or Approval ID
- WASTE NAME
- QUANTITY
- UNITS
- MANAGEMENT METHOD
- FINAL DISPOSITION
- NUMBER OF CONTAINERS
- CONTAINER TYPE
- DOCUMENT NO.
- MANIFEST NO.
- ITEM NUMBER
- DISPOSAL LOCATION CODE
- TRI WASTE CODE
- PCB REMOVAL DATE
- PCB DESTRUCTION DATE

### Product implication
The platform must support:
- customer-specific export templates
- a canonical internal schema that can map into external reporting schemas like GM/GMR2
- compliance code reference tables

---

## 1.2 MPS operational workbook
**File:** `Waste Shipment and Summary Workbook.xlsx`

### Sheets detected
1. `Shipment Data Updated`
2. `Report List`
3. `Selection Lists`
4. `Customer List`
5. `Approved Vendors`
6. `Source Codes`
7. `Form Codes`
8. `Hazardous Waste Treatment Codes`
9. `EWC Codes`

This workbook contains the real operating model.

---

# 2) Sheet-by-Sheet Extraction

## 2.1 Shipment Data Updated
This is the **main transaction table**.

- Table name in workbook: `WasteShipmentData`
- Workbook table range: `A2:BB183`
- Data rows populated: **181**
- Columns: **54**

### Section groups in the sheet
- Waste Shipment Data
- Waste Stream Information
- Customer Site Data
- Receiving Facility Information
- Transporter
- MPS Cost
- Customer Cost
- Additional Information

### Exact extracted columns

#### Waste Shipment Data
1. Byproduct / Service Name
2. Container Location
3. Date Shipped
4. Manifest Number
5. Return Manifest Date
6. Unit
7. Qty

#### Waste Stream Information
8. Weight in lbs per unit
9. Standardized Volume in lbs
10. Standardized Volume in kg
11. Target Load Weight (lb)
12. Waste Type
13. Waste Codes
14. Treatment Method
15. Source Code
16. Form Code
17. Treatment Code
18. EWC Number
19. Container
20. Service Frequency
21. Profile Number

#### Customer Site Data
22. Customer
23. Site
24. Site Address
25. City
26. State
27. Zip Code

#### Receiving Facility Information
28. Receiving Company
29. Receiving Facility
30. Miles from Facility
31. Receiving Facility Address
32. Receiving Facility City
33. Receiving Facility State
34. Receiving Facility Zip
35. Receiving Facility EPA ID #

#### Transporter
36. Transporter

#### MPS Cost
37. Haul Charge
38. Disposal / Recycling Fee Each
39. Disposal Fee Total
40. Fuel Fee
41. Environmental Fee
42. Rebate
43. Other Fees

#### Customer Cost
44. Customer Haul Charge
45. Customer Disposal / Recycling Fee Each
46. Customer Disposal Fee Total
47. Customer Fuel Fee
48. Customer Environmental Fee
49. Customer Rebate
50. Customer Other Fees

#### Additional Information
51. Customer 1
52. Customer 2
53. Customer 3
54. Notes

### Observed population notes
- `Customer 1`, `Customer 2`, `Customer 3`, `Notes` are empty in the supplied data sample.
- Several columns are formula-driven in Excel:
  - Standardized Volume in lbs
  - Standardized Volume in kg
  - Disposal Fee Total
  - Customer Disposal Fee Total
  - some rebate / target weight formulas

### Real meaning of a row
Each row represents one **waste shipment transaction / service event** tied to:
- one customer site
- one service/byproduct/waste stream
- one receiving facility
- optionally one transporter
- one set of MPS internal cost values
- one set of customer-facing billable values

---

## 2.2 Report List
This is a catalog of supported report types.

### Extracted reports
- Waste Trends
- Cost Analysis
- Green House Gas Emission Report
- Light Load Report
- Biennial Hazardous Waste Report
- GEM Report (Ford waste report)
- GMR2 Report (GM Waste Report)

### Product implication
The platform should model reports as configurable artifacts rather than hardcoded exports.

---

## 2.3 Selection Lists
This sheet defines many of the UI drop-down reference lists.

### Extracted selection domains
- Byproduct / Service Name (**30 values**)
- Waste Type (**12 values**)
- Treatment Method (**8 values**)
- Unit (**9 values**)
- Container (**15 values**)
- Service Frequency (**9 values**)
- Site (**empty in supplied workbook**)
- State (**50 values**)
- Receiving Company (**5 values**)
- Receiving Facility (**5 values**)
- Receiving State (**50 values**)
- Transporter (**7 values**)
- Source Codes (**52 values**)
- Form Codes (**50 values**)
- Treatment Codes (**27 values**)
- EWC Code (**842 values**)

### Product implication
These should become governed reference tables, not static Excel validation lists.

---

## 2.4 Customer List
Workbook table name: `Table4`

### Extracted columns
- Cust & Site (formula-generated concatenation)
- Customer
- Cust Site
- Address
- City
- State
- Zip Code

### Product implication
This is a customer-site master and should feed the `sites` dimension.

---

## 2.5 Approved Vendors
Workbook table name: `Vendor_Table`

### Extracted columns
- Vendor ID
- Vendor Name
- Status
- DBE
- Commodities (1)
- Commodities (2)
- Risk Level
- Supplier Form
- Date Entered
- Date Reviewed
- Expiration Date
- Reviewed
- Vendor Status

### Product implication
This is a vendor governance master and should become a vendor table plus review/compliance metadata.

---

## 2.6 Source Codes
Columns:
- Code
- Description

## 2.7 Form Codes
Columns:
- Code
- Description

## 2.8 Hazardous Waste Treatment Codes
Columns:
- Code
- Description

## 2.9 EWC Codes
Columns:
- Code
- Description

### Product implication for 2.6–2.9
These are canonical regulatory / classification reference tables and must be modeled as independent dimensions with room for versioning.

---

# 3) Core Data Issues Identified

## 3.1 The shipment sheet is over-flattened
The `Shipment Data Updated` sheet mixes:
- transaction facts
- site master data
- receiving facility master data
- vendor/transporter references
- cost facts
- customer charge facts
- classification codes

This is acceptable in Excel but not in a production relational system.

## 3.2 Derived values are stored as workbook formulas
Examples:
- Standardized Volume in lbs = Qty × Weight in lbs per unit
- Standardized Volume in kg = lbs / 2.2
- disposal totals = rate × qty

These should be handled as:
- persisted calculated columns only if absolutely necessary, or preferably
- SQL views / application calculations / BI measures

## 3.3 Master data is duplicated on every shipment row
Customer site address and receiving facility metadata repeat on every transaction.
This should be normalized into dimensions.

## 3.4 Costing is mixed with operations
Operational shipment facts and pricing/billing facts should be separated for clarity, auditability, and future billing workflows.

## 3.5 Placeholder values are used in place of nullability semantics
Examples in data:
- `N/A`
- zero-valued fees

In the product, these should be normalized into:
- NULL where truly unknown / not applicable
- real zero only where a monetary charge is explicitly 0

## 3.6 Some reference domains exist in multiple places
Examples:
- receiving companies / facilities appear both in selection lists and transactions
- sites appear in customer list and transaction rows

Need governed master tables with surrogate keys and unique constraints.

---

# 4) Enterprise Data Architecture Recommendation

The product should use **four layers**:

## 4.1 Reference / master data layer
Governs customers, sites, vendors, facilities, codes, etc.

## 4.2 Transaction / operational layer
Stores shipments, shipment services, charges, and audit history.

## 4.3 Reporting / analytics layer
Curated SQL views / marts for Power BI and customer exports.

## 4.4 Integration / template layer
Customer-specific export schemas (GM, Ford, biennial hazardous reports, etc.)

---

# 5) Proposed Full Production Schema

## 5.1 Master Data / Reference Tables

### customers
- id (uuid, pk)
- customer_code (varchar, unique, nullable)
- customer_name (varchar, not null)
- status (varchar)
- created_at
- updated_at

### customer_sites
- id (uuid, pk)
- customer_id (fk -> customers)
- site_code (varchar, unique within customer, nullable)
- site_name (varchar, not null)
- address_line_1 (varchar)
- address_line_2 (varchar)
- city (varchar)
- state_code (varchar)
- postal_code (varchar)
- country_code (varchar, default 'US')
- active_flag (bit)
- created_at
- updated_at

### service_items
(From Byproduct / Service Name)
- id (uuid, pk)
- service_name (varchar, unique)
- description (varchar)
- default_waste_type_id (fk nullable)
- active_flag (bit)
- created_at
- updated_at

### container_locations
- id (uuid, pk)
- site_id (fk -> customer_sites)
- location_name (varchar)
- location_code (varchar nullable)
- active_flag (bit)
- created_at
- updated_at

### waste_types
- id (uuid, pk)
- waste_type_name (varchar, unique)
- hazardous_flag (bit, nullable)
- category (varchar nullable)
- active_flag (bit)
- created_at
- updated_at

### waste_codes
(Freeform / external classification; currently a simple field in workbook)
- id (uuid, pk)
- code_value (varchar, unique)
- code_system (varchar nullable)
- description (varchar nullable)
- active_flag (bit)

### treatment_methods
- id (uuid, pk)
- treatment_method_name (varchar, unique)
- description (varchar nullable)
- active_flag (bit)

### source_codes
- id (uuid, pk)
- code (varchar, unique)
- description (varchar)
- source_family (varchar nullable)
- active_flag (bit)

### form_codes
- id (uuid, pk)
- code (varchar, unique)
- description (varchar)
- active_flag (bit)

### treatment_codes
- id (uuid, pk)
- code (varchar, unique)
- description (varchar)
- active_flag (bit)

### ewc_codes
- id (uuid, pk)
- code (varchar, unique)
- description (varchar)
- hazardous_flag (bit nullable)
- active_flag (bit)

### units
- id (uuid, pk)
- unit_code (varchar, unique)
- unit_name (varchar)
- unit_family (varchar)  -- weight, volume, count, container, service
- conversion_to_lb_factor (decimal(18,6), nullable)
- conversion_to_kg_factor (decimal(18,6), nullable)
- active_flag (bit)

### containers
- id (uuid, pk)
- container_name (varchar, unique)
- container_family (varchar nullable)
- nominal_capacity_value (decimal(18,4), nullable)
- nominal_capacity_unit_id (fk -> units, nullable)
- active_flag (bit)

### service_frequencies
- id (uuid, pk)
- frequency_name (varchar, unique)
- sort_order (int)
- active_flag (bit)

### profiles
(Profile Number)
- id (uuid, pk)
- profile_number (varchar, unique)
- customer_id (fk -> customers, nullable)
- waste_type_id (fk -> waste_types, nullable)
- active_flag (bit)
- created_at
- updated_at

### receiving_companies
- id (uuid, pk)
- company_name (varchar, unique)
- active_flag (bit)

### receiving_facilities
- id (uuid, pk)
- receiving_company_id (fk -> receiving_companies)
- facility_name (varchar, not null)
- address_line_1 (varchar)
- address_line_2 (varchar)
- city (varchar)
- state_code (varchar)
- postal_code (varchar)
- country_code (varchar default 'US')
- epa_id_number (varchar nullable)
- active_flag (bit)
- created_at
- updated_at
- unique(receiving_company_id, facility_name, city, state_code)

### transporters
- id (uuid, pk)
- transporter_name (varchar, unique)
- vendor_id (fk -> vendors, nullable)
- active_flag (bit)
- created_at
- updated_at

### vendors
(From Approved Vendors)
- id (uuid, pk)
- vendor_external_id (varchar, unique)
- vendor_name (varchar, not null)
- onboarding_status (varchar)
- dbe_flag (bit nullable)
- commodity_1 (varchar nullable)
- commodity_2 (varchar nullable)
- risk_level (varchar nullable)
- supplier_form (varchar nullable)
- date_entered (date nullable)
- date_reviewed (date nullable)
- expiration_date (date nullable)
- reviewed_by (varchar nullable)
- vendor_status (varchar nullable)
- active_flag (bit)
- created_at
- updated_at

### states
- state_code (varchar(2), pk)
- state_name (varchar)
- country_code (varchar)

### report_definitions
- id (uuid, pk)
- report_name (varchar, unique)
- report_type (varchar)
- export_template_code (varchar nullable)
- active_flag (bit)
- created_at
- updated_at

---

## 5.2 Operational / Transaction Tables

### shipments
This is the core operational transaction table.

- id (uuid, pk)
- shipment_number (varchar nullable)  -- internal if introduced later
- customer_id (fk -> customers, not null)
- site_id (fk -> customer_sites, not null)
- service_item_id (fk -> service_items, not null)
- container_location_id (fk -> container_locations, nullable)
- shipment_date (date, not null)
- manifest_number (varchar, nullable)
- return_manifest_date (date, nullable)
- profile_id (fk -> profiles, nullable)
- transporter_id (fk -> transporters, nullable)
- receiving_facility_id (fk -> receiving_facilities, nullable)
- miles_to_facility (decimal(18,4), nullable)
- notes (text nullable)
- imported_from_workbook_flag (bit default 0)
- source_workbook_name (varchar nullable)
- source_row_number (int nullable)
- created_by_user_id (fk -> app_users, nullable)
- created_at
- updated_at
- deleted_at (soft delete)

### shipment_line_items
A shipment may eventually need more than one line item for compliance/customer exports. Even if the current workbook is one-row-per-line-item, modeling line items now prevents future rework.

- id (uuid, pk)
- shipment_id (fk -> shipments, not null)
- line_number (int, not null default 1)
- unit_id (fk -> units, not null)
- quantity_value (decimal(18,4), not null)
- weight_lb_per_unit (decimal(18,4), nullable)
- standardized_weight_lb (decimal(18,4), nullable)
- standardized_weight_kg (decimal(18,4), nullable)
- target_load_weight_lb (decimal(18,4), nullable)
- waste_type_id (fk -> waste_types, nullable)
- waste_code_id (fk -> waste_codes, nullable)
- treatment_method_id (fk -> treatment_methods, nullable)
- source_code_id (fk -> source_codes, nullable)
- form_code_id (fk -> form_codes, nullable)
- treatment_code_id (fk -> treatment_codes, nullable)
- ewc_code_id (fk -> ewc_codes, nullable)
- container_id (fk -> containers, nullable)
- service_frequency_id (fk -> service_frequencies, nullable)
- created_at
- updated_at
- unique(shipment_id, line_number)

### shipment_external_identifiers
For supporting customer-specific fields like document number / item number / disposal location code / approval IDs.

- id (uuid, pk)
- shipment_id (fk -> shipments)
- identifier_type (varchar)  -- manifest_no, document_no, approval_id, gm_item_no, disposal_location_code
- identifier_value (varchar)
- source_system (varchar nullable)
- created_at
- unique(shipment_id, identifier_type, identifier_value)

### shipment_costs_internal
(MPS-side cost model)
- id (uuid, pk)
- shipment_id (fk -> shipments, unique)
- haul_charge (decimal(18,4), nullable)
- disposal_recycling_fee_each (decimal(18,4), nullable)
- disposal_fee_total (decimal(18,4), nullable)
- fuel_fee (decimal(18,4), nullable)
- environmental_fee (decimal(18,4), nullable)
- rebate_amount (decimal(18,4), nullable)
- other_fees (decimal(18,4), nullable)
- currency_code (varchar(3), default 'USD')
- created_at
- updated_at

### shipment_costs_customer
(Customer-billable model)
- id (uuid, pk)
- shipment_id (fk -> shipments, unique)
- haul_charge (decimal(18,4), nullable)
- disposal_recycling_fee_each (decimal(18,4), nullable)
- disposal_fee_total (decimal(18,4), nullable)
- fuel_fee (decimal(18,4), nullable)
- environmental_fee (decimal(18,4), nullable)
- rebate_amount (decimal(18,4), nullable)
- other_fees (decimal(18,4), nullable)
- currency_code (varchar(3), default 'USD')
- created_at
- updated_at

### shipment_custom_fields
To hold future values like Customer 1/2/3 and any client-specific custom fields.
- id (uuid, pk)
- shipment_id (fk -> shipments)
- field_key (varchar)
- field_value_text (varchar nullable)
- field_value_numeric (decimal(18,4), nullable)
- field_value_date (date, nullable)
- created_at
- updated_at
- unique(shipment_id, field_key)

### shipment_attachments
(for manifests / documents later)
- id (uuid, pk)
- shipment_id (fk -> shipments)
- file_name (varchar)
- file_url_or_blob_key (varchar)
- document_type (varchar)
- uploaded_by_user_id (fk -> app_users)
- uploaded_at

### shipment_events
Operational lifecycle / timeline events.
- id (uuid, pk)
- shipment_id (fk -> shipments)
- event_type (varchar)
- event_timestamp (datetimeoffset)
- actor_user_id (fk -> app_users, nullable)
- details_json (nvarchar(max) / json)

---

## 5.3 Security / Admin / Governance Tables

### app_users
- id (uuid, pk)
- entra_object_id (varchar unique)
- email (varchar unique)
- display_name (varchar)
- active_flag (bit)
- created_at
- updated_at

### roles
- id (uuid, pk)
- role_code (varchar unique)
- role_name (varchar)

### user_roles
- user_id (fk -> app_users)
- role_id (fk -> roles)
- created_at
- primary key(user_id, role_id)

### user_site_access
- user_id (fk -> app_users)
- site_id (fk -> customer_sites)
- created_at
- primary key(user_id, site_id)

### audit_logs
- id (uuid, pk)
- actor_user_id (fk -> app_users, nullable)
- action_type (varchar)
- entity_type (varchar)
- entity_id (uuid nullable)
- old_values_json (nvarchar(max) / json nullable)
- new_values_json (nvarchar(max) / json nullable)
- created_at

### import_batches
- id (uuid, pk)
- source_file_name (varchar)
- import_started_at
- import_completed_at
- imported_by_user_id (fk -> app_users, nullable)
- row_count_total (int)
- row_count_inserted (int)
- row_count_failed (int)
- status (varchar)
- notes (varchar nullable)

### import_batch_rows
- id (uuid, pk)
- import_batch_id (fk -> import_batches)
- source_row_number (int)
- raw_payload_json (nvarchar(max) / json)
- status (varchar)
- validation_errors_json (nvarchar(max) / json nullable)
- shipment_id (fk -> shipments nullable)

---

## 5.4 Reporting / Analytics Layer

These should be implemented as SQL views / marts.

### vw_shipments_reporting
Flattened reporting view for Power BI and ad hoc reporting.
Includes:
- shipment_date
- customer_name
- site_name
- service_name
- waste_type_name
- quantity
- unit
- standardized_weight_lb
- standardized_weight_kg
- receiving_company
- receiving_facility
- transporter_name
- internal_cost_total
- customer_cost_total
- margin_amount
- margin_pct

### vw_monthly_site_summary
Grouped by month/site:
- month_start
- customer
n- site
- shipment_count
- total_weight_lb
- total_weight_kg
- internal_total_cost
- customer_total_cost
- margin_amount

### vw_waste_type_summary
Grouped by waste type and period.

### vw_vendor_facility_summary
Grouped by receiving company/facility.

### vw_data_quality_metrics
- missing codes count
- null transporter count
- n/a placeholder count
- duplicate manifest candidates
- invalid return manifest dates

### vw_export_gm_gmr2
Customer-specific export projection aligned to GM template fields.

---

# 6) Exact Column-to-Schema Mapping

## Shipment Data Updated → target schema

| Excel Column | Target Table | Target Column | Notes |
|---|---|---|---|
| Byproduct / Service Name | service_items | service_name | normalized master |
| Container Location | container_locations | location_name | tied to site |
| Date Shipped | shipments | shipment_date | required |
| Manifest Number | shipments or shipment_external_identifiers | manifest_number | preserve as text |
| Return Manifest Date | shipments | return_manifest_date | nullable |
| Unit | units / shipment_line_items | unit_id | controlled reference |
| Qty | shipment_line_items | quantity_value | decimal |
| Weight in lbs per unit | shipment_line_items | weight_lb_per_unit | numeric |
| Standardized Volume in lbs | shipment_line_items | standardized_weight_lb | derived / may be persisted on import for audit |
| Standardized Volume in kg | shipment_line_items | standardized_weight_kg | derived |
| Target Load Weight (lb) | shipment_line_items | target_load_weight_lb | numeric |
| Waste Type | waste_types / shipment_line_items | waste_type_id | controlled reference |
| Waste Codes | waste_codes / shipment_line_items | waste_code_id | normalize N/A |
| Treatment Method | treatment_methods / shipment_line_items | treatment_method_id | controlled reference |
| Source Code | source_codes / shipment_line_items | source_code_id | controlled reference |
| Form Code | form_codes / shipment_line_items | form_code_id | controlled reference |
| Treatment Code | treatment_codes / shipment_line_items | treatment_code_id | controlled reference |
| EWC Number | ewc_codes / shipment_line_items | ewc_code_id | controlled reference |
| Container | containers / shipment_line_items | container_id | controlled reference |
| Service Frequency | service_frequencies / shipment_line_items | service_frequency_id | controlled reference |
| Profile Number | profiles / shipments | profile_id | normalize N/A |
| Customer | customers | customer_name | master |
| Site | customer_sites | site_name | master |
| Site Address | customer_sites | address_line_1 | master |
| City | customer_sites | city | master |
| State | customer_sites | state_code | master |
| Zip Code | customer_sites | postal_code | store as varchar |
| Receiving Company | receiving_companies | company_name | master |
| Receiving Facility | receiving_facilities | facility_name | master |
| Miles from Facility | shipments | miles_to_facility | numeric |
| Receiving Facility Address | receiving_facilities | address_line_1 | master |
| Receiving Facility City | receiving_facilities | city | master |
| Receiving Facility State | receiving_facilities | state_code | master |
| Receiving Facility Zip | receiving_facilities | postal_code | varchar |
| Receiving Facility EPA ID # | receiving_facilities | epa_id_number | nullable |
| Transporter | transporters | transporter_name | master |
| Haul Charge | shipment_costs_internal | haul_charge | numeric |
| Disposal / Recycling Fee Each | shipment_costs_internal | disposal_recycling_fee_each | numeric |
| Disposal Fee Total | shipment_costs_internal | disposal_fee_total | derived or persisted |
| Fuel Fee | shipment_costs_internal | fuel_fee | numeric |
| Environmental Fee | shipment_costs_internal | environmental_fee | numeric |
| Rebate | shipment_costs_internal | rebate_amount | numeric |
| Other Fees | shipment_costs_internal | other_fees | numeric |
| Customer Haul Charge | shipment_costs_customer | haul_charge | numeric |
| Customer Disposal / Recycling Fee Each | shipment_costs_customer | disposal_recycling_fee_each | numeric |
| Customer Disposal Fee Total | shipment_costs_customer | disposal_fee_total | numeric |
| Customer Fuel Fee | shipment_costs_customer | fuel_fee | numeric |
| Customer Environmental Fee | shipment_costs_customer | environmental_fee | numeric |
| Customer Rebate | shipment_costs_customer | rebate_amount | numeric |
| Customer Other Fees | shipment_costs_customer | other_fees | numeric |
| Customer 1 | shipment_custom_fields | field_key='customer_1' | optional custom |
| Customer 2 | shipment_custom_fields | field_key='customer_2' | optional custom |
| Customer 3 | shipment_custom_fields | field_key='customer_3' | optional custom |
| Notes | shipments or shipment_custom_fields | notes | optional |

---

# 7) Normalization and Data Cleaning Rules

## 7.1 Treat placeholder values as NULL when appropriate
Normalize:
- `N/A`
- empty string
- blank cells
into NULL for fields that are not actual codes.

## 7.2 Preserve raw import values
For auditability, every workbook import row should be stored in `import_batch_rows.raw_payload_json`.

## 7.3 Preserve numeric precision
Use `decimal(18,4)` for operational quantities / fees.

## 7.4 Preserve postal codes as text
Zip codes should be stored as `varchar`, not numeric.

## 7.5 Preserve manifest numbers as text
Even if numeric-looking, store as `varchar` to avoid formatting/leading-zero issues.

## 7.6 Derived fields strategy
Do **not** rely on frontend for calculations.
Prefer:
- compute on backend during import/update for persisted derived fields if needed operationally
- otherwise compute in SQL views for reporting

## 7.7 Allow one shipment to have multiple line items
Even though the sample workbook uses one row per line item, production compliance reporting often requires multi-line manifests. Model this now.

## 7.8 Separate internal cost from customer-billable cost
Never collapse them into one table; margin analysis depends on the distinction.

---

# 8) Product Implications from the Real Data

## 8.1 This is more than a basic shipment tracker
The workbook shows the product must support:
- operational transaction entry
- classification / compliance coding
- facility/vendor governance
- cost visibility
- customer-specific exports
- BI reporting

## 8.2 Full CRUD admin is required for real master data
Admin CRUD must support:
- customers
- sites
- service items
- containers
- waste types
- profiles
- receiving companies / facilities
- transporters
- vendors
- code tables

## 8.3 Customer-specific reporting templates should be a first-class module
Because GM/Ford/etc. have specific output structures.

---

# 9) Recommended Build Order from This Schema

## Phase A – Foundation
- Master/reference tables
- Shipments + shipment_line_items
- Costs tables
- Users / roles / site access
- Import pipeline + audit logs

## Phase B – Operational UX
- Shipment list
- Shipment details drawer
- Create / edit shipment flow
- Full CRUD admin for reference tables
- CSV/XLSX export

## Phase C – Reporting / Integration
- Reporting views
- GM/Ford export templates
- Power BI semantic layer
- Data quality dashboards

---

# 10) Final Recommendation

The supplied MPS data is absolutely enough to move from architecture to full product build.

The correct path is:
1. treat Excel as the legacy operational model
2. normalize all repeated entities into master tables
3. preserve shipment transactions as the system of record
4. split operational facts, costs, and compliance code dimensions
5. generate reporting views and customer-specific export templates from the canonical model

This schema gives you a production-ready foundation that supports:
- the current workbook structure
- future customer reporting templates
- Power BI analytics
- auditability
- full enterprise expansion across divisions

