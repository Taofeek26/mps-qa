# MPS Frontend Sprint Plan

> **Scope:** Frontend only — all data mocked/stubbed. Brand theme (`.theme-brand`) applied globally.
>
> **Stack:** Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS v4 + Radix UI + Motion
>
> **Spec docs:** `mps_enterprise_v_1_build_document`, `mps_enterprise_v_1_ui_hierarchy_and_component_system`

---

## Phase 1: App Shell & Routing Foundation

**Goal:** Establish the core app layout that every page lives inside — sidebar navigation, topbar, responsive shell, and route structure.

**New packages:** None (existing stack sufficient)

### Layout Components

- [x] **AppShell** layout component — sidebar + topbar + scrollable content area
  - 260px sidebar (collapsible to 72px icon-only mode)
  - 56px topbar
  - Content max-width 1440px, 24px padding (16px on mobile)
- [x] **SidebarNav** — collapsible sidebar with:
  - MPS logo at top
  - Section grouping: "Main" (Dashboard, Shipments) + "Admin" (Vendors, Sites, Waste Types, Clients, Users, Audit Log)
  - Active link highlight
  - Role-based visibility (admin sections hidden for site_user)
  - Brand-themed dark background (`bg-nav-sidebar`)
  - Collapse toggle button
- [x] **Topbar** — fixed top bar with:
  - Breadcrumbs (auto-generated from route)
  - Page actions slot (right side)
  - User avatar + dropdown menu
- [x] **UserMenu** dropdown — avatar, name, email, role badge, sign-out action
- [x] **Mobile responsive shell:**
  - Sidebar becomes off-canvas drawer (slide from left)
  - Hamburger toggle in topbar
  - Backdrop overlay when drawer open

### Route Structure

- [x] Set up route group `(app)` with AppShell layout
- [x] Set up route group `(auth)` for login (no shell)
- [x] Create route files:
  - `/` → redirect to `/dashboard`
  - `/login` — auth page (no sidebar)
  - `/dashboard` — overview
  - `/shipments` — list view
  - `/shipments/new` — multi-row grid entry
  - `/admin/vendors` — CRUD
  - `/admin/sites` — CRUD
  - `/admin/waste-types` — CRUD
  - `/admin/clients` — CRUD
  - `/admin/users` — roles & site assignments
  - `/admin/audit-log` — activity log
- [x] Create placeholder `page.tsx` for each route (PageHeader + EmptyState)
- [x] Route-based breadcrumb config (`lib/navigation.ts`)
- [x] Apply `.theme-brand` wrapper in root layout

### Deliverables

- Working app shell with sidebar navigation between all routes
- Every route renders a titled placeholder page
- Sidebar collapses on desktop, becomes drawer on mobile
- Brand theme active across entire app

---

## Phase 2: Missing Primitive Components

**Goal:** Build all reusable components from the UI hierarchy spec that don't yet exist in `components/ui/`.

**New packages:**
- `@tanstack/react-table` — headless data table primitives
- `ag-grid-community` + `ag-grid-react` — spreadsheet-like grid for data entry
- `react-hook-form` + `zod` + `@hookform/resolvers` — form handling + validation
- `nuqs` — type-safe URL search params state management

### Data Display Components

- [x] **DataTable** (`components/ui/data-table.tsx`)
  - Built on TanStack Table
  - Server-side pagination, sorting, column visibility
  - Row selection (checkbox column)
  - Loading state (skeleton rows)
  - Empty state (EmptyState component)
  - Error state (AlertBanner)
  - Responsive: horizontal scroll on mobile
- [x] **FilterBar** (`components/ui/filter-bar.tsx`)
  - Composable row: search TextInput + dropdown Selects + DateRangePicker + reset Button
  - Responsive: stacks vertically on mobile
- [x] **FilterChips** (`components/ui/filter-chips.tsx`)
  - Active filter pills with "x" remove action
  - "Clear all" action
- [x] **ColumnPicker** (`components/ui/column-picker.tsx`)
  - Popover with checkbox list for toggling visible columns
  - "Select all" / "Reset to default" actions
- [x] **KpiCard** (`components/ui/kpi-card.tsx`)
  - Small metric card: icon, value, label, optional trend (up/down %)
  - Variants: default, success, warning, error
