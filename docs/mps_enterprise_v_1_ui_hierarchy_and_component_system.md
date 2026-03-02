# MPS Enterprise v1
## UI Hierarchy System + Reusable Component Inventory

> **Purpose:** Define a complete UI hierarchy system (layout, typography, spacing, colors, states) and a reusable component set for an enterprise-grade, Microsoft-aligned operational data platform (grid-heavy UX with secure, compliant feel).

---

# 1) Design Principles

1. **Operational Clarity First**
   - Data entry and review must be faster than Excel.
   - Minimize cognitive load: strong hierarchy, predictable patterns.

2. **Enterprise Restraint**
   - Muted palette, minimal saturation.
   - UI feels stable, compliant, and professional.

3. **Density Without Chaos**
   - Grid/table UX supports high density.
   - Use spacing + typography + subtle borders rather than heavy shadows.

4. **Accessibility by Default (WCAG AA)**
   - Contrast-safe text colors.
   - Never rely on color alone for status.
   - Keyboard-friendly and screen-reader friendly components.

5. **Composable Components**
   - Every building block should be reusable and consistent.
   - Prefer “variants” over one-off components.

---

# 2) Color Tokens (Design System)

## 2.1 Brand Tokens

**Primary (Trust / Authority)**
- primary.700 `#0F2A3D`
- primary.600 `#163A52`
- primary.500 `#1E4F73`
- primary.400 `#2C6A96`
- primary.300 `#4F89B8`

**Secondary (ESG / Responsibility)**
- secondary.600 `#1F3F36`
- secondary.500 `#2E5E50`
- secondary.400 `#4A7D6F`
- secondary.300 `#6E9F90`

## 2.2 Neutral Scale (Industrial)
- gray.950 `#0E1114`
- gray.900 `#1A1F24`
- gray.800 `#2B3137`
- gray.700 `#3E454C`
- gray.600 `#55606A`
- gray.500 `#6F7C87`
- gray.400 `#95A2AD`
- gray.300 `#C2CBD3`
- gray.200 `#E3E8EC`
- gray.100 `#F2F5F7`
- gray.50  `#F8FAFB`

## 2.3 Semantic Tokens
- success.600 `#2F6E4F`
- success.500 `#3F8B65`
- success.400 `#58A97F`

- warning.600 `#A1661A`
- warning.500 `#C48124`
- warning.400 `#E1A341`

- error.600 `#8B2F2F`
- error.500 `#B04141`
- error.400 `#D15B5B`

## 2.4 Surface Tokens
- bg.app `#F8FAFB`
- bg.card `#FFFFFF`
- bg.subtle `#F2F5F7`
- bg.hover `#E3E8EC`

- nav.sidebar `#0F2A3D`
- nav.top `#163A52`

- border.default `#C2CBD3`
- border.strong `#95A2AD`

- text.primary `#1A1F24`
- text.secondary `#55606A`
- text.muted `#6F7C87`
- text.inverse `#FFFFFF`

- focus.ring `#4F89B8`

---

# 3) Typography System

## 3.1 Font Recommendations
- **Primary UI Font:** Inter (or system font fallback)
- **Numbers / Monospace (optional):** JetBrains Mono (for IDs, codes, certain table columns)

## 3.2 Type Scale (Desktop-first, with responsive adjustments)

**Display / Page Titles**
- H1: 28–32px / 700 / tight

**Section Titles**
- H2: 20–24px / 700
- H3: 16–18px / 600

**Body**
- Body: 14–16px / 400–500
- Small: 12–13px / 400

**Data Table Text**
- Table: 13–14px / 500
- Table Meta: 12px / 400

## 3.3 Text Hierarchy Rules
- Use **H1** once per page.
- Use **H2** for major page sections.
- Use **H3** inside cards and panels.
- Body text should rarely exceed 2–3 lines; use tooltips or “Learn more” links.

---

# 4) Spacing, Grid, and Layout

## 4.1 Spacing Scale (8pt grid)
- 4, 8, 12, 16, 24, 32, 40, 48

## 4.2 Page Layout

