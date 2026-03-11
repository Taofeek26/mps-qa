# Dashboard Gap Analysis: Reference HTML vs Current App

> **Date:** 2026-03-07
> **Reference file:** `docs/reference/mps_dashboard_final.html`
> **Compared against:** Current MPS POC app (dashboard + all report pages)

---

## Reference HTML Structure

The reference HTML is a **7-tab analytics platform** with a global date range filter:

1. **Executive Summary**
2. **Cost Analysis**
3. **Waste Trends**
4. **GHG & Sustainability**
5. **Regulatory Compliance**
6. **GEM Report (Ford)**
7. **GMR2 Report (GM)**

Our app uses a **separate-page architecture**: 1 dashboard + 10 report pages + 1 regulatory export page.

---

## TAB-BY-TAB COMPARISON

### 1. Executive Summary (Reference) vs Dashboard (Our App)

| Element | Reference HTML | Our App | Status |
|---------|---------------|---------|--------|
| **KPI: Total Shipments** | Count | Count | SAME |
| **KPI: Total Revenue** | Customer billed $ | Margin % (partial) | DIFFERENT — we show %, not raw $ |
| **KPI: Total MPS Cost** | Platform payable $ | — | MISSING |
| **KPI: Cost Per Ton** | Blended avg $ | — | MISSING |
| **KPI: Margin Spread** | $ amount + negative warning | Margin % | DIFFERENT — % not $ |
| **KPI: Diversion Rate** | % non-landfill | % | SAME |
| **KPI: Total Volume** | — | lbs | EXTRA |
| **KPI: Hazardous %** | — | % | EXTRA |
| **KPI: Active Sites** | — | Count | EXTRA |
| **Chart: Revenue vs Cost Monthly Trend** | Line chart (rev + cost) | Bar chart (MPS vs customer cost) | SIMILAR — different viz type |
| **Chart: Waste Category Revenue Split** | Donut (Haz/Non-Haz/Recycling) | — | MISSING |
| **Chart: Cost Per Ton by Waste Type** | Bar chart | — | MISSING |
| **Chart: Regional Performance** | Grouped bar (rev vs cost by state) | — | MISSING |
| **Chart: Waste Volume Trend** | — | Area chart (volume + shipments) | EXTRA |
| **Chart: Top Waste Streams Pareto** | — | Pareto chart | EXTRA |
| **Widget: Vendor Expirations** | — | Timeline heatmap | EXTRA |
| **Widget: Contextual Alerts** | — | Expiring vendors, pending, voided | EXTRA |
| **Widget: Recent Shipments** | — | Data table | EXTRA |
| **Widget: Recent Activity** | — | Audit log feed | EXTRA |

---

### 2. Cost Analysis (Reference) vs Cost Analysis Report (Our App)

| Element | Reference HTML | Our App | Status |
|---------|---------------|---------|--------|
| **KPI: Total Revenue** | Yes | Yes (as "Customer Revenue" in Financial) | SAME |
| **KPI: Total Cost** | Yes | Yes | SAME |
| **KPI: Rebate Credits** | Yes | Yes (as "Total Rebates") | SAME |
| **KPI: Cost Per Ton** | Blended CPT | — | MISSING |
| **KPI: Haul Cost** | $ + % of total | — | MISSING |
| **KPI: Margin** | — | % | EXTRA |
| **Chart: Revenue vs Cost Trend** | Dual line chart | Line chart | SAME |
| **Chart: Vendor Margin Spread** | Bar (margin per stream, red=loss) | Cost per Ton by Waste Stream | DIFFERENT — cost/ton, not margin spread |
| **Chart: Haul vs Disposal Split** | Donut (Haul/Disposal/Fuel/Other) | MPS Cost Breakdown bar chart | DIFFERENT VIZ — donut vs bar |
| **Chart: Rebate Realization** | Progress bar | In waterfall only | DIFFERENT |
| **Chart: Cost by Transporter** | Ranked progress bars | — | MISSING |
| **Chart: Cost by Site** | Ranked progress bars | — | MISSING |
| **Chart: Margin Waterfall** | — | Waterfall chart | EXTRA |

---

### 3. Waste Trends (Reference) vs Waste Trends Report (Our App)

