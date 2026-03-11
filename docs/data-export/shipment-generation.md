# Shipment Generation Algorithm

The app generates **120 shipments** from 18 templates. Here's how:

## Date Range
- **Start:** July 1, 2024
- **End:** February 28, 2025
- **Span:** ~243 days

## Generation Logic

```
for i = 0 to 119:
    template = templates[i % 18]          // cycles through 18 templates
    daysOffset = floor((i / 120) * 243) + (i % 7)   // spread + jitter
    shipDate = startDate + daysOffset days

    // Quantity variance: 0.70x to 1.29x
    qtyVariance = 0.7 + ((i * 17) % 60) / 100
    qty = round(template.qty * qtyVariance, 2)

    // Weight standardization
    standardizedLbs = qty * template.weightPerUnit
    standardizedKg = standardizedLbs / 2.2

    // Cost calculation
    mpsCost.disposalFeeTotal = template.mpsDisposalEach * qty
    customerCost.disposalFeeTotal = template.custDisposalEach * qty
    customerCost.rebate = template.custRebate * qtyVariance  (if > 0)

    // Manifest numbers
    if hazardous: "0{19928103 + i}FLE"
    else: "{410058 + i}"

    // Status rotation: submitted, submitted, submitted, submitted, pending
    status = ["submitted","submitted","submitted","submitted","pending"][i % 5]

    // Creator rotation: cycles through first 4 users
    createdBy = USERS[i % 4]
```

## ID Format
- Shipment IDs: `shp-0001` through `shp-0120`
- Zero-padded to 4 digits

## Miles From Facility (static per receiving facility index)
| Facility Index | Facility Name | Miles |
|---|---|---|
| 0 | Cheatham County Disposal | 12.3 |
| 1 | Kingsport Packaging | 281.5 |
| 2 | Safety Kleen Nashville | 26.9 |
| 3 | Republic Services #721 | 45.2 |
| 4 | Clearview Landfill | 85.7 |
| 5 | Heritage Thermal Services | 120.3 |
| 6 | Reworld Waste LLC | 200.1 |
| 7 | Veolia ES Technical Solutions | 150.6 |

## Notes Assignment
- Every 8th shipment (i % 8 == 0): "Scheduled pickup"
- Every 12th shipment (i % 12 == 0): "Emergency cleanup"
- Otherwise: no notes
