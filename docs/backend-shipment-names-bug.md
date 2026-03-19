# Bug: GET /shipments Returns Null Names for Newly Created Shipments

**Priority:** High — shipment list table shows blank Site, Client, and Vendor columns
**Date:** March 19, 2026

## Problem

When shipments are created via `POST /shipments`, the `GET /shipments` list endpoint returns `null` for all denormalized name fields:

```json
{
  "id": "8d297e4c-16e5-4c26-b215-9b9add01209f",
  "site_id": "site-001",
  "site_name": null,
  "customer_id": "cust-002",
  "customer_name": null,
  "vendor_id": "vend-006",
  "vendor_name": null
}
```

The IDs are correct and reference valid records. The old seed data has names populated, but all newly created shipments have `null` names.

## Root Cause

The `GET /shipments` SQL query likely stores `site_name`, `customer_name`, `vendor_name` as columns on the shipments table (denormalized). The `POST /shipments` handler only inserts the IDs — it doesn't look up and store the names.

## Fix Options

**Option A (Recommended): JOIN on read**

Change the `GET /shipments` query to JOIN against the related tables:

```sql
SELECT
  s.*,
  st.name AS site_name,
  c.name AS customer_name,
  v.vendor_name AS vendor_name
FROM shipments s
LEFT JOIN sites st ON s.site_id = st.id
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN vendors v ON s.vendor_id = v.id
```

This is the correct approach — names are always fresh and consistent.

**Option B: Denormalize on write**

In the `POST /shipments` handler, look up the names before inserting:

```python
site = get_site(site_id)
customer = get_customer(customer_id)
vendor = get_vendor(vendor_id)
# Then INSERT with site_name=site.name, customer_name=customer.name, etc.
```

This is faster on read but creates stale data if a site/customer/vendor name changes.

## Affected Fields

All of these are `null` on newly created shipments:

| Field | Should Come From |
|-------|-----------------|
| `site_name` | `sites.name` WHERE `sites.id = shipments.site_id` |
| `customer_name` | `customers.name` WHERE `customers.id = shipments.customer_id` |
| `vendor_name` | `vendors.vendor_name` WHERE `vendors.id = shipments.vendor_id` |
| `waste_description` | `waste_types.name` WHERE `waste_types.id = shipments.waste_type_id` |
| `carrier_name` | `transporters.transporter_name` WHERE `transporters.id = shipments.transporter_id` |
| `facility_name` | `receiving_facilities.facility_name` WHERE `receiving_facilities.id = shipments.receiving_facility_id` |

## Impact

- Shipment list table shows blank cells for Site, Client, Vendor columns
- Dashboard charts that group by name (waste type, vendor, site) miss these shipments
- Reports show incomplete data
