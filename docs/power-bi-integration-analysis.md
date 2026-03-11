# Power BI Integration Analysis

## Current Visualization Architecture

The MPS platform currently uses **Recharts 3.7.0** with **100+ chart instances** across the application, fully themed via CSS custom properties.

### Chart Components (`components/charts/`)

| File | Chart Type | Details |
|------|-----------|---------|
| `donut-chart.tsx` | PieChart (donut) | Recharts PieChart, Pie, Cell, Legend, Tooltip |
| `pareto-chart.tsx` | ComposedChart (Bar + Line) | Dual-axis Pareto with bars + cumulative % line |
| `waterfall-chart.tsx` | BarChart (stacked) | Custom waterfall using stacked bars with transparent/visible technique |
| `scatter-quadrant.tsx` | ComposedChart (Scatter) | 2D scatter plot with quadrant dividers and optional diagonal reference |
| `progress-list.tsx` | Custom horizontal bars | CSS/Tailwind horizontal bar progress lists (not Recharts) |
| `timeline-heatmap.tsx` | Custom heatmap | CSS horizontal bar timeline heatmap (not Recharts) |
| `chart-container.tsx` | Wrapper component | Standardized container with title, subtitle, action slot, responsive height |
| `index.tsx` | Exports + design tokens | Exports all components + `CHART_COLORS`, `CATEGORY_COLORS`, `TOOLTIP_STYLE` |

### Design Token Application

All Recharts components use CSS custom properties from `app/globals.css`:

```tsx
stroke="var(--color-border-default)"         // Grid & axis lines
fill="var(--color-primary-400)"              // Bar/area fills
tick={{ fill: "var(--color-text-muted)" }}   // Axis labels
{...TOOLTIP_STYLE}                           // Consistent tooltip styling
```

**Typography in charts:**
- Axis labels: 11px, `text-text-muted`
- Chart title: 15px, bold, `text-text-primary`
- KPI labels: 11px bold uppercase
- KPI values: 26px extrabold

### Chart Distribution Across the App

| Location | Files | Chart Instances |
|----------|-------|----------------|
| Dashboard (`app/(app)/dashboard/page.tsx`) | 1 | 6 (3 inline Recharts + 3 imported custom components) |
| Report Pages (`app/(app)/reports/_components/`) | 9 content files | 35+ Recharts instances |
| Report Builder Widgets (`components/report-builder/widgets/`) | 6 chart widgets | 6 |
| Custom Chart Components (`components/charts/`) | 6 | Reused across dashboard + reports |
| **Total** | | **100+ visualization instances** |

### Report Builder Widgets

| File | Renders | Data Source |
|------|---------|-------------|
| `chart-volume-trend.tsx` | BarChart (monthly tonnage) | `computeMonthlyVolume()` |
| `chart-cost-comparison.tsx` | BarChart (dual bars: revenue vs cost) | `computeMonthlyCost()` |
| `chart-waste-donut.tsx` | DonutChart (waste category distribution) | `computeWasteCategoryDonut()` |
| `chart-top-streams.tsx` | ProgressList (horizontal bars) | `computeTopStreams()` |
| `chart-cost-waterfall.tsx` | WaterfallChart (cost flow) | `computeCostWaterfall()` |
| `chart-vendor-spend.tsx` | DonutChart (vendor cost breakdown) | `computeVendorSpend()` |

### Report Pages (9 Content Files)

| File | Chart Types |
|------|------------|
| `waste-trends-content.tsx` | BarChart, DonutChart, ProgressList, LineChart |
| `cost-analysis-content.tsx` | LineChart, BarChart, custom HeatmapCell |
| `regulatory-content.tsx` | BarChart, AreaChart, DonutChart |
| `data-quality-content.tsx` | BarChart, PieChart |
| `emissions-content.tsx` | AreaChart, BarChart, LineChart |
| `operations-content.tsx` | BarChart, LineChart |
| `logistics-content.tsx` | BarChart, ScatterChart |
| `vendor-intel-content.tsx` | BarChart, DonutChart, ProgressList |
| `light-load-content.tsx` | BarChart, LineChart |

