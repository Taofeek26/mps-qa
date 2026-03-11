# Waste Shipment Data Analysis and Schema Design

## What I Extracted from the Actual Sheets

### 1) GM Workbook
**File:** `550781_MPS_Nov2025_Waste_Shipments.xlsx`

This is a spec / export format workbook, not the main operating data. It dictates that the system must eventually output the following fields:

* Plant ID
* Source
* Shipment Date
* Waste Stream / Approval ID
* Waste Name
* Quantity
* Units
* Management Method
* Final Disposition
* Number of Containers
* Container Type
* Document No / Manifest No
* Item Number
* Disposal Location Code
* TRI Waste Code
* PCB dates

**Conclusion:** Your product needs a canonical internal schema plus a customer export mapping layer.

---

### 2) Main MPS Workbook
**File:** `Waste Shipment and Summary Workbook.xlsx`

This is the real operating workbook. It contains:

* **Shipment Data Updated:** The main transaction dataset
* **Report List:** Report catalog
* **Selection Lists:** Dropdown reference values
* **Customer List:** Site master data
* **Approved Vendors:** Vendor master/compliance data
* **Source Codes**
* **Form Codes**
* **Hazardous Waste Treatment Codes**
* **EWC Codes**

---

## The Most Important Finding

The shipment workbook is not just a shipment table. It mixes all of the following in one flat Excel sheet:

* Shipment facts
* Customer/site master data
* Receiving facility master data
* Transporter data
* Cost data
* Customer billing data
* Compliance codes
* Service metadata

**Conclusion:** The right move is full normalization, not just “put Excel into SQL”.

---

## What the Main Shipment Sheet Actually Contains

The main table has 54 columns grouped across these sections:

### Waste Shipment Data
* Byproduct / Service Name
* Container Location
* Date Shipped
* Manifest Number
* Return Manifest Date
* Unit
* Qty

### Waste Stream Information
* Weight in lbs per unit
* Standardized Volume in lbs
* Standardized Volume in kg
* Target Load Weight (lb)
* Waste Type
* Waste Codes
* Treatment Method
* Source Code
* Form Code
* Treatment Code
* EWC Number
* Container
* Service Frequency
* Profile Number

### Customer Site Data
* Customer
* Site
* Site Address
* City
* State
* Zip Code

### Receiving Facility Information
* Receiving Company
* Receiving Facility
* Miles from Facility
* Receiving Facility Address
* Receiving Facility City
* Receiving Facility State
* Receiving Facility Zip
* Receiving Facility EPA ID #

### Transporter
* Transporter

### MPS Cost
* Haul Charge
* Disposal / Recycling Fee Each
* Disposal Fee Total
* Fuel Fee
* Environmental Fee
* Rebate
* Other Fees

### Customer Cost
* Customer Haul Charge
* Customer Disposal / Recycling Fee Each
* Customer Disposal Fee Total
* Customer Fuel Fee
* Customer Environmental Fee
* Customer Rebate
* Customer Other Fees

### Additional Information
* Customer 1
* Customer 2
* Customer 3
* Notes

---

## Problems I Found in the Workbook

These are exactly the issues we need to design around:

**1. Over-flattened Data**
Excel stores everything in one giant row. The product should split this into customers, sites, service items, waste types, facilities, transporters, shipments, shipment line items, internal costs, and customer costs.

**2. Formula-driven Derived Fields**
Examples include Standardized Volume (lbs/kg) and Disposal Fee Totals. These should not remain “Excel formulas”. They should become backend-calculated values, SQL view calculations, or reporting measures.

**3. Placeholder Values (like N/A)**
Those should become proper NULLs where appropriate.

**4. Site/Facility/Address Duplication**
Those belong in master tables, not repeated per shipment row.

**5. Operational + Financial Data Mixed Together**
This must be separated for auditability and future billing logic.

---

## The Recommended Schema

Since you asked for a maximum, fully-fledged design, here is a full production schema:

### Master/Reference Tables
* `customers`
* `customer_sites`
* `service_items`
* `container_locations`
* `waste_types`
* `waste_codes`
* `treatment_methods`
* `source_codes`
* `form_codes`
* `treatment_codes`
* `ewc_codes`
* `units`
* `containers`
* `service_frequencies`
* `profiles`
* `receiving_companies`
* `receiving_facilities`
* `transporters`
* `vendors`
* `states`
* `report_definitions`

### Operational Tables
* `shipments`
* `shipment_line_items`
* `shipment_external_identifiers`
* `shipment_costs_internal`
* `shipment_costs_customer`
* `shipment_custom_fields`
* `shipment_attachments`
* `shipment_events`

### Security / Governance Tables
* `app_users`
* `roles`
* `user_roles`
* `user_site_access`
* `audit_logs`
* `import_batches`
* `import_batch_rows`

### Reporting / BI Layer (SQL Views)
* `vw_shipments_reporting`
* `vw_monthly_site_summary`
* `vw_waste_type_summary`
* `vw_vendor_facility_summary`
* `vw_data_quality_metrics`
* `vw_export_gm_gmr2`

---

## One Big Architectural Decision

Even though the current workbook is “one row = one shipment record”, I still recommend separating this into `shipments` + `shipment_line_items`.

**Why?**
Customer and compliance reporting often evolves into one shipment with multiple lines, multiple waste codes, or more detailed manifest structures. If you keep everything in one table, you’ll hit a wall later. 

**The safer enterprise structure:**
* `shipments` = parent transaction
* `shipment_line_items` = actual waste/service lines

---

## How the Excel Columns Map into the Schema

Here are a few key examples of the data mapping:

* **Byproduct / Service Name** → `service_items`
* **Container Location** → `container_locations`
* **Date Shipped** → `shipments.shipment_date`
* **Manifest Number** → `shipments.manifest_number`
* **Qty** → `shipment_line_items.quantity_value`
* **Unit** → `units`
* **Waste Type** → `waste_types`
* **Source Code** → `source_codes`
* **Form Code** → `form_codes`
* **Treatment Code** → `treatment_codes`
* **EWC Number** → `ewc_codes`
* **Customer / Site / Address** → `customers` + `customer_sites`
* **Receiving Company / Facility / EPA ID** → `receiving_companies` + `receiving_facilities`
* **Transporter** → `transporters`
* **MPS cost columns** → `shipment_costs_internal`
* **Customer cost columns** → `shipment_costs_customer`
* **Customer 1/2/3 and Notes** → `shipment_custom_fields` or shipment notes