# Bug: GET /shipments Ignores sort_by and sort_dir Parameters

**Priority:** High — sorting in the shipments table does not work
**Date:** March 19, 2026
**Status:** 🔴 PENDING FIX

---

## Problem

The frontend sends `sort_by` and `sort_dir` query parameters to `GET /shipments`, but the response order never changes. The data always comes back in the same default order regardless of sort parameters.

## Evidence

Frontend sends:
```
GET /shipments?page=1&limit=10&sort_by=shipment_date&sort_dir=desc
GET /shipments?page=1&limit=10&sort_by=shipment_date&sort_dir=asc
```

Both requests return shipments in the same order. The `sort_by` and `sort_dir` params are ignored.

---

## Bug vs Fix

### ❌ CURRENT CODE (Bug)

```python
def list_shipments(event):
    # ... filters setup ...

    # Query has hardcoded ORDER BY
    cursor.execute(f'''
        SELECT s.*, st.name AS site_name, ...
        FROM shipments s
        LEFT JOIN sites st ON s.site_id = st.id
        ...
        WHERE {where_clause}
        ORDER BY s.created_at DESC   # ← HARDCODED! Ignores sort params
        LIMIT %s OFFSET %s
    ''', params + [limit, offset])
```

### ✅ FIXED CODE

```python
def list_shipments(event):
    query_params = event.get('queryStringParameters') or {}

    # Whitelist of allowed sort columns (prevent SQL injection)
    ALLOWED_SORT_COLUMNS = {
        'shipment_date': 's.shipment_date',
        'customer_name': 'c.name',
        'site_name': 'st.name',
        'vendor_name': 'v.vendor_name',
        'waste_description': 'wt.name',
        'quantity': 's.quantity',
        'status': 's.status',
        'waste_category': 's.waste_category',
        'treatment_method': 's.treatment_method',
        'created_at': 's.created_at',
        'mps_total_cost': 's.mps_total_cost',
        'customer_total_charge': 's.customer_total_charge',
    }

    # Get sort params with defaults
    sort_by = query_params.get('sort_by', 'created_at')
    sort_dir = query_params.get('sort_dir', 'desc')

    # Validate against whitelist
    sort_column = ALLOWED_SORT_COLUMNS.get(sort_by, 's.created_at')
    sort_direction = 'ASC' if sort_dir.upper() == 'ASC' else 'DESC'

    # Use dynamic ORDER BY
    cursor.execute(f'''
        SELECT s.*, st.name AS site_name, ...
        FROM shipments s
        LEFT JOIN sites st ON s.site_id = st.id
        ...
        WHERE {where_clause}
        ORDER BY {sort_column} {sort_direction}   # ← DYNAMIC!
        LIMIT %s OFFSET %s
    ''', params + [limit, offset])
```

---

## Sort Fields Mapping

| Frontend Column | sort_by Value | SQL Column |
|----------------|---------------|------------|
| Date | `shipment_date` | `s.shipment_date` |
| Client | `customer_name` | `c.name` |
| Site | `site_name` | `st.name` |
| Vendor | `vendor_name` | `v.vendor_name` |
| Waste Type | `waste_description` | `wt.name` |
| Weight | `quantity` | `s.quantity` |
| Status | `status` | `s.status` |
| Category | `waste_category` | `s.waste_category` |
| Treatment | `treatment_method` | `s.treatment_method` |

---

## Impact

- Shipments table cannot be sorted by any column
- Default order appears to be insertion order, not by date
- Users cannot find recent or specific shipments efficiently

## Files to Update

| File | Function |
|------|----------|
| `src/shipment-handler/app.py` | `list_shipments()` |

## Also Check

Same issue may affect:
- `GET /vendors`
- `GET /customers`
- `GET /sites`
- `GET /waste-types`
- `GET /audit-log`