- [x] **StatRow** (`components/ui/stat-row.tsx`)
  - Horizontal row of KPI metrics with dividers
  - Responsive: wraps to 2-col grid on mobile

### Form & Input Components

- [x] **DateRangePicker** (`components/ui/date-range-picker.tsx`)
  - Two-date selector (from/to) built on react-day-picker
  - Preset ranges: "Last 7 days", "Last 30 days", "This month", "Custom"
  - Popover calendar UI
- [x] **MultiSelect** (`components/ui/multi-select.tsx`)
  - Multi-value select with chips inside trigger
  - Searchable dropdown
  - Clear-all action
  - Built on Radix Popover + Checkbox
- [x] **InlineValidationMessage** (`components/ui/inline-validation.tsx`)
  - Field-level validation feedback (error/warning/success)
  - Icon + message text
  - Animated enter/exit

### Button Components

- [x] **SplitButton** (`components/ui/split-button.tsx`)
  - Primary action button + dropdown chevron for secondary actions
  - Built on Button + DropdownMenu
- [x] **ButtonGroup** (`components/ui/button-group.tsx`)
  - Grouped button row with connected borders
  - Active state for selected option

### Data Entry Grid

- [x] **AG Grid setup** — install, configure, brand-theme CSS
  - Custom cell colors matching design tokens
  - Header styling (bg-primary-700, text-inverse)
  - Focus ring matching `--color-focus-ring`
  - Row hover using `bg-hover`
  - Error cell styling (red border + bg-error-100)
- [x] **AGGridWrapper** (`components/ui/ag-grid-wrapper.tsx`)
  - Column schema-driven configuration
  - Paste-from-Excel clipboard support
  - Cell-level validation with error styling + tooltip
  - Row validation state mapping
  - Keyboard navigation (arrow keys, enter, tab)
  - Add/remove row controls
  - Row numbering

### Compound Patterns

- [x] **CrudTable** pattern (`components/patterns/crud-table.tsx`)
  - Composed from: DataTable + PageHeader + FilterBar + Dialog/Drawer
  - Props: columns, data, create/edit/delete handlers
  - Built-in search, filter, pagination
  - Create/Edit form in Drawer, Delete via ConfirmDialog
- [x] **AuditLogTable** (`components/patterns/audit-log-table.tsx`)
  - Specialized DataTable for audit entries
  - Columns: timestamp, actor (avatar + name), action badge, entity type, entity ID
  - Expandable row for JSON payload detail
  - Pre-configured filters: date range, actor, action type

### Deliverables

- All components added to `components/ui/` or `components/patterns/`
- Every component uses design tokens only (no hardcoded colors)
- Every component is responsive
- AG Grid themed to match brand palette

---

## Phase 3: Core Feature Pages — Shipments

**Goal:** Build the primary user-facing shipment workflows — the core of the product.

### Mock Data Layer

- [x] **Type definitions** (`lib/types.ts`)
  - `Shipment`, `Vendor`, `Site`, `Client`, `WasteType`, `User`, `AuditLogEntry`
  - Enums: `UserRole`, `WeightUnit`, `ShipmentStatus`
- [x] **Mock data** (`lib/mock-data.ts`)
  - 50+ shipment records with realistic data
  - 10+ vendors, 8+ sites, 5+ clients, 6+ waste types
  - 10+ users with varied roles
  - 20+ audit log entries
  - Helper functions: `getShipments(filters, page, sort)`, `getVendors()`, etc.

### Shipments List Page (`/shipments`)

- [x] **PageHeader** — title "Shipments", subtitle with total count
  - Actions: "New Shipment" (primary) + "Export" (secondary) buttons
- [x] **FilterBar** — date range, site, client, vendor, waste type dropdowns
- [x] **FilterChips** — show active filters with remove action
- [x] **DataTable** with columns:
  - Shipment date, site name, client name, vendor name, waste type, weight + unit, notes (truncated), status badge, actions (kebab menu)
- [x] **Sorting** — by date (default desc), site, vendor, weight
- [x] **Pagination** — server-side pattern with page/limit in URL params
- [x] **Row click** → opens Shipment Details Drawer
- [x] **Responsive:** filters stack on mobile, table scrolls horizontally

### Export Dialog

