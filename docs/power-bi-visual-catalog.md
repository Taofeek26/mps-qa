# Power BI Visual Catalog & MPS Mapping

## Complete Power BI Built-in Visual Types (40+)

### 1. Categorical Comparison

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 1 | **Bar Chart** (horizontal) | Horizontal bars comparing values across categories | Long category names, many categories, negative values |
| 2 | **Column Chart** (vertical) | Vertical bars comparing values | Time periods, shorter category names |
| 3 | **Stacked Bar/Column** | Bars divided into segments showing composition | Part-to-whole within categories |
| 4 | **100% Stacked Bar/Column** | Each bar = 100%, showing proportions | Comparing proportions across groups |
| 5 | **Clustered Bar/Column** | Side-by-side bars for direct comparison | Comparing multiple measures per category |
| 6 | **Combo Chart** | Column + Line on same visual, dual Y-axes | Two measures with different scales (e.g., revenue vs units) |

### 2. Time-Based Trends

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 7 | **Line Chart** | Connected data points showing trends | Continuous time series, trend patterns |
| 8 | **Area Chart** | Line chart with filled area below | Magnitude of change over time |
| 9 | **Stacked Area Chart** | Multiple filled areas stacked | Multiple series contributing to a total over time |
| 10 | **Ribbon Chart** | Shows rank changes over time with flowing ribbons | Which categories lead/lag in each period |

### 3. Part-to-Whole Relationships

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 11 | **Pie Chart** | Circular chart divided into slices | Simple proportions (<8 categories) |
| 12 | **Donut Chart** | Pie chart with hollow center | Same as pie, with space for a central metric |
| 13 | **Treemap** | Nested rectangles sized by value | Hierarchical data, many categories, proportions |
| 14 | **Sunburst** | Multi-level concentric ring chart | Hierarchical part-to-whole across levels |

### 4. Distribution & Relationships

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 15 | **Scatter Chart** | X/Y data points showing relationships | Correlations, clusters, outliers between 2 variables |
| 16 | **Bubble Chart** | Scatter + circle size as 3rd dimension | Three-variable relationship analysis |
| 17 | **Dot Plot** | Compare multiple measures by magnitude | Side-by-side magnitude comparison |
| 18 | **High-Density Scatter** | Optimized scatter for large datasets | Thousands of data points, aggregated overlap |

### 5. Sequential Processes

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 19 | **Funnel Chart** | Progressively decreasing stages | Conversion tracking, pipeline stages |
| 20 | **Waterfall Chart** | Running total with positive/negative contributions | P&L statements, cost buildup, budget variance |

### 6. Geographic / Map Visuals

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 21 | **Filled Map (Choropleth)** | Regions colored by data intensity | Regional comparison (sales by state/country) |
| 22 | **Azure Maps** | Modern mapping with bubble/heat/bar/pie layers | Rich geographic visualizations, store locations |
| 23 | **Shape Map** | Custom geographic boundaries | Custom territories, floor plans, non-standard regions |
| 24 | **ArcGIS Maps** | Advanced mapping with geocoding & demographics | Spatial analysis, delivery routes, demographic overlays |

### 7. Key Metrics & Progress

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 25 | **Card** | Single prominent number | Key metrics (total revenue, count, score) |
| 26 | **Multi-row Card** | Multiple metrics in a card layout | Dashboard KPI summaries |
| 27 | **KPI Visual** | Current value + target + trend indicator | Performance against goals |
| 28 | **Gauge Chart** | Radial dial with needle | Single value progress toward a goal |

### 8. Detailed Data & Exact Values

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 29 | **Table** | Rows and columns of data | Exact values, multi-attribute records |
| 30 | **Matrix** | Multi-dimensional grid with hierarchies + drill-down | Financial statements, pivot-table-style analysis |

### 9. AI-Powered Visuals

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 31 | **Decomposition Tree** | Interactive drill-down across dimensions (AI suggests next) | Exploratory root-cause analysis |
| 32 | **Key Influencers** | AI identifies which factors most influence a metric | Understanding drivers of churn, satisfaction, etc. |
| 33 | **Anomaly Detection** | Auto-identifies unusual spikes/dips in time series | Detecting outliers in operational data |
| 34 | **Smart Narrative** | AI-generated text summaries of trends and insights | Executive summaries, automated commentary |
| 35 | **Q&A Visual** | Natural language query -> auto-generated visual | Ad-hoc questions during presentations |

### 10. Slicers & Filtering

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 36 | **Button Slicer** | Clickable buttons for filtering | Small number of filter options |
| 37 | **List Slicer** | Dropdown or scrollable list | Many filter options |
| 38 | **Input Slicer** | Type values or ranges directly | Numeric/date range filtering |
| 39 | **Date Range Slicer** | Calendar picker or slider for date periods | Time-based filtering |

### 11. Specialized Visuals

