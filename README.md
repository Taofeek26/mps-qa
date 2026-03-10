# MPS Dashboard Platform

The MPS dashboard is a `Next.js 16` waste shipment operations platform with analytics, reports, admin management, a custom report builder, and an internal design-system showcase. Favicon and PWA icons use `public/Favicon.png`.

## Quick Start

```bash
pnpm install
pnpm dev
```

Useful scripts:

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`

## Current Stack

- `Next.js 16.1.6`
- `React 19.2.3`
- `TypeScript`
- `Tailwind CSS v4`
- `radix-ui`
- `motion`
- `nuqs`
- `@tanstack/react-table`
- `ag-grid-react`
- `recharts`
- `react-hook-form` + `zod`
- `xlsx`
- `@react-pdf/renderer`

## Product Areas

- `Dashboard`: KPI cards, charts, activity, and operational alerts
- `Shipments`: searchable shipment list with export, detail drawers, and delete/edit flows
- `New Shipment Entry`: Entry choice (Upload data / Manually enter data), file upload with sample CSV download, AG Grid with paste/import, add N rows, duplicate, fill down, and step indicator
- `Reports`: tabbed analytics across waste, cost, operations, logistics, emissions, and more
- `Report Builder`: custom report assembly with PDF export
- `Admin`: clients, sites, vendors, facilities, reference data, users, and audit log
- `Design System`: live component and token showcase

## Architecture At A Glance

- `app/`: App Router routes, route groups, and layouts
- `components/ui/`: shared design-system primitives
- `components/layout/`: shell, sidebar, topbar, mobile navigation, route guard
- `components/charts/`: reusable Recharts wrappers
- `components/report-builder/`: widget rendering and PDF/report assembly
- `components/patterns/`: higher-order reusable feature patterns like CRUD tables
- `lib/mock-data.ts`: current in-memory data source and mutation layer
- `lib/types.ts`: shared domain model
- `lib/navigation.ts`: nav, labels, and breadcrumbs
- `app/globals.css`: design tokens and theme definitions

## Documentation

- **[Completed changes](./docs/completed-changes-from-original.md)** — Full changelog with file references.
- **[Changes summary](./docs/CHANGES-SUMMARY.md)** — Short list of all completed changes.
- **[Architecture & design system](./docs/dashboard-architecture-and-design-system.md)** — Stack, data flow, design tokens.
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** — Brand theme and token summary.

## Important Notes

- The app currently uses a mock in-memory data layer, not a real backend.
- Auth is client-side and persisted in `localStorage`.
- The global runtime theme is `theme-brand`.
- Favicon and app icons: `public/Favicon.png` (used in layout and `manifest.json`).
