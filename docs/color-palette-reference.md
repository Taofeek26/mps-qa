# MPS Dashboard — Color Palette Reference

**Live source of truth:** All dashboard colors (and typography tokens) are in **`app/globals.css`**. Edit the **`.theme-brand`** block to change the dashboard.

**Anchors:**
- **Primary (brand):** `#00BD9D` — links, focus, accents, active tab, highlights.
- **Button / CTA:** `#0D796C` (darker teal) — main actions for strong contrast and readability.

---

## Brand & Primary

| Name | Hex | Usage |
|------|-----|--------|
| **Primary (brand)** | `#00BD9D` | Links, focus rings, active tab, form accents, charts, badges. |
| **Primary (darker)** | `#009B85` / `#0D796C` | Primary buttons, strong CTAs, active nav text. |
| **Primary (light bg)** | `#F0FDFA` | Subtle backgrounds (badges, selected row, command palette). |
| **Button (CTA)** | `#0D796C` | Main action buttons, pagination current, Report Builder “added”, user avatar. |
| **Button hover** | `#009B85` | Hover for primary actions. |

---

## Text & Hierarchy

| Name | Hex | Usage |
|------|-----|--------|
| **Text primary** | `#0F172A` | Headings, titles, table headers, primary copy. |
| **Text secondary** | `#475569` | Body, labels, table content. |
| **Text muted** | `#64748B` | Placeholders, hints, disabled, captions. |
| **Text on dark** | `#FFFFFF` | Text on primary/button backgrounds. |

---

## Surfaces & Borders

| Name | Hex | Usage |
|------|-----|--------|
| **App background** | `#F8FAFC` | Page background behind cards. |
| **Card** | `#FFFFFF` | Cards, modals, dropdowns, inputs. |
| **Subtle** | `#F1F5F9` | Table header, inactive tabs, secondary panels. |
| **Hover** | `#E2E8F0` | Row hover, list item hover. |
| **Border default** | `#E2E8F0` | Card border, input border, dividers. |
| **Border strong** | `#CBD5E1` | Emphasis borders. |

---

## Semantic

| Name | Hex | Usage |
|------|-----|--------|
| **Success** | `#059669` | Success toasts, positive KPIs, “submitted” status. |
| **Warning** | `#D97706` | Warnings, “pending” status, caution banners. |
| **Error** | `#DC2626` | Errors, delete actions, validation errors. |

---

## Quick reference: token → hex

| Token | Hex |
|-------|-----|
| Primary 400 (brand) | `#00BD9D` |
| Primary 500–600 (CTAs) | `#009B85`, `#0D796C` |
| Button 400 | `#0D796C` |
| Text primary | `#0F172A` |
| Text secondary | `#475569` |
| Text muted | `#64748B` |
| Border default | `#E2E8F0` |
| Bg app | `#F8FAFC` |
| Bg card | `#FFFFFF` |
| Focus ring | `#00BD9D` |

---

*Keep this file in sync with `app/globals.css` (`.theme-brand`) and component usage.*