- [x] **Export button** → opens Dialog
- [x] **ColumnPicker** — checkboxes for each export column
- [x] **Format selector** — radio group: CSV / XLSX
- [x] **Filter summary** — shows which filters are active for the export
- [x] **Export action** — mock CSV download generation
- [x] **Progress feedback** — progress bar during "export" + success toast

### New Shipments Page (`/shipments/new`)

- [x] **PageHeader** — title "New Shipment Entry", back link to `/shipments`
- [x] **AG Grid** multi-row entry:
  - Default 10 empty rows
  - Columns: site (dropdown), client (dropdown), vendor (dropdown), waste type (dropdown), shipment date (date), weight (number), weight unit (dropdown: lbs/tons/kg), volume (number, optional), notes (text)
  - Add row / remove selected rows buttons
- [x] **Paste-from-Excel** — clipboard paste fills cells
- [x] **Inline validation:**
  - Required fields: site, vendor, waste type, date, weight
  - Numeric constraints: weight > 0, no negative values
  - Date rules: no future dates
  - Invalid cells: red border + error icon + tooltip showing reason
- [x] **Validation summary panel** (below grid)
  - Error count by type
  - Clickable rows that focus the error cell
- [x] **"Validate" button** — pre-check without submitting
- [x] **"Submit" button** — validate + mock insert
  - Success: toast + summary card (X rows inserted)
  - Partial success: valid rows "saved", invalid rows remain with errors highlighted
  - Full failure: error banner with count

### Shipment Details Drawer

- [x] Opens from row click on Shipments List
- [x] **Header:** Shipment ID (mono font) + status badge
- [x] **Body:** key-value pairs for all fields:
  - Date, site, client, vendor, waste type, weight, volume, notes
- [x] **Audit section:** created by (avatar + name), created at, updated at
- [x] **Actions:** Edit (opens form in drawer), Delete (ConfirmDialog)
- [x] **Edit mode:** inline form with Save/Cancel

### Deliverables

- Fully functional shipment list with filters, sort, pagination, export
- AG Grid entry page with paste support and validation
- Details drawer with edit/delete
- All mock data typed and realistic

---

## Phase 4: Admin Pages

**Goal:** Build all admin/system management interfaces for lookup tables, users, and audit logging.

### Vendors Management (`/admin/vendors`)

- [x] CrudTable: name, vendor type, location, active status badge
- [x] Create form (Drawer): name, type (select), city, state, phone, notes
- [x] Edit form (Drawer): pre-filled, same fields
- [x] Deactivate action (ConfirmDialog) — soft delete
- [x] Search by name + filter by type and active status

### Sites Management (`/admin/sites`)

- [x] CrudTable: name, client (linked), region, city, active status
- [x] Create form (Drawer): name, client (select), region (select), address fields
- [x] Edit form (Drawer): pre-filled
- [x] Deactivate action (ConfirmDialog)
- [x] Search by name + filter by client and region

### Waste Types Management (`/admin/waste-types`)

- [x] CrudTable: name, hazardous flag (badge), active status
- [x] Create form (Drawer): name, hazardous toggle (Switch), description
- [x] Edit form (Drawer): pre-filled
- [x] Deactivate action (ConfirmDialog)
- [x] Hazardous badge: `variant="error"` for hazardous, `variant="success"` for non-hazardous

### Clients Management (`/admin/clients`)

- [x] CrudTable: name, industry, active status
- [x] Create form (Drawer): name, industry (select), notes
- [x] Edit form (Drawer): pre-filled
- [x] Deactivate action (ConfirmDialog)
- [x] Search by name + filter by industry

### Users & Roles Management (`/admin/users`)

- [x] User list table: avatar, display name, email, role badge, assigned sites (chips), active
- [x] **Create/Invite user** form (Dialog):
  - Email, display name, role (Select: site_user/admin/system_admin)
  - If site_user: site assignment MultiSelect
- [x] **Edit user** form (Drawer):
  - Change role, update site assignments
- [x] **Deactivate user** (ConfirmDialog)
- [x] Search by name/email + filter by role and status

### Audit Log (`/admin/audit-log`)

- [x] AuditLogTable: timestamp, actor (avatar + name), action type (badge), entity type, entity ID, summary
- [x] Filters: date range, actor (select), action type (select), entity type (select)
- [x] Expandable row detail: full JSON payload in mono font, formatted
- [x] Pagination (50 per page)
- [x] No create/edit/delete — read-only

