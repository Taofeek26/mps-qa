# Completed Changes from Original Design

This document lists all changes completed (from the original codebase) up to the current state. Use it as a single reference for what was modified and where.

---

## 1. Design System & Single Source of Truth

| What changed | Where |
|--------------|--------|
| **Colors and typography** controlled from one place | `app/globals.css` — `.theme-brand` block is the active dashboard theme; edit there to change the whole UI. |
| **Primary color** | `#00BD9D` — links, focus, accents, active states, charts. |
| **Button / CTA color** | `#0D796C` (darker teal) — main action buttons for contrast and readability (replaced previous magenta `#9E1F63`). |
| **Neutrals** | Slate-based grays (`#0F172A` → `#F8FAFC`) for text and surfaces. |
| **Semantic colors** | Refined success, warning, error in `.theme-brand`. |
| **Browser theme color** | `app/layout.tsx` — `<meta name="theme-color" content="#00BD9D" />`. |
| **Radius** | Less rounded: `--radius-sm: 4px`, `--radius-lg: 8px` (was 8px / 16px). |

**Docs updated:** `docs/color-palette-reference.md`, `DESIGN_SYSTEM.md` (Brand theme section).

---

## 2. Sidebar

| What changed | Where |
|--------------|--------|
| **Naming** | Group “Main” → “Primary” (Dashboard, Shipments, Reports, Report Builder); “Admin” → “Administration”. Order reflects priority: primary workflow first, then administration. | `lib/navigation.ts` |
| **Colors by priority** | Three levels in `.theme-brand`: (1) **Active** = `--color-nav-item-active` (#0D796C, highest); (2) **Default** = `--color-nav-item` (#64748B, muted); (3) **Group label** = `--color-nav-group-label` (#94A3B8, lowest). Hover = `--color-nav-item-hover` (#0F172A). | `app/globals.css`, `sidebar-nav.tsx`, `mobile-sidebar.tsx` |
| **Active state** | No background block or left bar. Active = nav-item-active color + font-semibold. | Same |
| **Hover** | `hover:bg-black/4`; text uses nav-item-hover. | Same |
| **Borders** | Right border kept (`border-r border-border-default`); removed borders under logo and above collapse. | Same |
| **Logo** | Larger, left-aligned: expanded 130×46, collapsed 44×44; container `h-20` / `h-16`. | Same |
| **Reports vs Report Builder** | Only one active at a time: “Reports” not active on `/reports/builder`; “Report Builder” active there. | Same (isActive logic) |
| **Animations** | Width transition `duration-200 ease-out`; logo block `transition-[padding] duration-200 ease-out`; nav links and collapse button `transition-colors duration-150 ease-out`. | Same |

---

## 3. Layout & Typography (Dashboard)

| What changed | Where |
|--------------|--------|
| **Main content padding** | Extra space below header: `pt-10` (40px) so header and body have clear separation. | `components/layout/app-shell.tsx` |
| **Page header** | `pb-4`, title `text-2xl`. | `components/ui/page-header.tsx` |
| **Section header** | `text-base font-semibold tracking-tight` (no uppercase). | `components/ui/section-header.tsx` |
| **Vertical spacing** | `space-y-6` on dashboard (Overview, Analytics). | `app/(app)/dashboard/page.tsx` |
| **Dashboard filters** | Date range and "All Customers" dropdowns are left-aligned (`sm:justify-start`). | `app/(app)/dashboard/page.tsx` |

---

## 4. Dashboard KPIs & Charts

| What changed | Where |
|--------------|--------|
| **KPI grid** | 3×3 grid; base background `#F9FAFB`, border `#F3F4F6`. | `app/(app)/dashboard/page.tsx` |
| **KpiCard hover** | Neutral: `hover:border-border-strong` (no teal border). | `components/ui/kpi-card.tsx` |
| **KPI icons** | Icon color `#99A1AF`; icon box `bg-bg-app`, `border-border-default`. | `components/ui/kpi-card.tsx` |
| **ChartContainer** | “Revenue vs Cost Trend” has no left accent bar (teal bar removed). | `components/charts/chart-container.tsx`, dashboard page |
| **Chart colors** | `--color-teal-*` in `.theme-brand` so charts use brand teal. | `app/globals.css` |
| **Vendor Expirations (Analytics)** | Card and TimelineHeatmap use full container width; `w-full`, `min-w-0`, grid `minmax(0,1fr)` so the bar/list fills the card. | `app/(app)/dashboard/page.tsx`, `components/charts/timeline-heatmap.tsx` |

---

## 5. Cards & Hover (Generic)

| What changed | Where |
|--------------|--------|
| **KpiCard** | Hover: `border-border-strong` only. | `components/ui/kpi-card.tsx` |
| **Report Builder section gallery** | Hover: `border-border-strong`, `bg-bg-subtle`. | `app/(app)/reports/builder/_components/section-gallery.tsx` |

---

## 6. Shipments Page

| What changed | Where |
|--------------|--------|
| **Page size** | 10 results per page (`PAGE_SIZE = 10`). | `app/(app)/shipments/page.tsx` |
| **Search** | Search bar (manifest #, site, client, vendor, etc.); `search` in URL and filters. | `app/(app)/shipments/page.tsx`, `app/(app)/shipments/_components/shipment-filters.tsx` |
| **Page spacing** | `space-y-6` between header, filters, and table. | `app/(app)/shipments/page.tsx` |
| **Filter bar** | `gap-4` between controls; search input first (full-width on small screens). | `components/ui/filter-bar.tsx`, `shipment-filters.tsx` |
| **Applied filters** | All active filters in one contained box: “Applied filters:” + chips + “Clear all”; border, background, padding. Individual chip per value. | `shipment-filters.tsx` |
| **Chip remove** | Per-value removal (`site-${id}`, `vendor-${id}`, etc.). | `shipment-filters.tsx` (handleRemoveChip) |
| **Search chip** | When search is set, “Search: &lt;query&gt;” chip in applied filters. | `shipment-filters.tsx` |
| **URL** | `updateUrl` includes `search` param. | `app/(app)/shipments/page.tsx` |
| **Footer** | No “Total shipments” / “Total weight” footer below table (removed). | — |
| **Filters redesign** | Modern card layout with labels above each control; search prominent; responsive grid; “Clear filters”; “Active filters (N)” chip strip. | `app/(app)/shipments/_components/shipment-filters.tsx` |
| **Column visibility** | “Columns” dropdown to show/hide columns (Date, Site, Client, Vendor, etc.); optional Miles and Container columns. | `app/(app)/shipments/page.tsx`, `shipment-columns.tsx` |

---

## 6b. New Shipment Entry (`/shipments/new`) — UX-first redesign

| What changed | Where |
|--------------|--------|
| **Entry choice first** | First-time experience: user sees two options — “Upload data” or “Manually enter data” — instead of going straight to an empty table. | `app/(app)/shipments/new/page.tsx`, `_components/entry-choice.tsx` |
| **Upload flow** | Dedicated upload step: drag-and-drop or browse for Excel/CSV → programmatic parse and column mapping → preview in same grid for review → validate and submit. | `_components/upload-shipments-step.tsx`, page state |
| **Manual entry speed** | “Add 10 / 25 / 50 rows” dropdown; “Duplicate selected” to clone rows; “Fill down” to copy focused cell value down the column; paste-from-Excel supported. | `components/ui/ag-grid-wrapper.tsx` (showAddNRows, showDuplicate, showFillDown), `new-shipment-grid.tsx` |
| **Layout** | More vertical space (taller grid, reduced top margin); manual view uses wider max-width (max-w-6xl) so the grid has more horizontal room. | `page.tsx`, `new-shipment-grid.tsx` (height) |
| **Imported banner** | After file upload, a short banner explains that rows are imported and invites review before submit. | `page.tsx` |
| **Back link wording** | Single label **“Back to entry options”** used everywhere (upload step and manual view) so users returning to the selection screen see consistent wording. | `upload-shipments-step.tsx` (export), `page.tsx` |
| **Visual design** | Entry and upload steps use rounded-xl cards, shadow-sm, hover states (shadow-md, border/hover), and clearer typography; manual view has refined banner (left accent), tip in a subtle box, and aligned action row. | `entry-choice.tsx`, `upload-shipments-step.tsx`, `page.tsx` |

---

## 7. Data Table (Global)

| What changed | Where |
|--------------|--------|
| **Scroll** | Table in scrollable container; only table body scrolls, sticky header; `minHeight` ~280px, `maxHeight` e.g. 60vh. | `components/ui/data-table.tsx`, shipments page |
| **Header** | `h-12 py-3`. | `components/ui/data-table.tsx` |
| **Rows** | `h-14 py-3 px-4`; no alternating row background (light grey stripe removed); hover and selected states only. | Same |
| **Container spacing** | `space-y-5`. | Same |

---

## 8. Filter Chips (Global)

| What changed | Where |
|--------------|--------|
| **Spacing** | `gap-3`, `py-1` on row; chips `gap-2`, `py-1.5`; “Clear all” `ml-1`. | `components/ui/filter-chips.tsx` |

---

## 9. MultiSelect

| What changed | Where |
|--------------|--------|
| **Trigger** | No chips inside trigger. Shows placeholder, single label (if one selected), or “N selected”. No X or chip list in the button. | `components/ui/multi-select.tsx` |
| **Dropdown** | Unchanged: option list with checkmarks, search, “Select all” / “Clear all” footer. | Same |

---

## 10. Breadcrumbs & Header / Nav

| What changed | Where |
|--------------|--------|
| **Breadcrumbs** | Current page and links use dark (`text-text-primary`, `text-text-secondary`); link hover `hover:text-text-primary`. | `components/ui/breadcrumbs.tsx` |
| **Tabs** | Active tab text and underline use dark: `data-[state=active]:text-text-primary`, indicator `bg-text-primary`. | `components/ui/tabs.tsx` |
| **PillTabs** | Count badge and selected state use neutral/dark (`group-data-[state=active]:`). | `components/ui/pill-tabs.tsx` |
| **Animations (breadcrumbs)** | Nav and list items: `transition-opacity` / `transition-colors` / `transition-transform` `duration-150 ease-out`; link hover smooth. | `components/ui/breadcrumbs.tsx` |
| **Animations (header)** | Topbar: `transition-colors duration-150 ease-out`; user menu, notifications, command palette trigger: same for hover/state. | `components/layout/topbar.tsx`, `user-menu.tsx`, `notifications.tsx`, `components/ui/command-palette.tsx` |

---

## 11. Dashboard Content

| What changed | Where |
|--------------|--------|
| **Welcome block** | “Welcome, [Name]! Your MPS dashboard is ready. Track shipments…” with user display name. | `app/(app)/dashboard/page.tsx` |
| **Heading** | No extra “Dashboard” heading; only filter row above content. | Same |
| **Tabs** | Activity tab removed; its content (Recent Shipments + Recent Activity) merged into Overview. | Same |
| **Banner** | “Pending shipments awaiting review” banner and `pendingShipments` removed. | Same |
| **Recent Shipments + Recent Activity** | Flat layout (no card-in-card): section headings + single content block per column. Same row height (`lg:items-stretch`); Recent Activity has inner scrolling. **10 records** for Recent Activity (audit log); **fixed padding**: list container `px-4 py-2`, each activity item `py-2.5`. | Same |

---

## 12. Login Page

| What changed | Where |
|--------------|--------|
| **Alignment** | All content left-aligned (logo, heading, label, dropdown, button, footer). | `app/(auth)/login/page.tsx` |
| **Layout** | Single card, `max-w-[400px]`; “Welcome back” and subtitle in a compact block; Sign in as + dropdown + “Sign in with Microsoft” button; footer separated by border. | Same |
| **Spacing** | Balanced spacing: `gap-6` between sections; `space-y-1` (welcome), `space-y-2` (Sign in as); card padding `pt-6 pb-6` / `sm:pt-8 sm:pb-8`, `sm:px-8`; footer `pt-5`, `space-y-1.5`. | Same |
| **Footer** | Version “MPS Platform v1.0”, “Powered by MPS Group”; “Designed and built by White Label Resell” with link to https://whitelabelresell.com/ (opens in new tab). | Same |

---

## 13. Report Builder

| What changed | Where |
|--------------|--------|
| **My Reports list** | `/reports/builder` shows a table of saved reports (name, created, updated) per user; “Create new report” button; empty state when none. | `app/(app)/reports/builder/page.tsx`, `_components/report-list.tsx` |
| **Save / Edit** | New report at `/reports/builder/new`; edit at `/reports/builder/[id]`. Reports saved to user account (localStorage keyed by user id). Toolbar: “Save report”, “Back to my reports”, “Export PDF”. | `app/(app)/reports/builder/new/page.tsx`, `[id]/page.tsx`, `report-toolbar.tsx`, `report-builder.tsx`, `use-report-builder.ts` |
| **Three-dot actions** | Per report: Edit, Share (copy link), Download PDF, Rename (dialog), Delete (confirm dialog). | `report-list.tsx`, `rename-report-dialog.tsx` |
| **Persistence** | `lib/saved-reports.ts` — getSavedReports, saveNewReport, updateSavedReport, deleteSavedReport. | `lib/saved-reports.ts` |

---

## 14. Documentation Created/Updated

| File | Purpose |
|------|---------|
| `docs/dashboard-architecture-and-design-system.md` | Architecture, stack, data flow, design system foundation. |
| `docs/color-palette-reference.md` | Color list with hex and usage; points to `globals.css` as source of truth. |
| `docs/required-changes-checklist.md` | Checklist from “message (34).txt” (Power BI, KPIs, engineering, etc.). |
| `docs/design-audit-generic-vs-professional.md` | Why UIs look generic and codebase-specific fixes. |
| `README.md` | Short overview and pointer to architecture doc. |
| `DESIGN_SYSTEM.md` | Brand theme and token summary. |

---

## Quick Reference: Main Files Touched

- **Theme / global:** `app/globals.css`, `app/layout.tsx`
- **Layout:** `components/layout/app-shell.tsx`, `sidebar-nav.tsx`, `mobile-sidebar.tsx`, `topbar.tsx`, `user-menu.tsx`, `notifications.tsx`
- **UI primitives:** `components/ui/page-header.tsx`, `section-header.tsx`, `kpi-card.tsx`, `button.tsx`, `filter-bar.tsx`, `filter-chips.tsx`, `data-table.tsx`, `multi-select.tsx`, `breadcrumbs.tsx`, `tabs.tsx`, `pill-tabs.tsx`, `command-palette.tsx`
- **Shipments:** `app/(app)/shipments/page.tsx`, `app/(app)/shipments/_components/shipment-filters.tsx`
- **Dashboard:** `app/(app)/dashboard/page.tsx`
- **Report builder:** `app/(app)/reports/builder/` (page, new, [id]), `_components/report-list.tsx`, `report-builder.tsx`, `report-toolbar.tsx`, `use-report-builder.ts`, `rename-report-dialog.tsx`; `lib/saved-reports.ts`
- **Charts:** `components/charts/chart-container.tsx`, `timeline-heatmap.tsx`
- **Auth:** `app/(auth)/login/page.tsx`

---

*Last updated to reflect all changes completed from the original design through the current state.*