| Element | Reference HTML | Our App | Status |
|---------|---------------|---------|--------|
| **KPI: Total Tons** | Tons | Lbs | DIFFERENT UNIT |
| **KPI: Shipments** | Count | Count | SAME |
| **KPI: Container Utilization** | % | — (in Light Load report) | SPLIT to different page |
| **KPI: Avg Load** | Lbs per shipment | — | MISSING |
| **KPI: Diversion Rate** | — | % | EXTRA |
| **KPI: Hazardous %** | — | % | EXTRA |
| **Chart: Monthly Volume Trend** | Line (tons) | Area (volume + categories) | SIMILAR |
| **Chart: Treatment Method Distribution** | Donut | Horizontal bar | DIFFERENT VIZ — same data |
| **Chart: Waste Type Distribution** | Progress bars (tons + shipments) | Pareto chart | DIFFERENT VIZ — same concept |
| **Chart: Container Utilization** | Grouped bar (actual vs target) | — (in Light Load report) | SPLIT |

---

### 4. GHG & Sustainability (Reference) vs Emissions Report (Our App)

| Element | Reference HTML | Our App | Status |
|---------|---------------|---------|--------|
| **KPI: Total GHG** | t CO2e | Metric tons | SAME |
| **KPI: Diversion Rate** | % | — | MISSING |
| **KPI: Recycling Offset** | Carbon savings (t) | CO2 Avoided (mt) | SAME |
| **KPI: Scope 3 Proxy** | Transport emissions (t CO2) | — | MISSING |
| **KPI: Intensity** | — | kg CO2/ton | EXTRA |
| **KPI: Waste Processed** | — | Tons | EXTRA |
| **Chart: GHG by Waste Category** | Bar (t CO2e, green=offsets) | — | MISSING |
| **Chart: Diversion Rate Monthly** | Line (%) | — | MISSING |
| **Chart: Scope 3 Logistics Proxy** | Line (t CO2 monthly) | — | MISSING |
| **Table: GHG Breakdown** | Full table (category, qty, factor, CO2e, impact) | Partial — "Emissions Factor Reference" only | DIFFERENT |
| **Chart: Monthly CO2 Emissions** | — | Area chart | EXTRA |
| **Chart: Emissions Intensity Trend** | — | Area chart | EXTRA |
| **Chart: Emissions by Treatment** | — | Horizontal bar | EXTRA |
| **Table: Emissions by Site** | — | Data table | EXTRA |

---

### 5. Regulatory Compliance (Reference) vs Regulatory Page (Our App)

| Element | Reference HTML | Our App | Status |
|---------|---------------|---------|--------|
| **KPI: Total Manifests** | Count | — | MISSING |
| **KPI: Manifest Rate** | % submitted | — | MISSING |
| **KPI: Pending** | Missing return count | — | MISSING |
| **KPI: RCRA Regulated** | Count + % of total | — | MISSING |
| **Chart: Manifest Completion** | Donut (submitted vs pending) | — | MISSING |
| **Chart: RCRA Generator Status** | Progress bars by site (LQG/SQG/VSQG) | — | MISSING |
| **Chart: Turnaround by Transporter** | Progress bars (avg days) | — | MISSING |
| **Chart: Vendor Compliance** | List with active badges | — | MISSING |
| **Table: Pending Manifests Detail** | Full table (10 columns) | — | MISSING |
| **Report Export Cards** | — | Biennial, GEM, GMR2 export | EXTRA |

> **NOTE:** Our Regulatory page is fundamentally different — it's a report **export tool**, not an analytics dashboard. The reference has full analytics with manifest tracking, RCRA status determination, turnaround monitoring, and a pending manifests detail table.

---

### 6. GEM Report - Ford (Reference) vs Our App

| Element | Reference HTML | Our App | Status |
|---------|---------------|---------|--------|
| **KPI: GEM Records** | Count | — (export only) | MISSING |
| **KPI: Total Revenue** | $ | — | MISSING |
| **KPI: Total MPS Cost** | $ | — | MISSING |
| **Table: GEM Submission Records** | 14-column data table | CSV export only | MISSING |

> Our app only has CSV export for GEM — no visual dashboard or data table for review.

