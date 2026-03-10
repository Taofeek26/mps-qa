# MPS Dashboard Architecture And Design System

This document is the current source-of-truth for how the MPS dashboard is built, how data moves through it, and how the UI system should evolve. It is based on the code that exists today, not an aspirational target architecture.

## 1. Platform Summary

The MPS dashboard is a `Next.js 16` App Router application for waste shipment operations, reporting, admin data management, and internal design-system validation.

Today it behaves like a front-end product shell with a rich in-memory domain model:

- Authentication is client-side and stored in `localStorage`.
- Route protection is client-side and role-based.
- Shipment, client, vendor, user, and reference data all come from `lib/mock-data.ts`.
- Reports and dashboard analytics are computed in the browser from that shared shipment dataset.
- CSV, XLSX import, and PDF export are implemented directly in the UI layer.

There is currently no real API, server action, database adapter, or remote auth provider in the codebase.

## 2. Core Stack

| Area | Current implementation |
| --- | --- |
| App framework | `Next.js 16.1.6` with App Router |
| UI runtime | `React 19.2.3` |
| Language | `TypeScript` |
| Package manager | `pnpm` |
| Styling | `Tailwind CSS v4` with tokenized CSS variables in `app/globals.css` |
| UI primitives | Custom components built on `radix-ui` primitives |
| Motion | `motion` |
| URL state | `nuqs` |
| Tables | `@tanstack/react-table` and `ag-grid-react` |
| Charts | `recharts` |
| Forms | `react-hook-form` + `zod` |
| Icons | `lucide-react` |
| Notifications | `sonner` |
| Spreadsheet import/export | `xlsx` |
| PDF generation | `@react-pdf/renderer` |
| Date utilities | `date-fns` |

