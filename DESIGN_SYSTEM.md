# MPS Dashboard Design System

Our design system is the foundation of the MPS Dashboard visual and interactive identity. Built entirely around modern CSS capabilities featuring Custom Properties (`@theme`) within **Tailwind CSS (v4)**, it gives our application a modular, highly scalable, and structurally sound aesthetics backbone.

This document serves as the single source of truth for color palettes, typography, theme behaviors, spacing mechanisms, and UI component standards.

---

## 🎨 Token-Driven Theming

The platform heavily utilizes semantic tokens instead of hard-coded values. This enables graceful degradation and easy swapping of overarching themes. We currently support **three robust themes** driven by `.theme-*` CSS wrappers.

### 1. Default (Industrial Theme)
A clean, highly professional mode prioritizing data density and clarity. Highly suitable for neutral enterprise workflows.
- **Primary Scale (Trust / Authority):** Cool blues anchoring focus states (`#4F89B8`) and interactive layers (from `#0F2A3D` to `#EDF4FB`).
- **Secondary Scale (ESG / Responsibility):** Deep mature teals and greens.
- **Neutral Scale:** Balanced Grays containing structural lines, deep textual contrasts (`#1A1F24`), and subtle backgrounds (`#F8FAFB`).

### 2. Warm Theme (Notion / Stripe Inspired)
Triggered by wrapping layouts in `.theme-warm`. This injects an approachable, modern, and high-energy feel into the UI.
- **Primary Scale:** Warm Indigos (`#312E81` to `#EEF2FF`). Focus rings highlight specifically at `#6366F1`.
- **Secondary Scale:** Warm Emerald (`#059669`).
- **Neutral Scale:** Warm Stones and subtle organic undertones (`#0C0A09` to `#FAFAF9`).
- **Surfaces and Borders:** Implements slightly softer radiuses and warmer borders to invite engagement.

### 3. Brand Theme (MPS Dashboard — Active)
Triggered by `.theme-brand`. Professional, balanced palette with strong hierarchy.
- **Primary (Brand Teal):** `#00BD9D` at 400 for links, focus, accents, and active states. Darker teals (500–700) for primary buttons and emphasis so the light brand color doesn’t wash out.
- **Button / CTA:** Same teal family — `#0D796C` (button-400) for main actions so CTAs have strong contrast and readability on white.
- **Neutral Scale:** Slate-based grays (`#0F172A` → `#F8FAFC`) for clear typographic hierarchy and accessible contrast.
- **Surfaces:** Soft app background `#F8FAFC`, white cards, subtle borders `#E2E8F0`. Semantic colors (success, warning, error) are refined to stay cohesive with the teal palette.

---

## 🔠 Typography

Our typographic scale maps directly to the system intent for maximum cross-platform legibility.
- **Font Sans (`var(--font-sans)`):** `ui-sans-serif, system-ui, sans-serif`. Primary typeface serving standard body text, tables, and headers.
- **Font Mono (`var(--font-mono)`):** `ui-monospace, SFMono-Regular, monospace`. Used for code snippets, raw data, or strict alignments.

---

## 🔳 Semantic & Interactive Tokens

To keep intents aligned with actions, we enforce strict semantic token colors universally:

| Intent | Base Color (Default) | Use Case |
| :--- | :--- | :--- |
| **Success** | `#3F8B65` | Approvals, active states, positive trends |
| **Warning** | `#C48124` | Requires attention, pending, pauses |
| **Error** | `#B04141` | Deletions, failures, strict blocks |

### Focus Rings
Accessibility is deeply integrated via the `.focus-ring` utility. 
Instead of standard browser outlines, focusable components trigger a double-box-shadow (e.g., `box-shadow: 0 0 0 2px var(--color-bg-card), 0 0 0 4px var(--color-focus-ring)`) ensuring absolute visibility against any background.

### Scrollbars
Scrollbars are systematically thinned via webkit overrides to a `6px` track thickness. They operate transparently, manifesting a `var(--color-gray-300)` rounded thumb on hover interaction. Provides custom styling utilizing `.scrollbar-hide` for embedded overflow elements.

---

## 📐 Shape & Surfaces

Aesthetic shape determines structural layout priority:
- **`--radius-sm` (8px):** Imparted on inputs, small action buttons, tag badges, and inner grid cells.
- **`--radius-lg` (16px):** Designed for outer card bodies, large modals, and major panel distinctions.
- **Surfaces:** Segmented cleanly. We delineate backgrounds using `--color-bg-app` for standard depth, `--color-bg-card` for elevated contents, and `--color-bg-subtle` / `--color-bg-hover` for interactive backgrounds.

---

## 📊 AG Grid Integration (`.ag-theme-mps`)

Because our product depends heavily on dense data interactions, a unified grid integration bridges external DOM dependencies with our tailwind variables.

- Integrates `var(--font-sans)` directly into table cells ensuring typeface unification.
- Controls data sizing (`13px` base) maintaining density standards (`40px` row heights).
- Adopts semantic highlighting seamlessly (e.g. `--ag-selected-row-background-color: var(--color-primary-50)`).
- Error bounds automatically flag as `1.5px solid var(--color-error-500)` combined with light error-base backgrounds.
- Completely strips out AG popup clashing, ensuring that tooltips and bespoke editor dropdowns fall back to our system surfaces.

---

*This overarching Design System bridges Next.js, Radix UI Primitives, and AG Grid contexts into one cohesive, dynamic application state.*
