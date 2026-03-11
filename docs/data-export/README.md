# MPS Platform — Mock Data Export

All data currently used in the application, extracted from `lib/mock-data.ts` and `lib/reference-data.ts`.

## Entity Data (Business Objects)

| File | Records | Description |
|------|---------|-------------|
| [clients.csv](./clients.csv) | 4 | Customer companies (AO Smith, GM, Stellantis, Ford) |
| [sites.csv](./sites.csv) | 10 | Physical plant/facility locations per client |
| [vendors.csv](./vendors.csv) | 16 | Approved waste disposal/recycling vendors |
| [waste-types.csv](./waste-types.csv) | 30 | Waste stream definitions with classification codes |
| [users.csv](./users.csv) | 10 | Platform users with roles and site assignments |
| [receiving-facilities.csv](./receiving-facilities.csv) | 8 | Waste receiving/disposal facilities |
| [transporters.csv](./transporters.csv) | 8 | Waste hauling transporters (linked to vendors) |
| [receiving-companies.csv](./receiving-companies.csv) | 8 | Parent companies of receiving facilities |
| [profiles.csv](./profiles.csv) | 6 | Waste profiles linking customers to waste types |

## Normalized Reference Data

| File | Records | Description |
|------|---------|-------------|
| [container-locations.csv](./container-locations.csv) | 15 | Physical pickup locations within each site |
| [treatment-methods.csv](./treatment-methods.csv) | 9 | Waste treatment/disposal method definitions |
| [units.csv](./units.csv) | 9 | Units of measure with conversion factors |
| [containers.csv](./containers.csv) | 17 | Container type definitions with capacities |
| [service-frequencies.csv](./service-frequencies.csv) | 9 | Pickup frequency options |
| [report-definitions.csv](./report-definitions.csv) | 7 | Available report types |

## Regulatory Reference Codes

| File | Records | Description |
|------|---------|-------------|
| [source-codes-rcra.csv](./source-codes-rcra.csv) | 30 | RCRA Source Codes (G01-G77) |
| [form-codes.csv](./form-codes.csv) | 46 | Waste Form Codes (W001-W406) |
| [treatment-codes.csv](./treatment-codes.csv) | 32 | Hazardous Waste Treatment Codes (H010-H141) |
| [ewc-codes.csv](./ewc-codes.csv) | 41 | European Waste Catalogue codes |
| [tri-waste-codes.csv](./tri-waste-codes.csv) | 15 | TRI Waste Codes (GM-specific, M20-M99) |
| [container-types.csv](./container-types.csv) | 17 | Container type string values |
| [shipment-units.csv](./shipment-units.csv) | 10 | Valid shipment unit codes |

## Shipment Templates

| File | Records | Description |
|------|---------|-------------|
| [shipment-templates.csv](./shipment-templates.csv) | 18 | Templates used to generate 120 shipments |

The app generates **120 shipments** from the 18 templates, spread across Jul 2024 - Feb 2025. Each template cycles with quantity variance (0.7x-1.3x). See [shipment-generation.md](./shipment-generation.md) for the algorithm.
