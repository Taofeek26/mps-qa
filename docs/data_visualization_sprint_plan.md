# Data Visualization Sprint Plan

> **Goal:** Transform the MPS platform from basic charts into a multi-layered intelligence system across operational, managerial, and strategic lenses.
>
> **Reference:** `docs/data_visualization_strategy.md` — full visualization strategy and rationale.
>
> **Existing foundation:** Dashboard (6 KPI cards, 4 charts), 4 report pages (waste trends, cost analysis, light load, regulatory exports). All use Recharts + design token colors.

---

## Sprint 1: Dashboard Elevation

**Goal:** Upgrade the existing dashboard from flat charts to best-in-class scorecards and advanced chart types.

### 1.1 KPI Scorecards — Trend Arrows, Goals, Period Comparison

- [ ] Extend `KpiCard` component (or create `ScorecardCard`) to support:
  - Trend arrow with `+/- X%` vs. prior period
  - Goal indicator (target value + green check / red X)
  - Color-coded status bar (on-track / at-risk / behind)
- [ ] Compute prior-period values (last month vs. current month) for all 6 dashboard KPIs
- [ ] Add goal thresholds (configurable per metric)
- [ ] Example: `Total Shipments: 4,382 | +12% vs last month | Goal: 4,000 ✓`

### 1.2 Volume Trend — Dual-Layer Area Chart

- [ ] Replace single-series area chart with dual-layer:
  - **Layer 1:** Shipment count (left Y-axis)
  - **Layer 2:** Standardized weight in lbs (right Y-axis)
- [ ] Add dual Y-axis with Recharts `YAxis yAxisId="left"` / `yAxisId="right"`
- [ ] Insight callout: divergence between shipment count and weight indicates load consolidation changes

### 1.3 Cost Comparison — Mirrored Bar Chart

- [ ] Replace side-by-side bar chart with mirrored/butterfly bar chart:
  - MPS cost bars extend left (negative direction)
  - Customer cost bars extend right (positive direction)
- [ ] Margin gap visible as whitespace between bars
- [ ] Add margin $ amount as label in the gap

### 1.4 Top Waste Streams — Pareto Chart

- [ ] Replace horizontal bar chart with Pareto:
  - **Bars:** Volume per waste stream (sorted descending)
  - **Line overlay:** Cumulative % (right Y-axis)
- [ ] Add 80% threshold reference line
- [ ] Insight: instantly shows which streams account for 80% of total volume

### 1.5 Vendor Expiration — Timeline Heatmap

- [ ] Replace simple list with a timeline heatmap grid:
  - **X-axis:** Months (next 6 months)
  - **Cells:** Color intensity = number of vendors expiring that month
- [ ] Clickable cells to see vendor names
- [ ] Color scale: green (0) → yellow (1-2) → red (3+)

---

## Sprint 2: Report Page Upgrades

**Goal:** Elevate the 4 existing report pages with advanced visualization types.

### 2.1 Waste Trends — Streamgraph

- [ ] Add streamgraph visualization (new chart component) showing waste category volumes flowing over time
- [ ] Use Recharts `AreaChart` with `stackOffset="silhouette"` for streamgraph effect
- [ ] Toggle between current stacked bar view and streamgraph view
- [ ] Better for long-term category evolution analysis

### 2.2 Cost Analysis — Waterfall Chart

- [ ] Build reusable `WaterfallChart` component
- [ ] Flow: `Customer Revenue → - Haul → - Disposal → - Fuel → - Environmental → + Rebates = Net Margin`
- [ ] Positive steps in green, negative steps in red, totals in blue
- [ ] Add to cost analysis page as "Margin Waterfall" section

### 2.3 Light Load — Efficiency Scatter Plot

- [ ] Add scatter plot above existing histogram:
  - **X-axis:** Actual weight (lbs)
  - **Y-axis:** Target load weight (lbs)
  - **Diagonal line:** 100% efficiency reference
- [ ] Points below diagonal = underfilled containers
- [ ] Color dots by waste category or container type
- [ ] Tooltip: site name, waste type, efficiency %

### 2.4 Regulatory — Compliance Matrix Tree

- [ ] Add expandable hierarchy view for hazardous waste data:
  - **Level 1:** Waste Code → volume count
  - **Level 2:** Site → breakdown per site
  - **Level 3:** Treatment Method → detail
- [ ] Use indented table with expand/collapse (not a chart — a structured data tree)
- [ ] Summary row per level with totals