### Deliverables

- All 6 admin pages fully functional with mock data
- Consistent CrudTable pattern across all lookup pages
- Forms validated with react-hook-form + zod
- All pages responsive

---

## Phase 5: Dashboard, Auth & Polish

**Goal:** Build the overview dashboard and login page, then polish everything to production quality.

### Login Page (`/login`)

- [x] Centered card layout with MPS logo
- [x] "Sign in with Microsoft" button (branded blue, Microsoft icon)
- [x] Loading spinner state after click
- [x] Mock redirect to `/dashboard` after 1.5s
- [x] Footer: "Powered by MPS" + version
- [x] Responsive: card scales down on mobile

### Dashboard (`/dashboard`)

- [x] **KPI row** (StatRow):
  - Total shipments (all time)
  - Shipments this month (with trend %)
  - Active sites count
  - Pending entries count
- [x] **Recent shipments** — compact DataTable (last 10 entries, minimal columns)
  - Columns: date, site, vendor, weight, status
  - "View All" link to `/shipments`
- [x] **Recent activity** — audit feed (last 5 events)
  - Avatar + action description + timestamp
  - "View All" link to `/admin/audit-log`
- [x] **Quick actions** — card grid:
  - "New Shipment" → `/shipments/new`
  - "Export Data" → `/shipments` with export dialog
  - "Manage Vendors" → `/admin/vendors`
- [x] Responsive: KPIs 4-col → 2-col → 1-col, cards stack

### Global Polish

- [x] **Loading states** — skeleton loaders on every page (data table skeletons, card skeletons, form skeletons)
- [x] **Error boundaries** — `ErrorBoundary` component with fallback UI + retry action
- [x] **Empty states** — every list/table shows EmptyState with icon + message + action when no data
- [x] **404 page** — custom not-found page with brand styling + back link
- [x] **Page transitions** — subtle fade-in on route change (Motion)
- [x] **Toast consistency** — verify all user actions produce appropriate toast feedback

### Responsive QA

- [x] Test all pages at **320px** (small mobile)
- [x] Test all pages at **768px** (tablet)
- [x] Test all pages at **1024px** (small desktop)
- [x] Test all pages at **1440px** (standard desktop)
- [x] Verify sidebar collapse/drawer behavior
- [x] Verify table horizontal scroll on mobile
- [x] Verify form layouts stack properly
- [x] Verify dialog/drawer sizing on mobile
- [x] Verify AG Grid usability on tablet+

### Accessibility Audit

- [x] Keyboard navigation on all interactive elements (tab order, enter/space activation)
- [x] Focus management for dialogs and drawers (trap focus, restore on close)
- [x] Screen reader labels (`aria-label`, `aria-describedby`, `role` attributes)
- [x] Color contrast verification — all text passes WCAG AA
- [x] Status indicators never rely on color alone (always icon + text)

### Performance

- [x] Lazy-load admin route group (dynamic imports)
- [x] AG Grid tree-shaking (import only needed modules)
- [x] Bundle size analysis (`next build` output review)
- [x] Image optimization (next/image for all images)
- [x] Minimize client-side JavaScript (prefer server components where possible)

### Deliverables

- Complete, polished application with all pages functional
- Login → Dashboard → Shipments → Admin flow works end-to-end
- Every page handles loading, error, and empty states
- Passes responsive testing at all breakpoints
- Meets WCAG AA accessibility standards
- Optimized bundle size

---

## Summary

| Phase | Pages / Components | Status |
|-------|-------------------|--------|
| **Phase 1** — App Shell & Routing | AppShell, SidebarNav, Topbar, UserMenu, 11 route placeholders | [x] |
| **Phase 2** — Missing Components | 15+ new components (DataTable, FilterBar, AG Grid, KpiCard, etc.) | [x] |
| **Phase 3** — Shipments | Shipments List, New Entry (AG Grid), Export, Details Drawer | [x] |
| **Phase 4** — Admin | Vendors, Sites, Waste Types, Clients, Users, Audit Log | [x] |
| **Phase 5** — Dashboard & Polish | Login, Dashboard, loading/error/empty states, responsive QA, a11y | [x] |

**Total tasks:** ~90+ individual checklist items across 5 phases.
