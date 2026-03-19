# Bug: Audit Log Missing Actor and Meaningful Change Details

**Priority:** Medium
**Date:** March 19, 2026
**Status:** 🔴 PENDING FIX

---

## Problem 1: Actor Shows "System" Instead of User

When a shipment is created via `POST /shipments`, the audit log entry has `created_by: null` which the frontend renders as "System".

### ❌ CURRENT RESPONSE (Bug)

```json
{
  "id": "...",
  "entity_type": "shipment",
  "entity_id": "f515838b-...",
  "action": "create",
  "created_by": null,
  "created_at": "2026-03-19T..."
}
```

### ✅ EXPECTED RESPONSE

```json
{
  "id": "...",
  "entity_type": "shipment",
  "entity_id": "f515838b-...",
  "action": "create",
  "created_by": "user@company.com",
  "created_at": "2026-03-19T..."
}
```

---

## Bug vs Fix: Actor Extraction

### ❌ CURRENT CODE (Bug)

```python
def create_shipment(data):
    # ... create shipment ...

    # Audit log INSERT - no user extraction
    cursor.execute('''
        INSERT INTO audit_log (id, entity_type, entity_id, action, new_values, created_at, created_by)
        VALUES (%s, 'shipment', %s, 'CREATE', %s, %s, %s)
    ''', (audit_id, shipment_id, json.dumps(data), now, data.get('created_by')))
    # ↑ data.get('created_by') is None - not extracted from JWT!
```

### ✅ FIXED CODE

```python
def create_shipment(event, data):
    # Extract user from JWT token
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    jwt_claims = authorizer.get('jwt', {}).get('claims', {}) or authorizer.get('claims', {})
    user_email = jwt_claims.get('email', jwt_claims.get('sub', 'system'))

    # ... create shipment ...

    # Audit log INSERT - with user from JWT
    cursor.execute('''
        INSERT INTO audit_log (id, entity_type, entity_id, action, new_values, created_at, created_by)
        VALUES (%s, 'shipment', %s, 'CREATE', %s, %s, %s)
    ''', (audit_id, shipment_id, json.dumps(data), now, user_email))
    # ↑ user_email extracted from JWT!
```

---

## Problem 2: Change Details Are Unhelpful

The `new_values` field for a shipment create contains only IDs, not the actual data.

### ❌ CURRENT new_values (Bug)

```json
{"ids": ["f515838b-f50c-45eb-91ff-281a525fb30e"], "count": 1}
```

This tells the admin nothing about what was actually created.

### ✅ EXPECTED new_values

```json
{
  "customer_id": "cust-001",
  "customer_name": "General Motors",
  "site_id": "site-003",
  "site_name": "Detroit Assembly",
  "vendor_id": "vend-002",
  "vendor_name": "Clean Earth",
  "waste_type_id": "wtype-005",
  "shipment_date": "2026-03-19",
  "quantity": 4500,
  "quantity_unit": "lbs",
  "treatment_method": "Landfill",
  "status": "pending"
}
```

---

## Bug vs Fix: Meaningful new_values

### ❌ CURRENT CODE (Bug - bulk create)

```python
def create_shipments_bulk(shipments_data):
    # ... create shipments ...

    # Audit log only stores count and IDs
    cursor.execute('''
        INSERT INTO audit_log (id, entity_type, entity_id, action, new_values, created_at)
        VALUES (%s, 'shipment', %s, 'BULK_CREATE', %s, %s)
    ''', (audit_id, f"bulk-{len(created_ids)}",
          json.dumps({'count': len(created_ids), 'ids': created_ids}), now))
    # ↑ Only IDs, no actual shipment data!
```

### ✅ FIXED CODE

```python
def create_shipments_bulk(event, shipments_data):
    user_email = extract_user_from_jwt(event)
    created_records = []

    for data in shipments_data:
        # ... create shipment ...
        created_records.append({
            'id': shipment_id,
            'customer_name': data.get('customer_name'),
            'site_name': data.get('site_name'),
            'shipment_date': data.get('shipment_date'),
            'quantity': data.get('quantity'),
            'status': data.get('status'),
        })

    # Audit log with meaningful data
    cursor.execute('''
        INSERT INTO audit_log (id, entity_type, entity_id, action, new_values, created_at, created_by)
        VALUES (%s, 'shipment', %s, 'BULK_CREATE', %s, %s, %s)
    ''', (audit_id, f"bulk-{len(created_ids)}",
          json.dumps({'count': len(created_ids), 'records': created_records}), now, user_email))
    # ↑ Includes actual record data + user!
```

---

## Audit Log Requirements by Operation

| Operation | created_by | old_values | new_values |
|-----------|-----------|------------|------------|
| POST (create) | JWT user email | null | Full payload |
| PUT (update) | JWT user email | Previous values | Updated values |
| DELETE | JWT user email | Previous values | null |

---

## Helper Function to Add

```python
def extract_user_from_jwt(event):
    """Extract user email from JWT token in request context"""
    request_context = event.get('requestContext', {})
    authorizer = request_context.get('authorizer', {})
    jwt_claims = authorizer.get('jwt', {}).get('claims', {}) or authorizer.get('claims', {})
    return jwt_claims.get('email', jwt_claims.get('sub', 'system'))
```

---

## Files to Update

| File | Functions |
|------|-----------|
| `src/shipment-handler/app.py` | `create_shipment()`, `create_shipments_bulk()`, `update_shipment()`, `delete_shipment()` |
| `src/kpi-analytics/app.py` | All CRUD functions for safety incidents, inspections, training, surveys |
| `src/reference-data/app.py` | All CRUD functions |

## Affected Entities

- Shipments
- Customers
- Sites
- Vendors
- Waste Types
- Safety Incidents
- Inspection Records
- Safety Training
- Customer Surveys
- Users