| # | Visual Type | Description | Best For |
|---|------------|-------------|----------|
| 40 | **Image Visual** | Static or data-driven images | Logos, product images, conditional imagery |
| 41 | **Paginated Report Visual** | Pixel-perfect paginated report embedded in PBI | Print-ready layouts, invoices, regulatory forms |
| 42 | **R Visual** | Custom visualization using R scripts | Advanced statistical analysis |
| 43 | **Python Visual** | Custom visualization using Python libraries | ML outputs, specialized charts |
| 44 | **Power Apps Visual** | Embedded Power Apps within reports | Data write-back, approval workflows |
| 45 | **Text Box / Shapes** | Annotations, titles, descriptions | Report structure and context |
| 46 | **Buttons / Navigators** | Interactive navigation and bookmarks | Multi-page report navigation |

### 12. Notable AppSource Marketplace Visuals (300+ available)

| Visual | Description | Best For |
|--------|-------------|----------|
| **Bullet Chart** | Replaces gauge; compact bar with target marker | Comparing measure against target in small space |
| **Tornado Chart** | Back-to-back horizontal bars | Sensitivity analysis, comparing two groups |
| **Chord Diagram** | Circular flow showing interrelationships | Relationship/flow between categories |
| **Radar Chart** | Multi-axis spider/web chart | Comparing multiple variables for one entity |
| **Histogram** | Distribution frequency bars | Data distribution analysis |
| **Stream Graph** | Stacked flowing organic shapes around central axis | Volume trends with aesthetic flow |
| **Hexbin Scatter** | Scatter with hexagonal density bins | High-density point distribution |
| **Calendar Chart** | Values distributed across calendar grid | Daily patterns, seasonality |
| **Chiclet Slicer** | Image-based filter buttons | Visual filtering with logos/icons |
| **Synoptic Panel** | Custom images with colored data-bound regions | Floor plans, process diagrams, custom maps |
| **Aster Plot** | Donut variant with depth + width encoding | Two-measure comparison per category |

---

## Mapping: MPS Current Visuals -> Power BI Equivalents

### Dashboard (`app/(app)/dashboard/page.tsx`)

| MPS Visual | Current Implementation | Power BI Equivalent | Match Quality |
|-----------|----------------------|---------------------|---------------|
| 6 KPI Cards | Custom `kpi-card` component | **Card** / **Multi-row Card** / **KPI Visual** | Excellent - native PBI strength |
| Monthly Volume Trend (AreaChart) | Recharts stacked AreaChart | **Stacked Area Chart** | Excellent |
| Revenue by Waste Category (BarChart) | Recharts stacked BarChart | **Stacked Column Chart** | Excellent |
| Cost per Ton (BarChart) | Recharts BarChart | **Clustered Column Chart** | Excellent |
| Waste Category Distribution (DonutChart) | Custom `donut-chart.tsx` | **Donut Chart** | Excellent |
| Top Waste Streams (ParetoChart) | Custom `pareto-chart.tsx` (Bar + Line) | **Combo Chart** (Column + Line) | Good - native combo chart supports dual axis |
| Vendor Expiration (TimelineHeatmap) | Custom CSS heatmap | **Matrix + Conditional Formatting** | Fair - no direct equivalent, matrix with color rules approximates it |

### Report: Waste Trends (`waste-trends-content.tsx`)

| MPS Visual | Power BI Equivalent | Match Quality |
|-----------|---------------------|---------------|
| Volume & Containers BarChart | **Clustered/Stacked Column** | Excellent |
| Waste Distribution DonutChart | **Donut Chart** | Excellent |
| Waste Streams ProgressList | **Bar Chart** (sorted) or **Bullet Chart** (marketplace) | Good |
| Trend LineChart | **Line Chart** | Excellent |

### Report: Financial / Cost Analysis (`cost-analysis-content.tsx`)

| MPS Visual | Power BI Equivalent | Match Quality |
|-----------|---------------------|---------------|
| Cost Trend LineChart | **Line Chart** | Excellent |
| Revenue vs Cost BarChart | **Clustered Column** or **Combo Chart** | Excellent |
| Margin Heatmap (custom cells) | **Matrix + Conditional Formatting** (color scales) | Good - PBI matrix supports background color rules |
| Cost Waterfall | **Waterfall Chart** | Excellent - native PBI visual |

### Report: Regulatory (`regulatory-content.tsx`)

| MPS Visual | Power BI Equivalent | Match Quality |
|-----------|---------------------|---------------|
| Compliance BarChart | **Stacked Column** | Excellent |
| Trend AreaChart | **Area Chart** | Excellent |
| Category DonutChart | **Donut Chart** | Excellent |
| Compliance Scorecard | **KPI Visual** + **Card** | Good |

### Report: Operations (`operations-content.tsx`)

| MPS Visual | Power BI Equivalent | Match Quality |
|-----------|---------------------|---------------|
| Performance BarChart | **Column Chart** | Excellent |
| Volume LineChart | **Line Chart** | Excellent |

### Report: Logistics (`logistics-content.tsx`)

| MPS Visual | Power BI Equivalent | Match Quality |
|-----------|---------------------|---------------|
| Route BarChart | **Bar Chart** | Excellent |
| Distance ScatterChart | **Scatter Chart** | Excellent |