### Recharts Type Frequency

| Type | Instances |
|------|-----------|
| BarChart | 40+ |
| LineChart | 12+ |
| AreaChart | 8+ |
| PieChart (donut) | 5+ |
| ComposedChart | 3 |
| ScatterChart | 2+ |
| Custom (ProgressList, Heatmap) | 10+ |

### PDF Export Pipeline

- **Route:** `/reports/builder` — single-page composer with sidebar gallery + live preview
- **Packages:** `@react-pdf/renderer` for native PDF generation
- **PDF chart components** in `components/report-builder/pdf-primitives.ts`: PdfBarChart, PdfGroupedBarChart, PdfDonutChart, PdfProgressList, PdfWaterfallChart, PdfTable, PdfKpiCard, PdfKpiRow
- **Flow:** User triggers export -> `exportReportPdf()` creates React element from `ReportPdfDocument` -> `@react-pdf/renderer` converts to PDF blob -> browser downloads as `{reportName}_MPS.pdf`

---

## Power BI Integration Approaches

### Approach 1: Embed Power BI Reports in the App

**Difficulty: Medium | Customization: Low-Medium**

Microsoft offers [Power BI Embedded](https://learn.microsoft.com/en-us/power-bi/developer/embedded/), which lets you iframe Power BI reports into web apps.

**Process:**
1. Recreate charts in Power BI Desktop (manual design work)
2. Publish to a Power BI workspace
3. Use `powerbi-client-react` SDK to embed reports/visuals in Next.js
4. Authenticate via Azure AD service principal or master user token

**Customization constraints:**
- Power BI visuals render inside an **iframe** — Tailwind classes, CSS custom properties, and design tokens cannot be applied
- A Power BI **theme JSON** (colors, fonts, backgrounds) gets ~70% of the way to matching the app aesthetic
- The rendering engine is Power BI's — padding, border-radius, tooltip behavior, axis styling, animation, and interaction patterns will never exactly match current Recharts look
- Charts will look like "Power BI charts styled to look like the app" rather than native
- Each embedded visual requires a **Power BI Pro or Premium Per User license** ($10-20/user/month) or **Power BI Embedded capacity** ($735+/month for A1 SKU)

**Pros:**
- Users can interact with Power BI features (drill-down, filters, cross-highlight)
- Dashboards can be managed in Power BI Service without app redeployment
- Familiar to Microsoft-native enterprise users

**Cons:**
- Visual seam between native UI and embedded Power BI
- Additional Azure infrastructure and licensing costs
- Authentication complexity (Azure AD integration)
- Performance overhead (iframe loading, Power BI service latency)

---

### Approach 2: Export Data to Power BI (Recommended)

**Difficulty: Low-Medium | Customization: N/A (separate tool)**

Instead of rendering Power BI inside the app, give users a way to push data to Power BI and build their own reports there.

**Process:**
1. Add "Export to Power BI" buttons alongside existing charts
2. Export data as `.csv` or `.xlsx` (CSV export already exists in `lib/report-utils.ts`)
3. Create a **Power BI template file** (`.pbit`) pre-built with chart layouts, colors, and data model — users open it and connect to exported data
4. Advanced: Use the **Power BI REST API** to programmatically push datasets to a user's Power BI workspace

**What to build:**
- "Open in Power BI" export buttons on dashboards and report pages
- Data formatting layer that structures exports for optimal Power BI consumption
- Branded **Power BI theme JSON** with MPS colors/fonts pre-configured
- Pre-built **Power BI report template** (`.pbit`) matching key dashboard layouts
- Optional: Power BI REST API integration for direct dataset push

**Pros:**
- App keeps its perfectly themed Recharts visuals (no visual compromise)
- Users who want Power BI get the full Power BI experience (not constrained in an iframe)
- Low engineering effort — mostly data formatting, not UI rewrite
- No additional licensing costs for the app itself
- Best of both worlds: polished in-app experience + full Power BI when needed

**Cons:**
- Data is a snapshot (not live-connected unless using REST API push)
- Users need their own Power BI licenses
- Template maintenance when data model changes

---

### Approach 3: Build Custom Power BI Visuals

**Difficulty: Very High | Customization: Very High (but painful)**

Build custom Power BI visuals using the [Power BI Visuals SDK](https://learn.microsoft.com/en-us/power-bi/developer/visuals/) that match the design system, then embed them.

**Process:**
1. For each of the ~10 chart types, build a custom Power BI visual using D3.js
2. Style each visual to match design tokens (hardcoded since Power BI visuals can't read CSS vars)
3. Package and publish to org's Power BI visual gallery
4. Embed custom visuals in app via Power BI Embedded

**Why this is impractical:**
- Power BI custom visuals use a sandboxed iframe with their own rendering pipeline — essentially writing D3.js charts from scratch inside Power BI's constraints
- Each of the 10 chart types becomes a separate TypeScript project with Power BI's `pbiviz` tooling
- Maintenance doubles — every design token change requires updating both the Tailwind theme AND each Power BI visual
- Development time: 2-4 weeks per custom visual x 10 types = **5-10 months of work**
- Lose all Recharts ecosystem benefits (responsive containers, composed charts, animation)

**Pros:**
- Highest possible visual fidelity in Power BI
- Full Power BI interactivity with custom look

**Cons:**
- Massive development and maintenance burden
- Requires specialized Power BI visual development expertise
- 5-10 month timeline
- Fragile — Power BI SDK updates can break custom visuals

---

## Comparison Matrix

| Factor | Embed (Approach 1) | Export (Approach 2) | Custom Visuals (Approach 3) |
|--------|-------------------|--------------------|-----------------------------|
| **Engineering effort** | Medium (3-4 weeks) | Low (1-2 weeks) | Very High (5-10 months) |
| **Visual consistency** | ~70% match | N/A (separate tool) | ~90%+ match |
| **Maintenance burden** | Medium (dual systems) | Low | Very High |
| **Monthly cost** | $735+/mo or $10-20/user | $0 | $735+/mo + dev time |
| **User experience** | Jarring (iframe seams) | Seamless (separate tool) | Best (if executed well) |
| **Time to production** | 3-4 weeks | 1-2 weeks | 5-10 months |
| **Realistic?** | Yes, with compromises | Yes | No, unless massive budget |

---

## Recommendation

**Approach 2 (Export to Power BI) is the recommended path.**

### Rationale

1. **The current Recharts setup is already excellent.** 100+ charts, fully themed with design tokens, PDF export, and a report builder. Replacing this with Power BI embeds would be a downgrade in visual quality and UX.

2. **The "heavily customized aesthetic" requirement eliminates embedding.** Power BI embeds will never look native. The iframe boundary, different font rendering, different tooltip behavior, and different responsive behavior always feels like a widget from another product pasted in.

3. **Power BI's strength is self-service analytics**, not embedded rendering. Users who want Power BI want to slice, dice, drill, and build their own views — things that work best in the full Power BI Desktop/Service experience, not constrained in an iframe.

4. **The practical implementation path:**
   - Keep the polished Recharts visuals in-app for day-to-day use
   - Add "Open in Power BI" export buttons that push datasets via REST API or download `.csv`/`.xlsx`
   - Ship a branded **Power BI theme JSON** + **report template** (`.pbit`) so exported data automatically gets MPS colors/fonts
   - Users get the best of both worlds: beautiful in-app experience + full Power BI when they need advanced analytics

### Implementation Scope (Approach 2)

| Task | Effort |
|------|--------|
| Data export formatting layer | 2-3 days |
| Power BI theme JSON creation | 1 day |
| Power BI report template (`.pbit`) | 2-3 days |
| "Export to Power BI" UI buttons | 1 day |
| Power BI REST API integration (optional) | 3-5 days |
| **Total** | **1-2 weeks** |