**App Shell (Desktop)**
- Left sidebar: 260px (collapsible to 72px)
- Top bar: 56px
- Main content max width: 1200–1440px (depending on table density)
- Content padding: 24px

**Mobile/Tablet**
- Sidebar becomes drawer
- Top bar remains
- Content padding: 16px

## 4.3 Content Hierarchy
Pages should follow this structure:
1. **Header Row**: Page title + primary action + secondary actions
2. **Filters Row**: Search + filter chips + date range
3. **Content Region**: Table/grid + summary widgets
4. **Details Drawer/Modal**: For row details and edits

---

# 5) Component Styling Rules (Consistency)

## 5.1 Corners
- Default radius: 12px
- Small radius: 10px (inputs)
- Large radius: 16px (cards/modals)

## 5.2 Borders & Elevation
- Prefer **borders** + subtle background over strong shadows.
- Card shadow only when necessary (modals, floating panels).

## 5.3 Focus & Interaction
- Always show a visible focus ring:
  - `focus.ring` with 2px outline + subtle glow
- Hover states:
  - Use `bg.hover` or slightly darker border

---

# 6) UI Hierarchy by Page Type

## 6.1 Dashboard / Overview (Admin)
- KPI cards (small, minimal)
- Recent uploads / audit activity
- Quick links to Shipments

## 6.2 Shipments List
- Filters row (sticky)
- Table with server-side pagination
- Export + Column picker
- Row click opens **Details Drawer**

## 6.3 New Shipments (Multi-row Entry)
- Grid entry (AG Grid)
- Validation summary panel
- Submit and “Save Draft” (optional)
- Success: toast + summary of inserted rows

## 6.4 Admin Pages
- CRUD tables for Vendors/Sites/Waste Types
- Inline edit in drawer/modal
- Audit logs

---

# 7) Reusable Component Inventory

> **Goal:** Everything below should be reusable components with variants. Avoid one-off implementations.

## 7.1 Foundations (Core UI)

1. **AppShell** *(Reusable)*
   - Sidebar + Topbar + Content

2. **SidebarNav** *(Reusable)*
   - Collapsible
   - Active state
   - Role-based links

3. **Topbar** *(Reusable)*
   - Breadcrumbs
   - Page actions slot
   - User menu

4. **PageHeader** *(Reusable)*
   - Title
   - Subtitle
   - Primary action
   - Secondary actions

5. **Card / Panel** *(Reusable)*
   - Variants: default, outlined, subtle

6. **SectionHeader** *(Reusable)*
   - Title + optional actions

---

## 7.2 Inputs & Forms

1. **TextInput** *(Reusable)*
   - Variants: default, search
   - States: error, disabled

2. **NumberInput** *(Reusable)*
   - Units support (suffix/prefix)

3. **Textarea** *(Reusable)*

4. **Select / Dropdown** *(Reusable)*
   - Async options
   - Searchable

5. **MultiSelect** *(Reusable)*
   - Chips
   - Clear all

6. **DatePicker** *(Reusable)*

7. **DateRangePicker** *(Reusable)*

8. **Checkbox** *(Reusable)*

9. **RadioGroup** *(Reusable)*

10. **Switch / Toggle** *(Reusable)*

11. **FileUpload** *(Reusable; v1 optional)*
   - For future “Excel upload automation”

12. **FormField Wrapper** *(Reusable)*
   - Label, helper text, error text

13. **InlineValidationMessage** *(Reusable)*

---

## 7.3 Buttons & Actions

1. **Button** *(Reusable)*
   - Variants: primary, secondary, ghost, destructive, success
   - Sizes: sm, md, lg
   - Icon support
   - Loading state

2. **IconButton** *(Reusable)*

3. **SplitButton** *(Reusable)*
   - Primary action + dropdown actions

4. **ButtonGroup** *(Reusable)*

5. **Link** *(Reusable style)*

---

## 7.4 Feedback & Status

1. **Toast / Notifications** *(Reusable)*
   - success, error, warning, info

2. **Alert Banner** *(Reusable)*
   - Inline page alerts