---

## Sprint 3: Financial Intelligence Hub

**Goal:** New analytics section focused on margin, cost drivers, and financial performance.

**Route:** `/reports/financial` (add to reports hub)

### 3.1 Margin Heatmap Grid

- [ ] Build `HeatmapGrid` component
- [ ] **Rows:** Waste types
- [ ] **Columns:** Sites
- [ ] **Cell color:** Margin % (red = negative, white = 0, green = positive)
- [ ] Cell value: margin $ amount
- [ ] Hover: full cost breakdown tooltip
- [ ] Sortable rows/columns by total margin

### 3.2 Stacked Cost Composition

- [ ] Stacked bar chart: Haul + Disposal + Fuel + Environmental + Other per month
- [ ] Toggle between MPS cost view and Customer cost view
- [ ] Show total as line overlay

### 3.3 Margin by Cost Component — Contribution Chart

- [ ] Per-fee-type margin bars:
  - Haul margin = Customer Haul - MPS Haul
  - Disposal margin = Customer Disposal - MPS Disposal
  - etc.
- [ ] Stacked to show total margin contribution

### 3.4 Rebate Analysis — Bubble Chart

- [ ] **X-axis:** Waste type
- [ ] **Y-axis:** Rebate amount ($)
- [ ] **Bubble size:** Shipment volume (lbs)
- [ ] Color by customer
- [ ] Use Recharts `ScatterChart` with `ZAxis` for bubble size

### 3.5 Cost Efficiency Quadrant

- [ ] Scatter plot with quadrant lines:
  - **X-axis:** Cost per lb
  - **Y-axis:** Shipment weight
- [ ] Quadrants: Efficient (high weight, low cost) → Inefficient (low weight, high cost)
- [ ] Label quadrants with descriptive text
- [ ] Color by waste category

---

## Sprint 4: Operational Intelligence

**Goal:** Performance dashboards for sites, transporters, and waste operations.

**Route:** `/reports/operations` (add to reports hub)

### 4.1 Monthly Site Summary — Small Multiples

- [ ] Build `SmallMultiples` component
- [ ] Each site renders as a mini area chart (120x80px) showing monthly volume
- [ ] Grid layout: 3-4 columns, auto-rows
- [ ] Highlight site with biggest change (up or down)
- [ ] Click to expand into full chart

### 4.2 Site Comparison — Ranked Leaderboard

- [ ] Table with sparkline column:
  - Rank | Site Name | Volume (lbs) | Sparkline (6-mo trend) | Cost | Margin %
- [ ] Build `Sparkline` component using inline SVG or Recharts mini line
- [ ] Sortable by any metric column
- [ ] Top 3 get gold/silver/bronze indicators

### 4.3 Waste Type Treemap

- [ ] Build `Treemap` component using Recharts `Treemap`
- [ ] **Box size:** Volume (lbs)
- [ ] **Box color:** Cost intensity (lighter = cheaper, darker = expensive)
- [ ] Click to drill into waste type detail
- [ ] Label: waste type name + volume

### 4.4 Hazardous vs Non-Hazardous — Diverging Bar

- [ ] Diverging horizontal bar chart:
  - **Left:** Non-hazardous volume (green bars)
  - **Right:** Hazardous volume (red bars)
- [ ] Grouped by site or month
- [ ] Center axis = 0, bars extend in both directions

### 4.5 Transporter Performance Leaderboard

- [ ] Table: Transporter | Shipments | Volume | Avg Miles | Avg Cost | Rating
- [ ] Star rating (1-5) based on composite score
- [ ] Sparkline for monthly volume trend
- [ ] Sort by any column

---

## Sprint 5: Data Quality & Compliance Dashboard

**Goal:** Proactive data health monitoring and compliance gap identification.

**Route:** `/reports/data-quality` (add to reports hub)

### 5.1 Data Health Scorecard

- [ ] Overall Data Quality Score: `XX%` (large circular gauge)
- [ ] Breakdown cards with traffic lights:
  - Missing classification codes (source/form/treatment/EWC)
  - Null transporter assignments
  - Placeholder values (N/A, empty)
  - Invalid dates (return manifest before shipment)
  - Duplicate manifest candidates
- [ ] Each card: count + % of total + severity badge (green/yellow/red)

### 5.2 Duplicate Manifest Detection Table

