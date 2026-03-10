# Summary of All Completed Changes

Short list of what was done. For file-level detail, see [completed-changes-from-original.md](./completed-changes-from-original.md).

---

**Design & theme**
- Design system single source of truth (globals.css)
- No light grey alternating rows in tables
- Dashboard filters left-aligned

**Navigation & layout**
- Sidebar: Primary / Administration groups, teal active state
- App shell padding and content width
- Login page left-aligned, White Label Resell footer

**Dashboard**
- Welcome block, left-aligned filters, KPI grid
- Vendor Expirations and charts full width
- Recent Shipments + Recent Activity (flat layout, 10 activity records)

**Shipments list**
- Card-style filters, search, URL state, applied-filters chips
- Column visibility dropdown (Miles, Container optional)
- Table: no stripe, sticky header, scrollable body

**New Shipment Entry (/shipments/new)**
- Entry choice first (Upload data / Manually enter data)
- Upload step: drag-and-drop, parse Excel/CSV, preview grid
- Download sample file (CSV)
- Manual grid: Add 10/25/50 rows, Duplicate selected, Fill down, paste from Excel
- Two-column layout: left content, right step indicator
- “Back to entry options” wording (consistent)
- Minimal header (Back to Shipments only), no breadcrumb
- Full-width containers, left-aligned text and icons

**Reports & Report Builder**
- Reports tabs, report name per type, no gap below tabs
- My Reports list, new/edit routes, Save, Back to my reports, Export PDF
- Per-report: Edit, Share, Download PDF, Rename, Delete (localStorage)
- Regulatory KPI cards neutral icon styling

**Audit log**
- Card-based filters, labels, chips, URL state

**Global UI**
- Data table: sticky header, no row stripe, error tooltips
- AG Grid: add N rows, duplicate, fill down, import file

**Documentation**
- completed-changes-from-original.md (full changelog)
- CHANGES-SUMMARY.md (this file)
- dashboard-architecture-and-design-system.md, color-palette-reference.md, DESIGN_SYSTEM.md, required-changes-checklist.md, design-audit-generic-vs-professional.md, README.md
