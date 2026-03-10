# Design Audit: Making the Dashboard Look Designed (Not Generic)

This document is based on research into **why UIs look AI-generated or generic** and a **codebase audit** of the MPS dashboard. Each section lists the problem, the research-backed fix, and the concrete change in this repo.

---

## Research summary: What makes design feel “generic”

- **Mathematically perfect but emotionally cold spacing** — same padding everywhere, no rhythm.
- **Generic card-based layouts** — every card same size, same style, grid of clones.
- **Limited color use** — one accent, repeated; charts use defaults instead of brand.
- **Template-driven patterns** — Inter + gray + blue, no typographic hierarchy.
- **Only a few visualization types** — same chart repeated; no variety.
- **No micro-interactions or personality** — flat hovers, no emphasis hierarchy.
- **Weak visual hierarchy** — page title and body text too similar; “squint test” fails.

**Designer-level fixes:** Type scale (5–7 levels, ratio 1.2–1.333), varied card sizes/weights, brand-aligned chart colors, tighter controlled spacing, intentional empty space, and subtle motion/feedback.

---

## 1. Layout & spacing (excessive padding, ~50% vertical use)

### Problem
- Main content uses `p-4 lg:p-6` with `max-w-[1440px]`; combined with `space-y-8` and `pb-6` on PageHeader, the top and inner padding consume a lot of vertical space.
- Stakeholder feedback: “Pages use only ~50% of vertical space,” “excessive padding at top,” “inner page padding extremely large.”

### Fix
- **Reduce top and inner padding** so content can use more vertical space.
- **Slightly reduce vertical rhythm** (e.g. `space-y-8` → `space-y-6`) where it doesn’t hurt readability.
- **Keep a single source of truth** for spacing (e.g. 8px grid) but use it in a tighter, more deliberate way.

### In codebase
- **`components/layout/app-shell.tsx`** — Main wrapper: consider `p-4 lg:px-6 lg:pt-4 lg:pb-6` (or similar) so top padding is slightly less than side/bottom.
- **`components/ui/page-header.tsx`** — Reduce `pb-6` to `pb-4` so the header doesn’t push content down as much.
- **Dashboard page** — Use `space-y-6` instead of `space-y-8` for overview content to increase density without crowding.

---

## 2. Typography hierarchy (flat, no clear “designer” scale)

### Problem
- Page title is `text-xl`; section titles are `text-sm font-semibold uppercase` or `text-[15px]`. There’s no clear type scale (e.g. 24px → 18px → 14px) so the hierarchy feels flat and template-like.
- Research: Professional UIs use 5–7 levels (e.g. display 32–50px, section 20–30px, body 14–18px, meta 12–14px) with a consistent ratio (1.2–1.333).

### Fix
- **Page title:** Slightly larger and bolder (e.g. `text-2xl` or use `--font-size-2xl`), optional `tracking-tight`.
- **Section / card titles:** One step below (e.g. `text-base font-semibold` or 18px) instead of all `text-sm`.
- **Chart/card titles:** Use a consistent “tertiary” level (e.g. 15px or `text-[15px]` is fine) but ensure it’s clearly smaller than the page title.
- **Body and meta:** Keep 14px body, 12px meta; ensure line-height is set (e.g. 1.5 body, 1.25 headings).

### In codebase
- **`components/ui/page-header.tsx`** — Bump title to `text-2xl` (or `text-xl` + `font-extrabold`) and optional `tracking-tight`.
- **`components/ui/section-header.tsx`** — Use `text-base font-semibold` instead of `text-sm uppercase` for a clearer hierarchy (or keep uppercase but increase size).
- **`components/charts/chart-container.tsx`** — Chart title already `text-[15px]`; ensure subtitle is clearly smaller (e.g. `text-xs`).

---

## 3. KPI and cards: everything the same size (repetitive grid)

### Problem
- All six KPI cards use the same component and the same grid: `grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]`. Every card looks identical; no “hero” or emphasis.
- Research: “Vary card sizes”; “different widths or heights create rhythm”; “meaningful variation” so important content stands out.

### Fix
- **Introduce one level of hierarchy:** e.g. make the first 2 KPIs (e.g. Total Shipments + Total Revenue) span more or appear larger (e.g. `lg:col-span-2` on first row for “hero” KPIs), or give them a slightly different treatment (e.g. subtle border or background).
- **Or:** Keep grid but add a “featured” variant to KpiCard (e.g. larger value font, or accent border-left) and use it for 1–2 key metrics.

### In codebase
- **`app/(app)/dashboard/page.tsx`** — KPI grid: use a two-row layout on large screens: first row two “hero” KPIs (e.g. Total Shipments, Total Revenue) with larger min-width or col-span; second row four smaller KPIs. Or add `variant="featured"` to first two KpiCards and style accordingly in **`components/ui/kpi-card.tsx`**.

---

## 4. Chart colors not fully brand-aligned