- [ ] Grouped table: manifest numbers appearing 2+ times
- [ ] Columns: Manifest #, Occurrence Count, Dates, Sites, Waste Types
- [ ] Highlight rows where dates differ (likely real duplicates vs. multi-line manifests)
- [ ] Action: link to shipment detail drawer

### 5.3 Profile Coverage Donut

- [ ] Donut chart: shipments WITH waste profile vs WITHOUT
- [ ] Breakdown by waste category (hazardous without profile = high severity)

### 5.4 Manifest Return Lag Distribution

- [ ] Histogram: days between `shipment_date` and `return_manifest_date`
- [ ] Buckets: 0-7d, 7-14d, 14-30d, 30-60d, 60d+
- [ ] Reference line at 30-day compliance threshold
- [ ] Color: green (on-time) → red (overdue)

### 5.5 Container Fill Rate Gauges

- [ ] Row of gauge/donut charts, one per container type
- [ ] Fill rate = actual weight / target load weight (averaged across shipments)
- [ ] Green (>80%), Yellow (60-80%), Red (<60%)
- [ ] Show shipment count below each gauge

### 5.6 Service Frequency Calendar Heatmap

- [ ] Calendar grid: days of the month × sites
- [ ] Cell color: shipment happened (green) / expected but missed (red) / not scheduled (gray)
- [ ] Based on `service_frequency` expected vs. actual shipment dates
- [ ] Monthly view with month navigation

---

## Sprint 6: Vendor Intelligence

**Goal:** Vendor governance, risk visibility, and diversity tracking.

**Route:** `/reports/vendor-intelligence` (add to reports hub)

### 6.1 Vendor Risk Pyramid

- [ ] Pyramid/funnel chart:
  - **Top (narrow):** High risk vendors — count + total shipment volume
  - **Middle:** Medium risk
  - **Bottom (wide):** Low risk
- [ ] Click each tier to see vendor list
- [ ] Color: red top, yellow middle, green bottom

### 6.2 Vendor DBE / Diversity Spend

- [ ] Donut: volume handled by DBE vendors vs non-DBE
- [ ] $ amount and % for each segment
- [ ] Trend line showing DBE % over time (line chart below donut)

### 6.3 Vendor Expiration Gantt

- [ ] Horizontal timeline:
  - Each vendor = one row
  - Bar length = date entered → expiration date
  - Color: green (active), yellow (<90 days), red (expired)
- [ ] Build using horizontal bar chart with custom date axis
- [ ] Sort by expiration date (soonest first)

### 6.4 Vendor Compliance Status Matrix

- [ ] Table: Vendor | Status | Risk | Last Reviewed | Expiration | Shipments | Volume
- [ ] Status badges: Active (green), Under Review (yellow), Expired (red)
- [ ] Row highlight for vendors with compliance gaps

---

## Sprint 7: Facility & Logistics Analytics

**Goal:** Receiving facility utilization and logistics efficiency.

**Route:** `/reports/logistics` (add to reports hub)

### 7.1 Waste Flow Network Diagram

- [ ] Sankey-style flow diagram:
  - **Left nodes:** Sites (sources)
  - **Right nodes:** Receiving Facilities (destinations)
  - **Flow width:** Proportional to volume
- [ ] Build using D3 Sankey or a Recharts-compatible Sankey library
- [ ] Color flows by waste category
- [ ] Hover: volume, cost, shipment count

### 7.2 Facility Utilization Gauges

- [ ] Per-facility capacity gauge:
  - Total volume received this period
  - Compared to max capacity (if known) or historical average
- [ ] Gauge: circular or horizontal progress bar
- [ ] Alert badge if facility exceeds historical norm

### 7.3 Distance Distribution Histogram

- [ ] Histogram: miles to facility grouped in buckets
  - 0-25 mi, 25-50 mi, 50-100 mi, 100-200 mi, 200+ mi
- [ ] Colored by waste category (stacked)
- [ ] Average distance KPI card above histogram

### 7.4 Receiving Facility Summary Table

- [ ] Table: Facility | Company | State | EPA ID | Shipments | Volume | Avg Miles | Total Cost
- [ ] Sortable, filterable
- [ ] Sparkline for monthly volume trend

---

## Sprint 8: Advanced & Specialized Views

**Goal:** Specialized charts for specific analysis needs — lower priority, high impact when needed.

### 8.1 Treatment Method Sunburst (Dashboard upgrade)

- [ ] Replace dashboard pie chart with Sunburst:
  - **Inner ring:** Treatment method
  - **Outer ring:** Waste types within each method