Available scripts:

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`

## 3. Route And Feature Map

### Route groups

- `app/(auth)` contains the login flow.
- `app/(app)` contains the protected dashboard shell and all authenticated pages.
- `app/design-system` contains the internal component and token showcase.
- `app/page.tsx` redirects `/` to `/dashboard`.

### Main product routes

- `/login`
- `/dashboard`
- `/shipments`
- `/shipments/new`
- `/reports`
- `/reports/builder`
- `/admin/clients`
- `/admin/vendors`
- `/admin/reference-data`
- `/admin/facilities`
- `/admin/users`
- `/admin/audit-log`

### Additional direct admin routes present in the repo

These coexist with the grouped admin pages and appear to support focused views or legacy shortcuts:

- `/admin/sites`
- `/admin/waste-types`
- `/admin/service-items`
- `/admin/containers`
- `/admin/profiles`
- `/admin/receiving-facilities`
- `/admin/transporters`

### Design-system routes

- `/design-system`
- `/design-system/warm`
- `/design-system/brand`

## 4. Runtime Composition

The runtime composition is:

1. `app/layout.tsx` loads fonts, global CSS, metadata, and applies `theme-brand` to the entire app.
2. `components/providers.tsx` wraps the app with:
   - `AuthProvider`
   - `NuqsAdapter`
   - Radix tooltip provider
   - global toaster
3. Authenticated routes render through `app/(app)/layout.tsx` into `components/layout/app-shell.tsx`.
4. `AppShell` provides:
   - desktop sidebar
   - mobile sidebar drawer
   - topbar
   - mobile tab bar
   - tab portal mount
   - `RouteGuard`
5. Individual pages consume shared lib functions and render feature-specific UI.

## 5. Navigation, Tabs, And Access Control

### Navigation

`lib/navigation.ts` is the navigation source-of-truth. It drives:

- sidebar groups
- command palette entries
- route labels
- breadcrumb labels
- default tab breadcrumb expansion for tabbed pages

### URL-synced tabs

`nuqs` is used where sub-navigation needs to survive refreshes and deep links:

- `/reports`
- `/admin/clients`
- `/admin/reference-data`
- `/admin/facilities`

### Portaled top-level tabs

`components/ui/tabs.tsx` is more than styling. Its `TabsList` can portal itself into a shell-level mount node so page tabs sit below the topbar in a consistent location across the app.

### Access control

Auth and access are entirely client-side today:

- `lib/auth-context.tsx` hydrates the selected user from `localStorage`
- `/login` lets a user choose a mock account and stores it locally
- `components/layout/route-guard.tsx` redirects unauthenticated users to `/login`
- admin access is enforced by route-prefix rules:
  - `/admin/audit-log` allows `admin` and `system_admin`
  - other `/admin/*` routes allow `system_admin`
- role filtering is also reused in nav rendering and command search

### Site-level scoping

`site_user` accounts are scoped by `assignedSiteIds`. That scope affects:

- shipment filtering
- dashboard metrics
- available sites in some controls
- practical visibility of data-driven features

## 6. Data Architecture

### 6.1 Current truth model

The effective data layer is `lib/mock-data.ts`.

It contains:

- seeded master data such as clients, sites, vendors, users, waste types, facilities, service items, containers, transporters, and profiles
- shipment generation logic
- audit log generation logic
- read/query functions
- in-memory mutation helpers
- a parallel normalized enterprise schema derived from the denormalized shipment view

There is no repository layer, API client layer, or backend adapter between pages and this module.

### 6.2 Data shapes

`lib/types.ts` defines the core domain:

- auth roles
- shipment statuses
- waste categories
- treatment methods
- shipment filters and pagination types
- denormalized `ShipmentView`
- normalized enterprise entities such as `ShipmentRecord`, `ShipmentLineItem`, `ShipmentCostInternal`, `ShipmentCostCustomer`, and `ShipmentExternalIdentifier`

### Important modeling choice

The app primarily renders denormalized `ShipmentView` rows because they are convenient for tables, charts, and reports. The file also generates normalized transaction records for structural alignment with a future real backend.

That means the codebase already contains two conceptual layers:

- a UI-friendly denormalized dataset
- a more enterprise-ready normalized schema

### 6.3 Data generation and derived records

`ALL_SHIPMENTS` is generated in-memory from templates, seeded reference data, and cost logic.

Each generated shipment includes:

- customer and site identifiers
- denormalized display names
- waste classification fields
- container and service details
- receiving facility details
- transporter details
- internal and customer cost breakdowns
- optional GM-specific fields

After that, the code builds normalized arrays:

- `SHIPMENT_RECORDS`
- `SHIPMENT_LINE_ITEMS`
- `SHIPMENT_COSTS_INTERNAL`
- `SHIPMENT_COSTS_CUSTOMER`
- `SHIPMENT_EXTERNAL_IDS`

This is useful because the dashboard already mirrors how a future transactional model could look, even though the app still reads from the denormalized side.

### 6.4 Reads, filtering, sorting, and pagination

Primary query entry points:

- `getShipments(filters, page, pageSize, sort)`
- `getAllShipments(filters)`
- `getShipmentById(id)`
- `getAuditLog(filters, page, pageSize)`
- entity getters like `getClients()`, `getSites()`, `getVendors()`, `getUsers()`, and reference-data getters

`getShipments()` supports:

- free-text search
- date range filtering
- site, client, vendor, and waste-type filtering
- status filtering
- waste-category filtering
- treatment-method filtering
- client-side sort and pagination

### 6.5 Mutations

The app mutates in-memory arrays directly through helpers like:

- `createClient`, `updateClient`, `deleteClient`
- `createVendor`, `updateVendor`, `deleteVendor`
- `createUser`, `updateUser`, `deleteUser`
- `updateShipment`, `deleteShipment`, `insertShipments`
- reference-data CRUD helpers for facilities, transporters, service items, containers, and profiles

Important limitation:

- these mutations are not durable across a full app restart
- auth state is the only thing persisted, via `localStorage`

## 7. How Data Flows Through The Product

The main application flow is:

```text
User -> App Router route -> Root layout -> Providers
-> AuthContext / Nuqs / Tooltip / Toaster
-> AppShell + RouteGuard
-> Page-level filters and local state
-> lib/mock-data.ts getters
-> Derived analytics from useMemo/report utils
-> UI surfaces (cards, tables, charts, drawers, exports)
```

### Dashboard flow

`/dashboard` pulls:

- shipments via `getAllShipments()` and `getShipments()`
- sites, clients, and vendors from `mock-data`
- audit log from `getAuditLog()`

Then it computes:

- KPI cards
- monthly revenue and cost trends
- waste distribution
- cost per ton
- regional performance
- vendor expiration heatmap
- recent shipments and recent activity

### Shipment list flow

`/shipments` reads filter state from the URL, merges it with role-based site scoping, then feeds those filters into `getShipments()`. The results drive:

- the TanStack table wrapper
- the export dialog
- the details drawer
- deletion flow

### New shipment flow

`/shipments/new` uses AG Grid for spreadsheet-like entry. Users can:

- type directly into the grid
- paste tabular data from Excel
- import `.xlsx`, `.xls`, or `.csv`
- validate row-level errors
- submit valid rows through `insertShipments()`

### Reports flow

`/reports` uses tab state in the URL and a shared report-filter pattern to derive filtered shipments, then each report tab computes its own analytics directly from that shared shipment subset.

### Report builder flow

`/reports/builder` works like this:

1. `use-report-builder.ts` holds report title, filters, sections, and filtered shipments.
2. `lib/report-builder-widgets.ts` defines the widget catalog and defaults.
3. `components/report-builder/widgets/index.tsx` maps widget types to render components.
4. `lib/report-builder-data.ts` computes widget datasets from shipments.
5. `pdf-export.ts` renders the assembled report with `@react-pdf/renderer`.

## 8. Feature Modules

### Dashboard

The dashboard is a high-level operational and executive surface with:

- KPI cards
- overview, analytics, and activity tabs
- chart-heavy summaries
- operational alerts
- recent shipment table
- audit activity feed

### Shipments

The shipment domain has two distinct experiences:

- review and manage existing shipments through a filterable table
- create shipments through a spreadsheet-style bulk-entry workflow

The list view is optimized for operational browsing. The new-entry view is optimized for throughput.

### Reports

The reports area currently includes these analytics surfaces:

- Waste Trends
- Cost Analysis
- Light Load
- Regulatory
- Operations
- Data Quality
- Vendor Intel
- Logistics
- Emissions

### Report Builder

The builder is a composable analytics workspace that lets users assemble a report from:

- KPI sections
- charts
- data tables
- notes blocks

It is intentionally desktop-only at the moment.

### Admin

The admin surface manages:

- clients and sites
- vendors
- waste and reference data
- facilities and transport
- users
- audit log

Much of this experience is standardized through `components/patterns/crud-table.tsx`, which combines:

- page header
- filter/search bar
- data table
- drawer-based forms
- row actions
- delete confirmation

### Design System

`/design-system` is a live showcase of:

- color swatches
- typography samples
- spacing and radius
- buttons
- badges
- cards
- headers
- forms
- feedback components
- overlays
- navigation patterns

It is a useful demo surface, but the actual token source-of-truth remains `app/globals.css`.

## 9. Shared UI Architecture

### `components/ui`

This is the core design-system layer. It contains reusable primitives and wrappers such as:

- buttons
- badges
- cards
- tabs
- dialogs and drawers
- forms and inputs
- pagination
- breadcrumbs
- toast
- command palette
- date pickers

### `components/layout`

This layer owns the application chrome:

- sidebar
- mobile sidebar
- topbar
- user menu
- notifications
- route guard
- mobile tab bar

### `components/charts`

This layer wraps Recharts into reusable dashboard/report-friendly components.

### `components/report-builder`

This layer contains widget rendering, preview, report toolbar, PDF primitives, and export plumbing.

### Dual table strategy

The product intentionally uses two table systems:

- `components/ui/data-table.tsx` for standard browse/sort/paginate flows
- `components/ui/ag-grid-wrapper.tsx` for dense editable grid workflows

That separation is correct for the current product shape because the use cases are different.

## 10. Design System Foundation

This section should be treated as the canonical design foundation moving forward.

### 10.1 Canonical source of truth

The real token system lives in `app/globals.css`.

The design-system pages are a live showroom, but some of their displayed swatch labels are demonstrative. Runtime theme values come from CSS variables, and the app currently boots with `theme-brand` at the `body` level.

### 10.2 Theme model

Three themes exist in code:

- Industrial baseline inside `@theme`
- Warm theme via `.theme-warm`
- Brand theme via `.theme-brand`

### Active production theme

The app currently defaults to `theme-brand`.

### Practical meaning

- Industrial defines the base semantic system and default tokens.
- Brand overrides the visual identity to align with MPS web branding.
- Warm is an alternate exploration theme for softer presentation.

### 10.3 Brand color foundation

These are the active brand theme anchors used by the app shell today.

### Primary

- `primary-700`: `#0E3B84`
- `primary-600`: `#134FB0`
- `primary-500`: `#1550C0`
- `primary-400`: `#1863DC`
- `primary-300`: `#2B7BB9`
- `primary-200`: `#91BDEB`
- `primary-100`: `#C8DEF5`
- `primary-50`: `#EBF2FC`

### Secondary

- `secondary-600`: `#008F70`
- `secondary-500`: `#00B38C`
- `secondary-400`: `#00C99D`
- `secondary-300`: `#4DD4AF`

### Neutral

- `gray-950`: `#111111`
- `gray-900`: `#1A1A1A`
- `gray-800`: `#333333`
- `gray-700`: `#4D4D4D`
- `gray-600`: `#666666`
- `gray-500`: `#757575`
- `gray-400`: `#999999`
- `gray-300`: `#BFBFBF`
- `gray-200`: `#E0E0E0`
- `gray-100`: `#F2F2F2`
- `gray-50`: `#F8F8F8`

### Semantic colors

These currently inherit from the industrial base and remain shared across themes:

- Success: `#2F6E4F`, `#3F8B65`, `#58A97F`, `#E2F5EB`
- Warning: `#A1661A`, `#C48124`, `#E1A341`, `#FDF3E0`
- Error: `#8B2F2F`, `#B04141`, `#D15B5B`, `#FDECEC`

### Surfaces and borders

- App background: `#F4F5F7`
- Card background: `#FFFFFF`
- Subtle surface: `#F5F5F5`
- Hover surface: `#EBEBEB`
- Default border: `#E0E0E0`
- Strong border: `#BFBFBF`
- Focus border and focus ring: `#1863DC`

### Navigation surfaces

- Sidebar background: `#FFFFFF`
- Topbar background: `#FFFFFF`

### Text

- Primary text: `#333333`
- Secondary text: `#666666`
- Muted text: `#757575`
- Inverse text: `#FFFFFF`

### 10.4 Typography

The app uses:

- `Inter` for the main interface
- `JetBrains Mono` for code, IDs, and dense numeric/data display

Current UI scale used across the product:

- H1: `24px`, bold, tight tracking
- H2: `18px`, bold
- Card title: `14px`, semibold
- Body: `14px`
- Small/help text: `12px`
- Data and identifiers: `14px` mono

Recommended rule:

- Keep prose and controls in `Inter`
- Use `JetBrains Mono` only for data that benefits from alignment or machine-like readability

### 10.5 Shape, spacing, and interaction

### Radius

- `--radius-sm`: `8px`
- `--radius-lg`: `16px`

### Spacing

The UI follows an 8-point mindset in practice, with common steps such as:

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`
- `40`
- `48`

### Focus treatment

`.focus-ring` applies a double-shadow focus state so focus remains visible on both white and tinted surfaces.

### 10.6 Component rules

### Buttons

Current variants:

- `primary`
- `secondary`
- `ghost`
- `destructive`
- `success`

Guidance:

- Use `primary` for the main page action
- Use `secondary` for important but non-primary actions
- Use `ghost` for low-emphasis shell and inline actions
- Use `destructive` only for irreversible actions

### Cards

Current card tiers:

- `default`
- `outlined`
- `subtle`

Guidance:

- `default` for core content blocks
- `outlined` for grouped but quieter content
- `subtle` for summary or secondary analytical panels

### Badges

Current badge variants:

- `neutral`
- `success`
- `warning`
- `error`
- `info`

Guidance:

- Use badges for statuses and categorical markers, not for long labels or primary navigation

### Tabs

Tabs are part of information architecture, not just component styling. For top-level pages, prefer the shared tab system so tabs can live consistently below the app topbar.

### 10.7 Data-dense design rules

Because this product is operations-heavy, the design system must support dense information without becoming visually noisy.

Rules that already exist in code and should remain:

- concise text styles
- strong use of muted headers in tables
- restrained borders
- white or subtle surfaces behind dense data
- compact badge treatments
- consistent empty states
- visible validation states

### AG Grid foundation

`.ag-theme-mps` aligns AG Grid with the token system:

- `13px` grid font size
- `40px` rows and headers
- semantic invalid-cell styling
- token-based hover, focus, and selected-row colors
- popup chrome stripped so custom editors own the experience

This is the right pattern for spreadsheet-grade workflows.

## 11. Architecture Connections Cheat Sheet

Use this when reasoning about changes:

- New protected page: add route under `app/(app)` and likely register it in `lib/navigation.ts`
- New admin experience: prefer reusing `components/patterns/crud-table.tsx`
- New standard table: use `components/ui/data-table.tsx`
- New bulk-edit grid: use `components/ui/ag-grid-wrapper.tsx`
- New report tab analytics: derive from filtered shipments and shared report helpers
- New report-builder section: add widget metadata, renderer mapping, and data logic
- New visual token: define it in `app/globals.css` before hard-coding values into components

## 12. Current Constraints And Gaps

These are important for future planning:

- No remote backend yet
- No persistent business data storage
- No API abstraction layer
- No server-side auth
- No React Query or equivalent async cache
- No backend authorization enforcement
- Report Builder is desktop-only
- Design-system demo pages are useful, but not the authoritative token layer

## 13. Recommended Source Of Truth Going Forward

If the team needs a single mental model:

- `app/globals.css` is the design-token authority
- `components/ui` is the component-system authority
- `lib/types.ts` is the domain-model authority
- `lib/mock-data.ts` is the current data-source authority
- `lib/navigation.ts` is the route-label and nav authority
- `docs/dashboard-architecture-and-design-system.md` is the system-overview authority
