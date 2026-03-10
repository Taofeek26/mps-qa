# Required Changes Checklist

**Source:** Message (34).txt — deliverable must be fixed and showable.

**Team:** Kalu, Anil, Mustapha, Taofeek

---

## 1. ANALYTICS — Power BI Report

### Problems to fix
- [ ] No clear structure for report navigation
- [ ] Sections contain only ~5 KPIs each
- [ ] Dashboard has more KPIs than the report (align them)
- [ ] Visualizations repeated too often
- [ ] Only ~3 visualization types used (Power BI supports ~20–25)
- [ ] Colors do not match client brand
- [ ] Report title and branding do not align with client product name

### Required fixes
- [ ] **Proper report structure** — clear hierarchy and flow
- [ ] **Sidebar navigation** — do NOT use top navigation
- [ ] **Increased visualization diversity** — use more of the 20–25 Power BI viz types
- [ ] **Brand-aligned colors** — match client (see Color Palette section)
- [ ] **Clear sectioning and layout** — professional, client-ready
- [ ] **Report must represent the data available** — no placeholder-only sections

---

## 2. KPI VALIDATION

### Deliverables
- [ ] **Documented list of KPIs** with for each:
  - Where it is listed (dashboard and/or report)
  - Why it matters
  - Whether it overlaps with Joseph's meeting notes
- [ ] **Two lists:**
  - [ ] KPIs that **overlap** with meeting notes
  - [ ] KPIs that **do NOT** overlap with meeting notes
- [ ] **Overlapping KPIs must appear in BOTH:**
  - [ ] The dashboard
  - [ ] The Power BI report
- [ ] **Constraint:** Dashboard must NOT contain more KPIs than the report (parity or report has more)

---

## 3. POWER BI VISUALIZATION LIST

### Steps (in order)
1. [ ] Go to **official Power BI documentation**
2. [ ] Get the **full list of supported Power BI visualization types** (e.g. first Google search)
3. [ ] **Do NOT** ask AI vaguely — use the official list
4. [ ] Provide that list to the AI/model
5. [ ] Have it **structure the list into a markdown file**
6. [ ] **Only then** generate HTML documentation or example reports
- [ ] Report must **leverage more visualization types** (currently ~3; should use many of the 20+)

---

## 4. ENGINEERING REQUIREMENTS

### Local HTML build
- [ ] Produce **HTML locally** so the codebase can be seen
- [ ] Styling must be **compatible with white-label resale**
- [ ] **Backend prepared** so it can be demonstrated live
- [ ] Must be a **functional proof of concept**, not just a visual skin

### Required capabilities (demonstrable)
- [ ] **Upload data**
- [ ] **See that data processed**
- [ ] **See the data reflected in the interface**

### Data and pipeline
- [ ] Create **example data files** that match the **schema Joseph provided**
- [ ] Example files must allow:
  - [ ] Ingest data
  - [ ] Test the ingestion pipeline
  - [ ] Verify the platform functions correctly
- [ ] **Endpoints ready**
- [ ] **Data connections exist**
- [ ] **Frontend can connect to backend data sources** (endpoints, sockets, or APIs as required)

---

## 5. FRONTEND DESIGN ISSUES

### Overall
- [ ] Pages are **overly simplistic** — improve depth and clarity
- [ ] Visualizations are **generic** — diversify and improve
- [ ] **Same chart types repeated** across the dashboard — add variety
- [ ] **Large portions of the screen unused** — use space effectively

### Layout (critical)
- [ ] **Vertical space:** Pages use only ~50% — fix so content uses more vertical space
- [ ] **Excessive padding at the top** — reduce
- [ ] **Inner page padding extremely large** — reduce
- [ ] **Left/right padding** reduces space for data tables — reduce so tables have room
- [ ] **Column width:** Some columns that need width are **truncated with "..."** — fix
- [ ] **Column width:** Some columns that need minimal width **take too much space** — fix