- [ ] Requires a sunburst-capable library (e.g., `recharts` custom or `nivo`)
- [ ] Fallback: nested donut chart

### 8.2 Weight Normalization Comparison

- [ ] Grouped bar chart comparing lbs vs kg vs unit count per waste stream
- [ ] Useful for multi-unit analysis
- [ ] Route: add as section to waste trends page

### 8.3 GHG Emissions Intensity

- [ ] Line chart: estimated kg CO2 per ton of waste over time
- [ ] Requires emissions factor mapping (treatment method → CO2 factor)
- [ ] Add as new report page: `/reports/emissions`
- [ ] ESG reporting value

### 8.4 State-Level Choropleth Map

- [ ] US map colored by waste volume per state
- [ ] Requires geographic rendering library (e.g., `react-simple-maps`)
- [ ] Click state to filter dashboard
- [ ] Route: add as section to operations page or standalone

### 8.5 Customer Revenue Matrix

- [ ] Data table: Customer | Sites | Volume | Revenue | MPS Cost | Margin $ | Margin %
- [ ] Sortable, with conditional cell coloring (margin cells green/red)
- [ ] Expandable rows to show per-site breakdown

### 8.6 Code Distribution Hierarchy Tree

- [ ] Tree diagram: Source Code → Form Code → Treatment Code
- [ ] Node size by shipment count
- [ ] Expandable/collapsible levels
- [ ] Route: add to regulatory page as analysis section

---

## Reusable Chart Components to Build

These components will be created across sprints and reused throughout:

| Component | Sprint | Used In |
|---|---|---|
| `ScorecardCard` | 1 | Dashboard |
| `ParetoChart` | 1 | Dashboard, Waste Trends |
| `TimelineHeatmap` | 1 | Dashboard, Vendor Intel |
| `WaterfallChart` | 2 | Cost Analysis |
| `ScatterQuadrant` | 2, 3 | Light Load, Cost Efficiency |
| `HeatmapGrid` | 3 | Financial Hub |
| `SmallMultiples` | 4 | Operations |
| `Sparkline` | 4 | Leaderboards |
| `TreemapChart` | 4 | Operations |
| `DivergingBar` | 4 | Operations |
| `CircularGauge` | 5 | Data Quality, Container Fill |
| `CalendarHeatmap` | 5 | Service Frequency |
| `GanttChart` | 6 | Vendor Expiration |
| `SankeyFlow` | 7 | Logistics |
| `ChoroplethMap` | 8 | Geographic |

---

## New Pages & Routes

| Sprint | Route | Title | Nav Group |
|---|---|---|---|
| 3 | `/reports/financial` | Financial Intelligence | Reports |
| 4 | `/reports/operations` | Operational Intelligence | Reports |
| 5 | `/reports/data-quality` | Data Quality | Reports |
| 6 | `/reports/vendor-intelligence` | Vendor Intelligence | Reports |
| 7 | `/reports/logistics` | Logistics & Facilities | Reports |
| 8 | `/reports/emissions` | GHG Emissions | Reports |

---

## Dependencies & Libraries

| Library | Purpose | Sprint |
|---|---|---|
| `recharts` | Already installed — primary charting | All |
| `react-simple-maps` | US choropleth map | 8 |
| `d3-sankey` or `@nivo/sankey` | Sankey/flow diagram | 7 |
| `@nivo/sunburst` (optional) | Sunburst chart | 8 |

> Prefer building with Recharts wherever possible to minimize bundle size. Only add new dependencies for charts that Recharts genuinely cannot render.

---

## Execution Priority & Effort

| Sprint | Focus | New Pages | New Components | Effort | Priority |
|---|---|---|---|---|---|
| **Sprint 1** | Dashboard elevation | 0 | 3 | Medium | Critical |
| **Sprint 2** | Report page upgrades | 0 | 3 | Medium | Critical |
| **Sprint 3** | Financial intelligence | 1 | 3 | High | High |
| **Sprint 4** | Operational intelligence | 1 | 5 | High | High |
| **Sprint 5** | Data quality & compliance | 1 | 4 | High | High |
| **Sprint 6** | Vendor intelligence | 1 | 3 | Medium | Medium |
| **Sprint 7** | Logistics & facilities | 1 | 2 | Medium | Medium |
| **Sprint 8** | Advanced & specialized | 1 | 4 | High | Low |

**Total:** ~6 new pages, ~27 new chart components, ~95 checklist items