### Problem
- Charts use `CATEGORY_COLORS` and `CHART_COLORS` that reference `--color-teal-400`, `--color-teal-600`. Theme-brand didn’t define `--color-teal-*`, so Tailwind’s default teal was used and didn’t match primary (#00BD9D).
- “Colors do not match the client brand” was called out.

### Fix
- **Define teal in theme-brand** as an alias of primary so all chart references resolve to brand teal.
- **Use primary/secondary (and semantic) tokens** in chart constants so changing the theme updates charts.

### In codebase
- **`app/globals.css`** — In `.theme-brand`, add `--color-teal-200`, `--color-teal-400`, `--color-teal-600` mapped to primary (e.g. same as primary-200, primary-400, primary-600). **Done.**
- **`components/charts/index.tsx`** — Already uses `var(--color-primary-400)` and `var(--color-teal-400)`; with teal defined in theme, charts are now brand-aligned.

---

## 5. Chart containers and cards: one style for everything

### Problem
- Every chart sits in a `ChartContainer` with the same border, radius, and padding. All content cards use the same `Card` variant. No visual “accent” for the most important block.
- Research: “Adjust backgrounds and layouts”; “bolder changes add dynamics.”

### Fix
- **Primary chart or “hero” block:** Add a subtle accent (e.g. left border in primary color, or slightly different background) for the first or most important chart on a page.
- **Chart container:** Optional prop e.g. `accent="left"` that adds `border-l-4 border-primary-400` or similar so one chart feels “featured.”

### In codebase
- **`components/charts/chart-container.tsx`** — Add optional `accent?: 'left' | 'none'` and when `accent="left"` apply a left border or inset shadow in primary. Use it on the first chart on the dashboard (e.g. Revenue vs Cost Trend).

---

## 6. Micro-interactions and hover states

### Problem
- KPI cards and many list items have no hover or focus treatment; the UI feels static.
- Research: “Add micro-interactions and personality”; “hover states, filters, drill-down.”

### Fix
- **KPI cards:** Subtle hover (e.g. `transition-colors`, `hover:border-primary-200` or `hover:shadow-sm`) so they feel interactive.
- **Tables:** Already have row hover; ensure it’s consistent (e.g. `bg-bg-hover`).
- **Buttons/links:** Already use motion; keep focus ring and contrast.

### In codebase
- **`components/ui/kpi-card.tsx`** — Add `transition-colors duration-150 hover:border-primary-200/80` (or hover:shadow-sm) and `cursor-default` so it doesn’t look like a button but still responds.

---

## 7. Section and page structure (clear hierarchy)

### Problem
- SectionHeader uses `text-sm font-semibold uppercase` which can look generic; page title is only `text-xl`. There’s no strong “entry point” for the eye.
- Research: “Squint test” — critical elements should stand out; primary content in top-left.

### Fix
- **One clear page title** per route (already there); make it the largest text on the page (e.g. 24px).
- **Section titles** one step below (e.g. 16–18px), not all-caps everywhere so the page doesn’t feel like a form.
- **Primary KPI or primary chart** placed where the eye lands first (top-left or top-center).

### In codebase
- **PageHeader** — Larger title (see §2).
- **SectionHeader** — Slightly larger, optional lowercase for less “form-like” feel (see §2).

---

## 8. Left/right padding and column widths (tables)

### Problem
- Stakeholder: “Left/right padding reduces space available for data tables”; “some columns truncated with '...'”; “some columns that need minimal width take too much space.”
- Main content has `p-4 lg:p-6` and `max-w-[1440px]`; on smaller viewports or with many columns, tables get squeezed.

### Fix
- **Slightly reduce horizontal padding** on large screens (e.g. `lg:px-5` or `lg:px-6` kept but ensure tables can use `min-w-0` and flex to fill).
- **Table columns:** Use explicit `minWidth` / `size` in column defs where needed; allow important columns more width and shrink secondary columns. (Handled in data-table/ag-grid column definitions per page.)
- **Responsive:** Consider horizontal scroll for tables with many columns instead of truncating everything.

### In codebase
- **app-shell** — Main content: already `max-w-[1440px]`; padding tweak in §1 helps.
- **Shipments page / DataTable** — Ensure column definitions set sensible `size` or `minWidth` so critical columns (e.g. ID, date) don’t truncate; narrow columns (e.g. status) don’t get excessive width. Audit **`app/(app)/shipments/_components/shipment-columns.tsx`** and table config.

---

## 9. Summary checklist (implemented or to do)

| # | Issue | Fix | Status |
|---|--------|-----|--------|
| 1 | Excessive padding; low vertical use | Tighter main padding; reduce PageHeader bottom; space-y-6 on dashboard | To do in code |
| 2 | Flat typography | Page title 2xl; section title base; consistent scale | To do in code |
| 3 | All KPI cards identical | Hero row or featured variant for 1–2 KPIs | To do in code |
| 4 | Chart teal not from theme | Add --color-teal-* in .theme-brand | Done |
| 5 | All chart containers same | Optional accent (e.g. left border) on primary chart | To do in code |
| 6 | No KPI hover feedback | Subtle hover on KpiCard | To do in code |
| 7 | Weak section hierarchy | SectionHeader size/style (see §2) | To do in code |
| 8 | Table column widths | Per-page column sizes; min-width for key columns | Audit per page |

---

## References

- Why AI-generated designs look the same (Vandelay Design).
- How to break the AI-generated UI curse (DEV Community).
- Typography hierarchy and type scale (FontFYI, design.dev, Pacgie).
- Dashboard UX mistakes (Medium, Raw.Studio, HackerNoon).
- Variety in card layouts (Readable by Design).
- Tailwind customization (Tailwind docs, theme variables).