---

## 6. COLOR PALETTE

### Current problem
- Dashboard and report are **not using client brand**
- Currently using "random blues and unrelated colors"

### Client brand (MPS Group website)
- **Primary base:**
  - [ ] Soft **eggshell white** background
  - [ ] **Black** text
- **Primary accent:**
  - [ ] **Purple** buttons
- **Secondary accent:**
  - [ ] **Light green** highlights

### Required
- [ ] **Fix the palette** so dashboard and report match the client brand above

---

## 7. REPORT BUILDER

### Current problem
- Too simplistic
- Users only select a section and get a generic set of KPIs — **not enough**

### Required behavior
- [ ] Users can **control KPIs individually**
- [ ] Users can **isolate metrics**
- [ ] Users can **determine exactly what appears in the report**
- [ ] **More granular control** in the builder (per-KPI, not just per-section)

---

## 8. SHIPMENT DATA UX

### Page design
- [ ] Page **wastes a large portion of the screen** — fix layout
- [ ] **Tables have spacing problems** — fix
- [ ] **Column sizing poorly handled** — fix

### Data entry flow (critical)
- **Current (wrong):** Clicking "Shipment" immediately shows a table with rows.
- **Correct first experience:** Present **two options first:**
  1. [ ] **Upload Data**
  2. [ ] **Manually Enter Data**
- [ ] User **chooses an option**, then proceeds (do not show empty table first for first-time users)

### Manual entry
- [ ] Must be **fast** (users may add 25, 50, 100 rows)
- [ ] Consider: **copy and paste**
- [ ] Consider: **auto-fill behavior**
- [ ] Consider: **value reuse**
- [ ] Consider: **quick duplication of rows**
- [ ] Process must be **fast and intuitive** or adoption will fail

### File uploads
- [ ] **Cannot use AI** — ingestion must be **programmatic**
- [ ] System must **parse the file structure** and **correctly map values**

---

## 9. SIDEBAR STRUCTURE

### Current issue
- Separation between "Main" and "Admin" **does not seem logical**

### Tasks
- [ ] Reconsider whether **Main vs Admin** separation makes sense
- [ ] **Study competitor dashboards** — how do they structure sidebars?
- [ ] **Study role-based navigation** — how do other platforms handle it?
- [ ] Propose and implement a **better structure** based on research

---

## 10. CAPABILITY MAP VISUALIZATION

### Problems
- [ ] **Not interactive** — add interactivity
- [ ] **Clickable nodes not clearly identifiable** — fix
- [ ] **Hover behavior unclear** — fix
- [ ] **Circles misaligned with their labels** — fix alignment
- [ ] **Layout lacks precision** — tighten layout
- [ ] **Text on the right is extremely small** — increase size/readability
- [ ] **Visualization dominates the space** — rebalance with text
- [ ] **Text difficult to read** — improve legibility

### Required
- [ ] **Reconsider the visualization design** — overall design is weak and needs a rethink

---

## Summary by priority (for “fix today” focus)

| Priority | Area | Key action |
|----------|------|------------|
| 1 | Power BI report | Structure, sidebar nav, brand colors, more viz types |
| 2 | KPIs | Document list; overlapping KPIs in both dashboard and report |
| 3 | Power BI viz list | Official list → markdown → then use in reports |
| 4 | Engineering | Local HTML, example data, endpoints, frontend–backend connection |
| 5 | Frontend layout | Reduce padding; fix column widths; use vertical space |
| 6 | Color palette | Eggshell white, black text, purple buttons, light green accents |
| 7 | Report builder | Per-KPI control, isolate metrics |
| 8 | Shipment UX | Two options first (Upload / Manual); fast manual entry; programmatic upload |
| 9 | Sidebar | Research competitors; reconsider Main vs Admin |
| 10 | Capability map | Interactivity, alignment, readability, redesign |