---

### 7. GMR2 Report - GM (Reference) vs Our App

| Element | Reference HTML | Our App | Status |
|---------|---------------|---------|--------|
| **KPI: GMR2 Records** | Count | — (export only) | MISSING |
| **KPI: Non-Haz Count** | Count | — | MISSING |
| **KPI: Hazardous Count** | Count | — | MISSING |
| **Chart: Treatment Type Revenue** | Bar chart | — | MISSING |
| **Chart: Monthly Tonnage Trend** | Line chart | — | MISSING |
| **Table: GMR2 Submission Records** | 12-column data table | CSV export only | MISSING |

> Our app only has CSV export for GMR2 — no visual dashboard, charts, or data table.

---

## Summary Scorecard

### Counts

| Metric | Count |
|--------|-------|
| Total KPIs in reference HTML | **27** (across 7 tabs) |
| Total charts/viz in reference HTML | **20** |
| Total data tables in reference HTML | **3** |
| KPIs we show that **match** reference | **~8** |
| KPIs we show **differently** (same concept, different format) | **~4** |
| KPIs from reference we are **missing** | **~15** |
| KPIs we have that are **not in reference** | **~10** |
| Charts that **match** reference viz type | **~3** |
| Charts that are **similar** (same data, different viz) | **~4** |
| Charts from reference we are **missing** | **~13** |
| Charts we have that are **not in reference** | **~15** |

---

### Top 6 Gaps (Reference has, we don't)

1. **Regulatory Compliance analytics** — Reference has a full dashboard with manifest tracking, RCRA generator status by site (LQG/SQG/VSQG), transporter turnaround times, vendor compliance list, and pending manifests detail table. Our page is export-only.

2. **GEM & GMR2 data visibility** — Reference shows KPIs and full data tables for review before export. Our app does blind CSV export with no visual preview or analytics.

3. **Cost by Transporter / Cost by Site** — Reference has ranked progress bar visualizations for both. We have neither.

4. **Scope 3 & GHG by Category** — Reference has Scope 3 logistics proxy (transport emissions), GHG emissions by waste category bar chart, and monthly diversion rate trend. We lack all three.

5. **Regional Performance** — Reference shows revenue vs cost grouped by state. We have no geographic analysis.

6. **Container Utilization in Waste Trends** — Reference includes actual-vs-target container load as a grouped bar chart. We split this to a separate Light Load report with different framing.

---

### Top 10 Extras (We have, reference doesn't)

1. **Contextual alerts** — Expiring vendors, pending shipments, voided shipments (clickable cards)
2. **Recent Shipments table** — Last 10 shipments on dashboard
3. **Activity feed** — Audit log with avatar initials and relative timestamps
4. **Vendor expiration timeline heatmap** — 6-month forward look
5. **Pareto analysis** — Top waste streams with 80/20 cumulative line
6. **Prior-period comparison** — Trend arrows on every KPI card with % change
7. **Goal tracking** — Target values and met/unmet status on KPI cards
8. **5 additional report pages** — Financial Intelligence, Logistics & Facilities, Operations, Light Load, Vendor Intelligence (+ Data Quality)
9. **Margin Waterfall chart** — Revenue to net margin breakdown
10. **Advanced visualizations** — Treemap, scatter plots, small multiples, streamgraph toggle, bubble charts

---

### Architectural Difference

| Aspect | Reference HTML | Our App |
|--------|---------------|---------|
| **Structure** | Single page, 7 tabs | Separate pages (1 dashboard + 10 reports + 1 regulatory) |
| **Filtering** | Global date range filter in topbar | Per-page date range + customer/site filters |
| **Data source** | Single embedded CSV/array | Mock data module with accessor functions |
| **Charting** | Chart.js | Recharts |
| **State** | Vanilla JS globals | React state + useMemo |

---

### Status Legend

| Status | Meaning |
|--------|---------|
| SAME | Same data, same (or very similar) visualization |
| SIMILAR | Same data concept, different visualization type |
| DIFFERENT | Same general concept but different metric, unit, or framing |
| MISSING | Present in reference, absent in our app |
| EXTRA | Present in our app, absent in reference |
| SPLIT | Data exists but in a different page/report |