### Report: Emissions (`emissions-content.tsx`)

| MPS Visual | Power BI Equivalent | Match Quality |
|-----------|---------------------|---------------|
| GHG AreaChart | **Stacked Area Chart** | Excellent |
| Emissions BarChart | **Column Chart** | Excellent |
| Trend LineChart | **Line Chart** | Excellent |

### Report: Vendor Intel (`vendor-intel-content.tsx`)

| MPS Visual | Power BI Equivalent | Match Quality |
|-----------|---------------------|---------------|
| Vendor Cost DonutChart | **Donut Chart** | Excellent |
| Performance BarChart | **Bar Chart** | Excellent |
| Ranking ProgressList | **Bar Chart** (sorted) | Good |

### Report: Data Quality (`data-quality-content.tsx`)

| MPS Visual | Power BI Equivalent | Match Quality |
|-----------|---------------------|---------------|
| Distribution BarChart | **Column Chart** or **Histogram** (marketplace) | Good-Excellent |
| Quality PieChart | **Pie/Donut Chart** | Excellent |

### Report Builder Widgets (`components/report-builder/widgets/`)

| Widget | Power BI Equivalent | Match Quality |
|--------|---------------------|---------------|
| Volume Trend (BarChart) | **Column Chart** | Excellent |
| Cost Comparison (dual BarChart) | **Clustered Column** or **Combo Chart** | Excellent |
| Waste Donut | **Donut Chart** | Excellent |
| Top Streams (ProgressList) | **Bar Chart** (sorted, horizontal) | Good |
| Cost Waterfall | **Waterfall Chart** | Excellent |
| Vendor Spend (DonutChart) | **Donut Chart** | Excellent |

---

## Match Quality Summary

| Match Level | Count | Details |
|-------------|-------|---------|
| **Excellent** (direct PBI equivalent) | ~85% of visuals | Bar, Column, Line, Area, Donut, Pie, Scatter, Waterfall, Combo, Cards, KPI |
| **Good** (close equivalent with workaround) | ~10% of visuals | ProgressList -> sorted Bar, Heatmap -> Matrix + conditional formatting, Pareto -> Combo |
| **Fair** (requires custom visual or significant workaround) | ~5% of visuals | TimelineHeatmap, custom scorecards |

### Visuals with No Direct PBI Built-in Equivalent

| MPS Visual | Issue | Best PBI Workaround |
|-----------|-------|---------------------|
| **ProgressList** (horizontal bars with labels) | No built-in "progress bar" visual | Horizontal **Bar Chart** (sorted) gets close; **Bullet Chart** from marketplace is better |
| **TimelineHeatmap** (vendor expiration grid) | No calendar/timeline heatmap built-in | **Matrix** with **conditional formatting** (color scales) or **Calendar Chart** from marketplace |
| **ScatterQuadrant** (with divider lines) | Scatter exists but quadrant lines need Analytics pane | **Scatter Chart** + **Reference Lines** via Analytics pane (constant lines for quadrant dividers) |
| **ParetoChart** (bar + cumulative line) | No built-in Pareto | **Combo Chart** (column + line, secondary axis for cumulative %) — very close |
| **Custom HeatmapCell** (margin heatmap in cost analysis) | No heatmap grid visual | **Matrix** + **conditional formatting** with color scales |

---

## Power BI Features That ADD Capability (Not in Current App)

These Power BI features go beyond what Recharts provides:

| Feature | What It Does | MPS Value |
|---------|-------------|-----------|
| **Cross-filtering/highlighting** | Click a data point in one chart, all others filter | Interactive exploration without custom code |
| **Drill-down** | Click to go from Year -> Quarter -> Month -> Day | Hierarchical data exploration |
| **Drill-through** | Right-click a data point -> navigate to detail page | Shipment-level detail from summary charts |
| **Decomposition Tree** | AI-guided drill into dimensions | "Why did costs spike?" — auto-explores dimensions |
| **Key Influencers** | AI identifies what drives a metric | "What factors drive high waste costs?" |
| **Anomaly Detection** | Auto-flags unusual data points in time series | Flag unusual shipment volumes or costs |
| **Smart Narrative** | Auto-generated text summaries | Executive report commentary |
| **Q&A Visual** | Natural language queries | "Show me waste volume by client last quarter" |
| **Small Multiples** | Same chart repeated per category | One volume chart per client, side-by-side |
| **Forecasting** (Analytics pane) | Predict future values from historical data | Forecast waste volumes, costs |
| **Bookmarks** | Save specific filter/visual states | Guided report walkthroughs |
| **Row-Level Security** | Restrict data by user identity | Client sees only their data |

---

## Sources

- [Visualization Types in Power BI (Microsoft Learn)](https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-types-for-reports-and-q-and-a)
- [Choose the Best Visual for Your Data (Microsoft Learn)](https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-decision-guide)
- [Overview of Visualizations in Power BI (Microsoft Learn)](https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualizations-overview)
- [Power BI Visuals List (MindMajix)](https://mindmajix.com/power-bi-visualization-types)