3. **Badge / Tag** *(Reusable)*
   - neutral, success, warning, error, info

4. **ProgressBar** *(Reusable)*
   - For export or bulk submit feedback

5. **Spinner / LoadingIndicator** *(Reusable)*

6. **EmptyState** *(Reusable)*
   - No shipments yet
   - No search results

7. **Skeleton Loader** *(Reusable)*

---

## 7.5 Data Display (Tables, Grid, Reporting)

1. **DataTable (Server-side)** *(Reusable)*
   - Pagination, sorting, selection

2. **AGGridWrapper (Data Entry Grid)** *(Reusable)*
   - Column schema-driven
   - Paste support
   - Row validation mapping

3. **ColumnPicker** *(Reusable)*

4. **FilterBar** *(Reusable)*
   - Search
   - Dropdown filters
   - Date range
   - Reset filters

5. **FilterChips** *(Reusable)*

6. **KpiCard** *(Reusable)*

7. **StatRow / SummaryBar** *(Reusable)*

---

## 7.6 Overlays (Modals, Drawers, Menus)

1. **Modal** *(Reusable)*
   - Confirm, form modal

2. **Drawer / SidePanel** *(Reusable)*
   - Row details
   - Edit forms

3. **ConfirmDialog** *(Reusable)*
   - Delete confirmations

4. **Popover** *(Reusable)*

5. **Tooltip** *(Reusable)*

6. **DropdownMenu** *(Reusable)*

---

## 7.7 Navigation & Structure

1. **Breadcrumbs** *(Reusable)*

2. **Tabs** *(Reusable)*

3. **Pagination** *(Reusable)*

4. **Stepper** *(Reusable; optional)*
   - For future guided workflows

---

## 7.8 Admin/CRUD Building Blocks

1. **CrudTable** *(Reusable)*
   - List + create/edit/delete actions

2. **CrudForm** *(Reusable patterns)*

3. **RoleAssignmentControl** *(Reusable)*
   - Role dropdown + site assignment

4. **AuditLogTable** *(Reusable)*

---

# 8) Component State Matrix (Must Implement)

For all interactive components:

- Default
- Hover
- Active/Pressed
- Focus-visible
- Disabled
- Loading
- Error
- Success (where applicable)

For form inputs:

- Empty
- Filled
- Invalid
- Valid

For tables/grids:

- Empty
- Loading
- Error
- No results

---

# 9) Key Screens (UI Build Priorities)

## v1 Priority Screens

1. Login (Entra)
2. Shipments list (filters + export)
3. New shipments (AG Grid multi-row entry + validation)
4. Shipment details drawer
5. Admin CRUD for lookups (vendors, sites, waste types)
6. Users & roles management
7. Audit logs

---

# 10) AG Grid UX Spec (Enterprise Quality)

## 10.1 Grid Behaviors

- Paste block from Excel into grid
- Autofill down
- Keyboard navigation (arrow keys, enter, tab)
- Row-level validation summary
- Invalid cell styling:
  - Subtle error background + error icon
  - Tooltip for error reason

## 10.2 Submission UX

- “Validate” optional button (pre-check)
- “Submit” performs validate + insert
- Response shows:
  - inserted rows count
  - failed rows count
  - downloadable error report (CSV) — optional but premium

---

# 11) Hand-off Notes for Engineering

## 11.1 Tokenization

- Implement tokens in a shared `design-tokens` module.
- Tailwind config maps tokens to `--css-vars` for theming.

## 11.2 Component Library Choice

- Use shadcn/ui primitives where possible.
- Wrap each primitive in app-specific components to enforce tokens and variants.

## 11.3 Reuse Policy

- New UI must use existing components first.
- If a new component is needed, it must be generic enough to reuse.

---

# 12) Definition of Done (UI/UX)

UI/UX is “enterprise-ready” when:

- Hierarchy is consistent across pages
- Components are token-driven and variant-based
- Forms provide clear validation and feedback
- Grid entry is fast and keyboard-friendly
- Export and admin actions are predictable and confirm destructive actions
- Accessibility checks pass for key flows (login, grid entry, export)

